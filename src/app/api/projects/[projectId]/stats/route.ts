import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertProjectMember } from "@/lib/project-auth";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { error } = await assertProjectMember(projectId, session.user.id);
  if (error) return error;

  const now = new Date();

  // Run all queries in parallel for performance
  const [tasksByStatus, tasksByPriority, overdueTasks, members, tasks] =
    await Promise.all([
      // Total tasks grouped by status
      db.task.groupBy({
        by: ["status"],
        where: { projectId },
        _count: { id: true },
      }),

      // Total tasks grouped by priority
      db.task.groupBy({
        by: ["priority"],
        where: { projectId },
        _count: { id: true },
      }),

      // Overdue: not DONE and dueDate is in the past
      db.task.count({
        where: {
          projectId,
          status: { not: "DONE" },
          dueDate: { lt: now },
        },
      }),

      // UPDATED:
      // We now fetch project members directly without using taskAssignments.
      // The previous version used m.user.taskAssignments, but that relation
      // does not exist in the current Prisma schema.
      // So instead, we fetch members here...
      db.projectMember.findMany({
        where: { projectId },
        select: {
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),

      // UPDATED:
      // ...and fetch project tasks separately using the real schema fields.
      // The schema supports a single assignee per task through assigneeId,
      // so we use that to calculate per-member productivity.
      db.task.findMany({
        where: { projectId },
        select: {
          id: true,
          status: true,
          assigneeId: true,
        },
      }),
    ]);

  // Total task count
  const totalTasks = tasksByStatus.reduce((sum, s) => sum + s._count.id, 0);

  // Completion rate (percentage of DONE tasks)
  const doneTasks =
    tasksByStatus.find((s) => s.status === "DONE")?._count.id ?? 0;
  const completionRate =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Format tasksByStatus as a simple object
  const byStatus = {
    TODO: tasksByStatus.find((s) => s.status === "TODO")?._count.id ?? 0,
    IN_PROGRESS:
      tasksByStatus.find((s) => s.status === "IN_PROGRESS")?._count.id ?? 0,
    DONE: doneTasks,
  };

  // Format tasksByPriority as a simple object
  const byPriority = {
    LOW: tasksByPriority.find((p) => p.priority === "LOW")?._count.id ?? 0,
    MEDIUM:
      tasksByPriority.find((p) => p.priority === "MEDIUM")?._count.id ?? 0,
    HIGH: tasksByPriority.find((p) => p.priority === "HIGH")?._count.id ?? 0,
  };

  // Format per-member productivity
  const memberStats = members.map((m) => {
    // UPDATED:
    // Since we now use single-assignee tasks, we count all tasks
    // where task.assigneeId matches the current member's user id.
    const assignedTasks = tasks.filter((t) => t.assigneeId === m.user.id);

    // Count only completed assigned tasks
    const completedTasks = assignedTasks.filter(
      (t) => t.status === "DONE"
    ).length;

    return {
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      tasksAssigned: assignedTasks.length,
      tasksCompleted: completedTasks,
      completionRate:
        assignedTasks.length > 0
          ? Math.round((completedTasks / assignedTasks.length) * 100)
          : 0,
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
}