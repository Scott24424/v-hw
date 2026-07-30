import { AssignmentStatus } from "@prisma/client";

import { serializeAssignment } from "@/lib/assignments/serialize";
import { OVERDUE_STATUSES, todayKST, weekRangeKST } from "@/lib/date";
import { prisma } from "@/lib/prisma";

const REMAINING_STATUSES: AssignmentStatus[] = [...OVERDUE_STATUSES];
const orderByDateThenSort = [{ date: "asc" as const }, { sortOrder: "asc" as const }];

// architecture.md §5의 GET /api/summary/remaining과 "/" 화면(§6.1)이 공유하는 조회 로직.
// §3.2: "오늘"의 기준은 서버 한 곳 — 화면도 이 함수가 반환하는 date를 그대로 써야
// 클라이언트 시계로 직접 계산한 날짜와 어긋나지 않는다.
export async function getRemainingSummary() {
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

  return {
    date: today,
    overdue: overdue.map(serializeAssignment),
    today: todayList.map(serializeAssignment),
    thisWeek: thisWeek.map(serializeAssignment),
    counts: {
      overdue: overdue.length,
      today: todayList.length,
      thisWeek: thisWeek.length,
    },
  };
}
