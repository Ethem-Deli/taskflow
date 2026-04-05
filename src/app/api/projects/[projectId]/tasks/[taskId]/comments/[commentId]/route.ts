import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertProjectMember } from "@/lib/project-auth";
import { commentSchema } from "@/lib/validators";

type Params = { params: Promise<{ projectId: string; taskId: string; commentId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, taskId, commentId } = await params;
    const { error } = await assertProjectMember(projectId, session.user.id);
    if (error) return error;

    // Check if comment exists, belongs to the task, and the task belongs to the project
    const comment = await db.comment.findFirst({
        where: { id: commentId, task: { id: taskId, projectId } },
        select: { id: true, userId: true },
    });

    if (!comment) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Only the comment author can delete their own comment
    if (comment.userId !== session.user.id) {
        return NextResponse.json(
            { error: "You can only delete your own comments" },
            { status: 403 }
        );
    }

    await db.comment.delete({ where: { id: commentId } });

    return new NextResponse(null, { status: 204 });
}

export async function PATCH(req: Request, { params }: Params) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, taskId, commentId } = await params;
    const { error } = await assertProjectMember(projectId, session.user.id);
    if (error) return error;

    const comment = await db.comment.findFirst({
        where: { id: commentId, task: { id: taskId, projectId } },
        select: { id: true, userId: true },
    });

    if (!comment) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.userId !== session.user.id) {
        return NextResponse.json(
            { error: "You can only edit your own comments" },
            { status: 403 }
        );
    }

    const body = await req.json();
    const parsed = commentSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const updated = await db.comment.update({
        where: { id: commentId },
        data: { content: parsed.data.content },
        select: {
            id: true,
            content: true,
            createdAt: true,
            user: { select: { id: true, name: true, email: true } },
        },
    });

    return NextResponse.json({ comment: updated });
}
