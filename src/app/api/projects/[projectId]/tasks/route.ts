import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectTaskSchema, taskFilterSchema } from "@/lib/validators"; // Added taskFilterSchema to validate query params
import { assertProjectMember } from "@/lib/project-auth";


type Params = { params: Promise<{ projectId: string }> };

const assigneeSelect = {
  user: { select: { id: true, name: true, email: true } },
};

export async function GET(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { error } = await assertProjectMember(projectId, session.user.id);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  
  // Previously, status and priority were cast directly without validation,
  // which allowed invalid values to be passed silently.
  // Now we validate query params using taskFilterSchema (zod) to return
  // a proper 400 error when invalid values are provided.

  // -- Old code (kept for comparison) --
  // const status = searchParams.get("status") ?? undefined;
  // const priority = searchParams.get("priority") ?? undefined;

  const parsed = taskFilterSchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { status, priority } = parsed.data;

  const tasks = await db.task.findMany({
    where: {
      projectId,
      // -- Old code (kept for comparison) --
      // ...(status && { status: status as "TODO" | "IN_PROGRESS" | "DONE" }),
      // ...(priority && { priority: priority as "LOW" | "MEDIUM" | "HIGH" }),
      ...(status && { status }),
      ...(priority && { priority }),
    },
    include: {
      assignees: { include: assigneeSelect },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { error } = await assertProjectMember(projectId, session.user.id);
  if (error) return error;

  const body = await req.json();
  const parsed = projectTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { assigneeIds, ...taskData } = parsed.data;

  if (assigneeIds.length > 0) {
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

  const task = await db.task.create({
    data: {
      ...taskData,
      status: taskData.status ?? "TODO",
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      projectId,
      assignees: {
        create: assigneeIds.map((userId) => ({ userId })),
      },
    },
    include: { assignees: { include: assigneeSelect } },
  });

  return NextResponse.json(
  {
    task,
    message: "Task created successfully",
  },
  { status: 201 },
);
}
