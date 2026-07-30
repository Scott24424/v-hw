import { NextRequest, NextResponse } from "next/server";

import { buildDayView } from "@/lib/days/view";
import { isValidDateString } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params;
  if (!isValidDateString(date)) {
    return NextResponse.json({ error: "date must be a valid YYYY-MM-DD" }, { status: 400 });
  }

  const [blocks, assignments] = await Promise.all([
    prisma.routineBlock.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { startMinute: "asc" }],
    }),
    prisma.assignment.findMany({
      where: { date },
      orderBy: [{ sortOrder: "asc" }],
    }),
  ]);

  return NextResponse.json(buildDayView(date, blocks, assignments));
}
