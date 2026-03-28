import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskSearchSchema } from "@/lib/validators";
import { assertProjectMember } from "@/lib/project-auth";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { error } = await assertProjectMember(projectId, session.user.id);
  if (error) return error;

  const { searchParams } = new URL(req.url);

  // Validate incoming search query and optional filters
  const parsed = taskSearchSchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { q, status, priority } = parsed.data;

  const tasks = await db.task.findMany({
    where: {
      projectId,

      // Combine text search with optional filters
      ...(status && { status }),
      ...(priority && { priority }),

      OR: [
        // Search in task title
        { title: { contains: q } },

        // Search in task description
        { description: { contains: q } },

        // Search by assignee name
        {
          assignees: {
            some: {
              user: { name: { contains: q } },
            },
          },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      projectId: true,
      createdAt: true,
      updatedAt: true,
      assignees: {
        select: {
          taskId: true,
          userId: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json({ tasks, total: tasks.length });
}
