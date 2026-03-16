import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertProjectOwner } from "@/lib/project-auth";

type Params = { params: Promise<{ projectId: string; userId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, userId } = await params;
  const { error } = await assertProjectOwner(projectId, session.user.id);
  if (error) return error;

  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot remove yourself from the project. Delete the project instead." },
      { status: 400 },
    );
  }

  await db.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });

  return new NextResponse(null, { status: 204 });
}
