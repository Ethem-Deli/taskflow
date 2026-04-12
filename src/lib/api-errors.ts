import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export function handleApiError(err: unknown, fallbackMessage: string) {
  if (err instanceof SyntaxError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "A record with these values already exists" },
        { status: 409 },
      );
    }
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
  }

  console.error(err);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
