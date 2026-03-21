import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertProjectMember } from "@/lib/project-auth";
import { commentSchema } from "@/lib/validators";

type Params = { params: Promise<{ projectId: string; taskId: string }> };

export async function GET(_req: Request, { params }: Params) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, taskId } = await params;
    const { error } = await assertProjectMember(projectId, session.user.id);
    if (error) return error;

    // Check if task exists and belongs to the project
    const task = await db.task.findUnique({
        where: { id: taskId, projectId },
        select: { id: true },
    });

    if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const comments = await db.comment.findMany({
        where: { taskId },
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            content: true,
            createdAt: true,
            user: { select: { id: true, name: true, email: true } },
        },
    });

    return NextResponse.json({ comments });
}

export async function POST(req: Request, { params }: Params) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, taskId } = await params;
    const { error } = await assertProjectMember(projectId, session.user.id);
    if (error) return error;

    // Check if task exists and belongs to the project
    const task = await db.task.findUnique({
        where: { id: taskId, projectId },
        select: { id: true },
    });

    if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = commentSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const comment = await db.comment.create({
        data: {
            content: parsed.data.content,
            taskId,
            userId: session.user.id,
        },
        select: {
            id: true,
            content: true,
            createdAt: true,
            user: { select: { id: true, name: true, email: true } },
        },
    });

    return NextResponse.json({ comment }, { status: 201 });
}