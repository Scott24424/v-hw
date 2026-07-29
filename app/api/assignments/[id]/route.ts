import { AssignmentType, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { updateAssignmentSchema } from "@/lib/assignments/schema";
import { serializeAssignment } from "@/lib/assignments/serialize";
import { prisma } from "@/lib/prisma";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const READING_ONLY_FIELDS = ["bookId", "progressUnit", "progressStart", "progressEnd"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) {
    return NextResponse.json({ error: "invalid assignment id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = updateAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.assignment.findUnique({ where: { id } });
  if (existing === null) {
    return NextResponse.json({ error: "과제를 찾을 수 없습니다" }, { status: 404 });
  }

  const input = parsed.data;

  // architecture.md §2.2: type !== READING인 레코드는 진도/책 필드를 가질 수 없다.
  // type은 이 엔드포인트로 바꿀 수 없으므로(스키마에서 제외) 기존 type을 기준으로 판단한다.
  if (existing.type !== AssignmentType.READING) {
    for (const field of READING_ONLY_FIELDS) {
      if (input[field] !== undefined) {
        return NextResponse.json(
          { error: `READING이 아닌 과제는 ${field}를 수정할 수 없습니다` },
          { status: 400 },
        );
      }
    }
  } else {
    const mergedStart = input.progressStart ?? existing.progressStart;
    const mergedEnd = input.progressEnd ?? existing.progressEnd;
    if (mergedStart != null && mergedEnd != null && mergedStart > mergedEnd) {
      return NextResponse.json(
        { error: `progressStart(${mergedStart})가 progressEnd(${mergedEnd})보다 큽니다` },
        { status: 400 },
      );
    }
  }

  try {
    const updated = await prisma.assignment.update({ where: { id }, data: input });
    return NextResponse.json(serializeAssignment(updated));
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) {
    return NextResponse.json({ error: "invalid assignment id" }, { status: 400 });
  }

  try {
    await prisma.assignment.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "과제를 찾을 수 없습니다" }, { status: 404 });
    }
    throw error;
  }
}
