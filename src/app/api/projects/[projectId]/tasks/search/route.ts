import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
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
  const query = searchParams.get("q")?.trim();
  const status = searchParams.get("status") ?? undefined;
  const priority = searchParams.get("priority") ?? undefined;

  // q is required
  if (!query) {
    return NextResponse.json(
      { error: "Missing search query. Use ?q=your+search+term" },
      { status: 400 }
    );
  }

  const tasks = await db.task.findMany({
    where: {
      projectId,
      // Combine text search with optional filters
      ...(status && { status: status as "TODO" | "IN_PROGRESS" | "DONE" }),
      ...(priority && { priority: priority as "LOW" | "MEDIUM" | "HIGH" }),
      OR: [
        // Search in task title
        { title: { contains: query } },
        // Search in task description
        { description: { contains: query } },
        // Search by assignee name
        {
          assignees: {
            some: {
              user: { name: { contains: query } },
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