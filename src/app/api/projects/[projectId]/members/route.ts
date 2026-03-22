import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { inviteMemberSchema } from "@/lib/validators";
import { assertProjectMember, assertProjectOwner } from "@/lib/project-auth";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { error } = await assertProjectMember(projectId, session.user.id);
  if (error) return error;

  const members = await db.projectMember.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json({
    members: members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
  });
}

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { error } = await assertProjectOwner(projectId, session.user.id);
  if (error) return error;

  const body = await req.json();
  const parsed = inviteMemberSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "No user with that email exists on the platform" },
      { status: 404 },
    );
  }

  const existing = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });

  if (existing) {
    return NextResponse.json(
      { error: "User is already a member of this project" },
      { status: 409 },
    );
  }

  const membership = await db.projectMember.create({
    data: { projectId, userId: user.id, role: "MEMBER" },
  });

  return NextResponse.json(
  {
    member: {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: membership.role,
      joinedAt: membership.joinedAt,
    },
    message: "Member added successfully",
  },
  { status: 201 },
);
}
