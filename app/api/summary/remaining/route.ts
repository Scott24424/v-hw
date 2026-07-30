import { AssignmentStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { serializeAssignment } from "@/lib/assignments/serialize";
import { OVERDUE_STATUSES, todayKST, weekRangeKST } from "@/lib/date";
import { prisma } from "@/lib/prisma";

const REMAINING_STATUSES: AssignmentStatus[] = [...OVERDUE_STATUSES];
const orderByDateThenSort = [{ date: "asc" as const }, { sortOrder: "asc" as const }];

export async function GET() {
  const today = todayKST();
  const { end: weekEnd } = weekRangeKST(today);

  const [overdue, todayList, thisWeek] = await Promise.all([
    prisma.assignment.findMany({
      where: { date: { lt: today }, status: { in: REMAINING_STATUSES } },
      orderBy: orderByDateThenSort,
    }),
    prisma.assignment.findMany({
      where: { date: today, status: { in: REMAINING_STATUSES } },
      orderBy: [{ sortOrder: "asc" as const }],
    }),
    prisma.assignment.findMany({
      where: { date: { gt: today, lte: weekEnd }, status: { in: REMAINING_STATUSES } },
      orderBy: orderByDateThenSort,
    }),
  ]);

  return NextResponse.json({
    overdue: overdue.map(serializeAssignment),
    today: todayList.map(serializeAssignment),
    thisWeek: thisWeek.map(serializeAssignment),
    counts: {
      overdue: overdue.length,
      today: todayList.length,
      thisWeek: thisWeek.length,
    },
  });
}
