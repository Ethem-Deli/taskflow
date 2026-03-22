import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectSchema } from "@/lib/validators";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await db.projectMember.findMany({
    where: { userId: session.user.id },
    include: {
      project: {
        select: { id: true, name: true, description: true, createdAt: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const projects = memberships.map((m) => ({
    ...m.project,
    role: m.role,
  }));

  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = projectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await db.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
      },
    });

    await tx.projectMember.create({
      data: {
        projectId: created.id,
        userId: session.user.id,
        role: "OWNER",
      },
    });

    return created;
  });

  return NextResponse.json(
   {
      project,
      message: "Project created successfully",
    },
    { status: 201 },
  );
}
