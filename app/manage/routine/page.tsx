import Link from "next/link";

import { RoutineBlockForm } from "@/app/_components/routine-block-form";
import { RoutineBlockRow } from "@/app/_components/routine-block-row";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// architecture.md §6 "/manage/routine — 블록 추가·수정·삭제". §6.4의 하단 3탭에는
// 없는 화면이라(오늘/달력/시간표만 탭) 이 페이지는 BottomNav 대신 /schedule로
// 돌아가는 링크만 둔다 — 진입은 /schedule에 추가한 "시간표 관리" 링크로 한다.
export default async function ManageRoutinePage() {
  const blocks = await prisma.routineBlock.findMany({
    orderBy: [{ sortOrder: "asc" }, { startMinute: "asc" }],
  });

  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-6">
        <Link
          href="/schedule"
          className="mb-4 inline-flex min-h-11 items-center text-base text-blue-600 dark:text-blue-400"
        >
          ← 시간표로
        </Link>
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">시간표 관리</h1>

        <section className="mb-6 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">블록 추가</h2>
          <RoutineBlockForm mode="create" />
        </section>

        {blocks.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">등록된 블록이 없어요.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {blocks.map((block) => (
              <RoutineBlockRow key={block.id} block={block} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
