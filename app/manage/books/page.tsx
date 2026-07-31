import Link from "next/link";

import { BookForm } from "@/app/_components/book-form";
import { BookRow } from "@/app/_components/book-row";
import { bookProgressLabel, latestProgressByBook } from "@/lib/books/progress";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// architecture.md §6 "/manage/books — 책 목록, 진도 현황". §6.4의 하단 3탭에는
// 없는 화면이라(오늘/달력/시간표만 탭) BottomNav 대신 /calendar로 돌아가는 링크만
// 둔다 — /manage/routine과 동일한 패턴(진입은 /calendar에 추가한 "책 관리" 링크로).
export default async function ManageBooksPage() {
  const [books, readingAssignments] = await Promise.all([
    prisma.book.findMany({ orderBy: [{ title: "asc" }] }),
    prisma.assignment.findMany({
      where: { type: "READING", bookId: { not: null }, progressEnd: { not: null } },
      orderBy: [{ date: "desc" }, { id: "desc" }],
    }),
  ]);

  const latestByBook = latestProgressByBook(readingAssignments);

  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-6">
        <Link
          href="/calendar"
          className="mb-4 inline-flex min-h-11 items-center text-base text-blue-600 dark:text-blue-400"
        >
          ← 달력으로
        </Link>
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">책 관리</h1>

        <section className="mb-6 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">책 추가</h2>
          <BookForm mode="create" />
        </section>

        {books.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">등록된 책이 없어요.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {books.map((book) => (
              <BookRow
                key={book.id}
                book={book}
                progressLabel={bookProgressLabel(book, latestByBook.get(book.id))}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
