import Link from "next/link";

import { BottomNav } from "@/app/_components/bottom-nav";
import { assignmentLabel, gridDayLabels } from "@/app/_components/format";
import { chunk, GRID_COLUMNS, VACATION_END, VACATION_START, vacationDates } from "@/lib/calendar/grid";
import { todayKST } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// architecture.md §6.2: 실물(plan-20days.jpg)의 5열 그리드를 그대로 재현. 요일 정렬이
// 아니라 7/29~8/17을 5일씩 순서대로 끊어 4행으로 나열한다(§0.1). 빈 날짜는 그냥 빈
// 칸으로 둔다 — "계획 미정"은 정상 상태라 안내 문구를 넣지 않는다.
export default async function CalendarPage() {
  const dates = vacationDates();
  const labels = gridDayLabels(dates);
  const today = todayKST();

  const assignments = await prisma.assignment.findMany({
    where: { date: { gte: VACATION_START, lte: VACATION_END } },
    orderBy: [{ sortOrder: "asc" }],
  });

  const byDate = new Map<string, typeof assignments>();
  for (const assignment of assignments) {
    const list = byDate.get(assignment.date) ?? [];
    list.push(assignment);
    byDate.set(assignment.date, list);
  }

  const rows = chunk(
    dates.map((date, index) => ({ date, label: labels[index] })),
    GRID_COLUMNS,
  );

  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto px-2 py-4">
        <h1 className="mb-4 px-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">달력</h1>
        <div className="flex flex-col gap-1">
          {rows.map((row) => (
            <div key={row[0].date} className="grid grid-cols-5 gap-1">
              {row.map(({ date, label }) => {
                const dayAssignments = byDate.get(date) ?? [];
                const isToday = date === today;
                return (
                  <Link
                    key={date}
                    href={`/calendar/${date}`}
                    className={`flex min-h-24 flex-col gap-1 rounded-lg border p-1.5 text-left ${
                      isToday
                        ? "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      {label}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {dayAssignments.map((assignment) => (
                        <span
                          key={assignment.id}
                          className={`truncate text-[11px] leading-tight sm:text-xs ${
                            assignment.status === "DONE" || assignment.status === "SKIPPED"
                              ? "text-zinc-400 line-through dark:text-zinc-600"
                              : "text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {assignmentLabel(assignment)}
                        </span>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </main>
      <BottomNav active="/calendar" />
    </div>
  );
}
