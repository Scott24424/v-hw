import Link from "next/link";

import { AssignmentCheckbox } from "@/app/_components/assignment-checkbox";
import { BottomNav } from "@/app/_components/bottom-nav";
import { ConnectAssignmentButton } from "@/app/_components/connect-assignment-button";
import { assignmentLabel, formatKoreanDate, formatMinutesAsClock } from "@/app/_components/format";
import { buildDayView } from "@/lib/days/view";
import { nowMinuteKST, todayKST } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// architecture.md §6.3: 세로 타임라인(7:30~17:00). 블록 높이는 실제 시간 길이에
// 비례시키지 않고(§6.3), "현재 시각 인디케이터"는 지금이 속한 블록을 강조하는 방식으로
// 구현한다 — 비례 배치가 아니라서 픽셀 위치로 "지금"을 표시할 기준이 없다.
// §4.1: 그날의 시간표 = isActive 블록 전체 + 그날 Assignment의 routineBlockId 조인.
export default async function SchedulePage() {
  const today = todayKST();
  const nowMinute = nowMinuteKST();

  const [blocks, assignments] = await Promise.all([
    prisma.routineBlock.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { startMinute: "asc" }],
    }),
    prisma.assignment.findMany({
      where: { date: today, status: { not: "SKIPPED" } },
      orderBy: [{ sortOrder: "asc" }],
    }),
  ]);

  const view = buildDayView(today, blocks, assignments);
  const unlinkedCandidates = view.unlinkedAssignments.map((assignment) => ({
    id: assignment.id,
    label: assignmentLabel(assignment),
  }));

  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {formatKoreanDate(today)} 시간표
          </h1>
          <Link
            href="/manage/routine"
            className="flex min-h-11 items-center text-sm text-blue-600 dark:text-blue-400"
          >
            시간표 관리 →
          </Link>
        </div>

        {view.blocks.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">등록된 시간표가 없어요.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {view.blocks.map((block) => {
              const isNow = nowMinute >= block.startMinute && nowMinute < block.endMinute;
              const isRoutine = block.category === "ROUTINE";
              return (
                <li
                  key={block.id}
                  className={`rounded-xl border p-3 ${
                    isNow
                      ? "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950"
                      : "border-zinc-200 dark:border-zinc-800"
                  } ${isRoutine ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      {formatMinutesAsClock(block.startMinute)} ~{" "}
                      {formatMinutesAsClock(block.endMinute)}
                    </span>
                    {isNow && (
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        지금
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {block.label}
                  </p>

                  {block.assignments.length > 0 ? (
                    <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
                      {block.assignments.map((assignment) => (
                        <li key={assignment.id}>
                          <AssignmentCheckbox
                            id={assignment.id}
                            label={assignmentLabel(assignment)}
                            checked={assignment.status === "DONE"}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    !isRoutine && (
                      <ConnectAssignmentButton blockId={block.id} candidates={unlinkedCandidates} />
                    )
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </main>
      <BottomNav active="/schedule" />
    </div>
  );
}
