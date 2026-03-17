import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function assertProjectMember(projectId: string, userId: string) {
  const membership = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });

  if (!membership) {
    return {
      membership: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { membership, error: null };
}

export async function assertProjectOwner(projectId: string, userId: string) {
  const { membership, error } = await assertProjectMember(projectId, userId);

  if (error) return { membership: null, error };

  if (membership!.role !== "OWNER") {
    return {
      membership: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { membership, error: null };
}
