import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertProjectMember } from "@/lib/project-auth";
import { handleApiError } from "@/lib/api-errors";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { error } = await assertProjectMember(projectId, session.user.id);
  if (error) return error;

  try {
    const now = new Date();

    const [tasksByStatus, tasksByPriority, overdueTasks, members, tasksByAssignee] =
      await Promise.all([
        db.task.groupBy({
          by: ["status"],
          where: { projectId },
          _count: { id: true },
        }),

        db.task.groupBy({
          by: ["priority"],
          where: { projectId },
          _count: { id: true },
        }),

        db.task.count({
          where: {
            projectId,
            status: { not: "DONE" },
            dueDate: { lt: now },
          },
        }),

        db.projectMember.findMany({
          where: { projectId },
          select: {
            role: true,
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        }),

        // Aggregated in the DB — returns one row per (assignee, status) pair
        // instead of shipping every task row for in-memory counting.
        db.task.groupBy({
          by: ["assigneeId", "status"],
          where: { projectId, assigneeId: { not: null } },
          _count: { id: true },
        }),
      ]);

    const totalTasks = tasksByStatus.reduce((sum, s) => sum + s._count.id, 0);

    const doneTasks =
      tasksByStatus.find((s) => s.status === "DONE")?._count.id ?? 0;
    const completionRate =
      totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const byStatus = {
      TODO: tasksByStatus.find((s) => s.status === "TODO")?._count.id ?? 0,
      IN_PROGRESS:
        tasksByStatus.find((s) => s.status === "IN_PROGRESS")?._count.id ?? 0,
      DONE: doneTasks,
    };

    const byPriority = {
      LOW: tasksByPriority.find((p) => p.priority === "LOW")?._count.id ?? 0,
      MEDIUM:
        tasksByPriority.find((p) => p.priority === "MEDIUM")?._count.id ?? 0,
      HIGH: tasksByPriority.find((p) => p.priority === "HIGH")?._count.id ?? 0,
    };

    const assigneeTotals = new Map<string, { assigned: number; done: number }>();
    for (const row of tasksByAssignee) {
      if (!row.assigneeId) continue;
      const entry = assigneeTotals.get(row.assigneeId) ?? { assigned: 0, done: 0 };
      entry.assigned += row._count.id;
      if (row.status === "DONE") entry.done += row._count.id;
      assigneeTotals.set(row.assigneeId, entry);
    }

    const memberStats = members.map((m) => {
      const entry = assigneeTotals.get(m.user.id) ?? { assigned: 0, done: 0 };
      return {
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        tasksAssigned: entry.assigned,
        tasksCompleted: entry.done,
        completionRate:
          entry.assigned > 0 ? Math.round((entry.done / entry.assigned) * 100) : 0,
      };
    });

    return NextResponse.json({
      stats: {
        totalTasks,
        completionRate,
        overdueTasks,
        byStatus,
        byPriority,
        members: memberStats,
      },
    });
  } catch (err) {
    return handleApiError(err, "Failed to load project stats");
  }
}
