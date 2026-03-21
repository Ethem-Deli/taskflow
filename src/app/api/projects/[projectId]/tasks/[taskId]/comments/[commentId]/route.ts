import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertProjectMember } from "@/lib/project-auth";

type Params = { params: Promise<{ projectId: string; taskId: string; commentId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, taskId, commentId } = await params;
    const { error } = await assertProjectMember(projectId, session.user.id);
    if (error) return error;

    // Check if comment exists and belongs to the task
    const comment = await db.comment.findUnique({
        where: { id: commentId, taskId },
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