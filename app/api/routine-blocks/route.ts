import { NextRequest, NextResponse } from "next/server";

import { createRoutineBlockSchema } from "@/lib/routine-blocks/schema";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const routineBlocks = await prisma.routineBlock.findMany({
    orderBy: [{ sortOrder: "asc" }, { startMinute: "asc" }],
  });
  return NextResponse.json(routineBlocks);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = createRoutineBlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const routineBlock = await prisma.routineBlock.create({ data: parsed.data });
  return NextResponse.json(routineBlock, { status: 201 });
}
