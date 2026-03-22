import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProjectTaskSchema } from "@/lib/validators";
import { assertProjectMember } from "@/lib/project-auth";

type Params = { params: Promise<{ projectId: string; taskId: string }> };

const assigneeSelect = {
  select: { id: true, name: true, email: true },
};

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, taskId } = await params;
  const { error } = await assertProjectMember(projectId, session.user.id);
  if (error) return error;

  const task = await db.task.findFirst({
    where: { id: taskId, projectId },
    include: {
      assignee: assigneeSelect,
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, taskId } = await params;
  const { error } = await assertProjectMember(projectId, session.user.id);
  if (error) return error;

  const existingTask = await db.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true },
  });

  if (!existingTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateProjectTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { assigneeId, dueDate, ...rest } = parsed.data;

  if (assigneeId) {
    const member = await db.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: assigneeId },
      },
      select: { userId: true },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Assignee is not a member of this project" },
        { status: 400 },
      );
    }
  }

  const task = await db.task.update({
    where: { id: taskId },
    data: {
      ...rest,
      ...(dueDate !== undefined && {
        dueDate: dueDate ? new Date(dueDate) : null,
      }),
      ...(assigneeId !== undefined && {
        assigneeId: assigneeId || null,
      }),
    },
    include: {
      assignee: assigneeSelect,
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json({ task });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, taskId } = await params;
  const { error } = await assertProjectMember(projectId, session.user.id);
  if (error) return error;

  const existingTask = await db.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true },
  });

  if (!existingTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await db.task.delete({
    where: { id: taskId },
  });

  return new NextResponse(null, { status: 204 });
}