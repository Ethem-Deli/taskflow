import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectSchema } from "@/lib/validators";
import { assertProjectMember, assertProjectOwner } from "@/lib/project-auth";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { membership, error } = await assertProjectMember(projectId, session.user.id);
  if (error) return error;

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { _count: { select: { members: true } } },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project, role: membership!.role });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { error } = await assertProjectOwner(projectId, session.user.id);
  if (error) return error;

  const body = await req.json();
  const parsed = projectSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await db.project.update({
    where: { id: projectId },
    data: parsed.data,
    select: { id: true, name: true, description: true, updatedAt: true },
  });

  return NextResponse.json({ project });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { error } = await assertProjectOwner(projectId, session.user.id);
  if (error) return error;

  await db.project.delete({ where: { id: projectId } });

  return new NextResponse(null, { status: 204 });
}
