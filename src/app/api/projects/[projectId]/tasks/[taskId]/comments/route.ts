import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertProjectMember } from "@/lib/project-auth";
import { commentSchema } from "@/lib/validators";
import { handleApiError } from "@/lib/api-errors";

type Params = { params: Promise<{ projectId: string; taskId: string }> };

export async function GET(req: Request, { params }: Params) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, taskId } = await params;
    const { error } = await assertProjectMember(projectId, session.user.id);
    if (error) return error;

    const task = await db.task.findUnique({
        where: { id: taskId, projectId },
        select: { id: true },
    });

    if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
        db.comment.findMany({
            where: { taskId },
            orderBy: { createdAt: "asc" },
            skip,
            take: limit,
            select: {
                id: true,
                content: true,
                createdAt: true,
                user: { select: { id: true, name: true, email: true } },
            },
        }),
        db.comment.count({ where: { taskId } }),
    ]);

    return NextResponse.json({
        comments,
        total,
        page,
        limit,
        hasMore: skip + comments.length < total,
    });
}

export async function POST(req: Request, { params }: Params) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, taskId } = await params;
    const { error } = await assertProjectMember(projectId, session.user.id);
    if (error) return error;

    try {
        const body = await req.json();
        const parsed = commentSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
        }

        const task = await db.task.findUnique({
            where: { id: taskId, projectId },
            select: { id: true },
        });

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
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
    } catch (err) {
        return handleApiError(err, "Failed to create comment");
    }
}