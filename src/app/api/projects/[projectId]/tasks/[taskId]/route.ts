import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProjectTaskSchema } from "@/lib/validators";
import { assertProjectMember } from "@/lib/project-auth";

type Params = { params: Promise<{ projectId: string; taskId: string }> };

const assigneeSelect = {
  user: { select: { id: true, name: true, email: true } },
};

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, taskId } = await params;
  const { error } = await assertProjectMember(projectId, session.user.id);
  if (error) return error;

  const task = await db.task.findUnique({
    where: { id: taskId, projectId },
    include: {
      assignees: { include: assigneeSelect },
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

  const body = await req.json();
  const parsed = updateProjectTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { assigneeIds, dueDate, ...rest } = parsed.data;

  if (assigneeIds !== undefined && assigneeIds.length > 0) {
    const memberIds = await db.projectMember
      .findMany({ where: { projectId }, select: { userId: true } })
      .then((rows) => rows.map((r) => r.userId));

    const invalid = assigneeIds.filter((id) => !memberIds.includes(id));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: "One or more assignees are not members of this project" },
        { status: 400 },
      );
    }
  }

  const task = await db.$transaction(async (tx) => {
    if (assigneeIds !== undefined) {
      await tx.taskAssignee.deleteMany({ where: { taskId } });

      if (assigneeIds.length > 0) {
        await tx.taskAssignee.createMany({
          data: assigneeIds.map((userId) => ({ taskId, userId })),
        });
      }
    }

    return tx.task.update({
      where: { id: taskId, projectId },
      data: {
        ...rest,
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
      include: { assignees: { include: assigneeSelect } },
    });
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

  await db.task.delete({ where: { id: taskId, projectId } });

  return new NextResponse(null, { status: 204 });
}
