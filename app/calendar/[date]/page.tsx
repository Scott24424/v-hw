import Link from "next/link";
import { notFound } from "next/navigation";

import { AssignmentCheckbox } from "@/app/_components/assignment-checkbox";
import { BottomNav } from "@/app/_components/bottom-nav";
import { assignmentLabel, formatKoreanDate } from "@/app/_components/format";
import { serializeAssignment } from "@/lib/assignments/serialize";
import { isValidDateString } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// architecture.md §6.2 "탭 → 그날 편집"의 1차 구현. 아직 앱 어디에도 과제
// 생성·필드수정 폼이 없어(§6.2가 요구하는 "편집"의 전부는 아님) 이번엔 조회 +
// 완료 체크(홈 화면과 동일한 컴포넌트 재사용)까지만 다룬다 — decisions.md 참고.
// SKIPPED는 "/"와 동일하게 건너뛰기 UI가 없어 범위 밖으로 제외한다.
export default async function CalendarDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidDateString(date)) {
    notFound();
  }

  const assignments = await prisma.assignment.findMany({
    where: { date, status: { not: "SKIPPED" } },
    orderBy: [{ sortOrder: "asc" }],
  });
  const serialized = assignments.map(serializeAssignment);

  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-6">
        <Link
          href="/calendar"
          className="mb-4 inline-flex min-h-11 items-center text-base text-blue-600 dark:text-blue-400"
        >
          ← 달력으로
        </Link>
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {formatKoreanDate(date)}
        </h1>

        {serialized.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">이 날은 계획된 과제가 없어요.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {serialized.map((assignment) => (
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
      </main>
      <BottomNav active="/calendar" />
    </div>
  );
}
