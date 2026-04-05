import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectSchema } from "@/lib/validators";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
  const skip = (page - 1) * limit;

  const where = { userId: session.user.id };

  const [memberships, total] = await Promise.all([
    db.projectMember.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, description: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    }),
    db.projectMember.count({ where }),
  ]);

  const projects = memberships.map((m) => ({
    ...m.project,
    role: m.role,
  }));

  return NextResponse.json({ projects, total, page, limit });
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
    ownerId: session.user.id,
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
