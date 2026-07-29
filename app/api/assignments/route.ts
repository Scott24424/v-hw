import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { createAssignmentSchema, listAssignmentsQuerySchema } from "@/lib/assignments/schema";
import { serializeAssignment } from "@/lib/assignments/serialize";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = listAssignmentsQuerySchema.safeParse({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    type: searchParams.get("type") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { from, to, status, type } = parsed.data;

  const assignments = await prisma.assignment.findMany({
    where: {
      ...(from || to
        ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
    },
    orderBy: [{ date: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json(assignments.map(serializeAssignment));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = createAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;

  // architecture.md §1.4: READING 유형의 progressStart는 같은 책의 직전 progressEnd+1을
  // 생성 시점에 자동으로 채우고 저장한다(사후 파생 계산 금지).
  let progressStart = input.progressStart;
  if (input.type === "READING" && progressStart === undefined) {
    const previous = await prisma.assignment.findFirst({
      where: { bookId: input.bookId, progressEnd: { not: null } },
      orderBy: [{ date: "desc" }, { id: "desc" }],
    });
    progressStart = previous?.progressEnd != null ? previous.progressEnd + 1 : 1;
  }

  if (
    input.type === "READING" &&
    progressStart !== undefined &&
    input.progressEnd !== undefined &&
    progressStart > input.progressEnd
  ) {
    return NextResponse.json(
      {
        error: `자동 계산된 progressStart(${progressStart})가 progressEnd(${input.progressEnd})보다 큽니다. progressStart를 직접 지정해 주세요.`,
      },
      { status: 400 },
    );
  }

  try {
    const created = await prisma.assignment.create({
      data: {
        date: input.date,
        type: input.type,
        title: input.title,
        note: input.note,
        bookId: input.bookId,
        progressUnit: input.progressUnit,
        progressStart,
        progressEnd: input.progressEnd,
        routineBlockId: input.routineBlockId,
      },
    });
    return NextResponse.json(serializeAssignment(created), { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        { error: "bookId 또는 routineBlockId가 존재하지 않습니다" },
        { status: 400 },
      );
    }
    throw error;
  }
}
