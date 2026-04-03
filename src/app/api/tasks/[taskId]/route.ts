import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Validator for PATCH request body
const updateTaskSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
});

type Params = {
  params: Promise<{ taskId: string }>;
};

export async function PATCH(
  request: Request,
  { params }: Params
) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateTaskSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { status } = validationResult.data;

    // Verify user has access to this task (is a member of the project)
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.project.members.length === 0) {
      return NextResponse.json(
        { error: "You don't have access to this task" },
        { status: 403 }
      );
    }

    // Update the task status
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: { status },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    return NextResponse.json({ task: updatedTask }, { status: 200 });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
