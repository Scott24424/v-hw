import Link from "next/link";

import { AssignmentCheckbox } from "@/app/_components/assignment-checkbox";
import { BottomNav } from "@/app/_components/bottom-nav";
import { assignmentLabel, formatKoreanDate, formatShortDate } from "@/app/_components/format";
import { serializeAssignment } from "@/lib/assignments/serialize";
import { prisma } from "@/lib/prisma";
import { getRemainingSummary } from "@/lib/summary/remaining";

// "오늘"은 매 요청마다 서버에서 다시 계산돼야 한다(§3.2) — 정적 프리렌더링되면
// 빌드 시점의 데이터로 고정돼 체크박스 상태·밀린 것 판정이 영영 갱신되지 않는다.
export const dynamic = "force-dynamic";

// architecture.md §6.1: 기본 진입 화면. "오늘" 섹션은 /api/summary/remaining의 today
// 버킷(남은 것만)이 아니라 그날 전체(완료 포함)를 보여줘야 "N개 중 M개 완료" 집계가
// 맞는다 — SKIPPED만 이 화면 범위에서 제외(건너뛰기 UI 자체가 아직 없음, decisions.md).
export default async function TodayPage() {
  const summary = await getRemainingSummary();
  const todayAssignments = await prisma.assignment.findMany({
    where: { date: summary.date, status: { not: "SKIPPED" } },
    orderBy: [{ sortOrder: "asc" }],
  });
  const today = todayAssignments.map(serializeAssignment);
  const doneCount = today.filter((a) => a.status === "DONE").length;

  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {formatKoreanDate(summary.date)}
        </h1>

        {summary.overdue.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-lg font-semibold text-red-600 dark:text-red-400">
              ⚠ 밀린 것 {summary.overdue.length}개
            </h2>
            <ul className="divide-y divide-red-100 rounded-xl border border-red-200 dark:divide-red-950 dark:border-red-900">
              {summary.overdue.map((assignment) => (
                <li key={assignment.id}>
                  <AssignmentCheckbox
                    id={assignment.id}
                    label={assignmentLabel(assignment)}
                    dateLabel={formatShortDate(assignment.date)}
                    checked={false}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mb-6">
          <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            오늘 할 일 {today.length}개 중 {doneCount}개 완료
          </h2>
          {today.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400">오늘 할 일이 없어요.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {today.map((assignment) => (
                <li key={assignment.id}>
                  <AssignmentCheckbox
                    id={assignment.id}
                    label={assignmentLabel(assignment)}
                    checked={assignment.status === "DONE"}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link
          href="/calendar"
          className="flex min-h-11 items-center justify-between text-lg font-medium text-zinc-700 dark:text-zinc-300"
        >
          <span>이번 주 남은 것 {summary.counts.thisWeek}개</span>
          <span aria-hidden>→</span>
        </Link>
      </main>
      <BottomNav active="/" />
    </div>
  );
}
