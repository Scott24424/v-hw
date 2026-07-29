import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { updateBookSchema } from "@/lib/books/schema";
import { prisma } from "@/lib/prisma";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) {
    return NextResponse.json({ error: "invalid book id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = updateBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const book = await prisma.book.update({ where: { id }, data: parsed.data });
    return NextResponse.json(book);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "책을 찾을 수 없습니다" }, { status: 404 });
      }
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "이미 같은 제목·언어의 책이 존재합니다" },
          { status: 409 },
        );
      }
    }
    throw error;
  }
}
