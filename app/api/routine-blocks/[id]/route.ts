import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { updateRoutineBlockSchema } from "@/lib/routine-blocks/schema";
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
    return NextResponse.json({ error: "invalid routine block id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = updateRoutineBlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const routineBlock = await prisma.routineBlock.update({ where: { id }, data: parsed.data });
    return NextResponse.json(routineBlock);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "시간표 블록을 찾을 수 없습니다" }, { status: 404 });
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
    return NextResponse.json({ error: "invalid routine block id" }, { status: 400 });
  }

  try {
    await prisma.routineBlock.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "시간표 블록을 찾을 수 없습니다" }, { status: 404 });
    }
    throw error;
  }
}
