import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { createBookSchema } from "@/lib/books/schema";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const books = await prisma.book.findMany({ orderBy: [{ title: "asc" }] });
  return NextResponse.json(books);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = createBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const book = await prisma.book.create({ data: parsed.data });
    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "이미 같은 제목·언어의 책이 존재합니다" },
        { status: 409 },
      );
    }
    throw error;
  }
}
