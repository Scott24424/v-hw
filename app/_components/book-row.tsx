"use client";

import { useState } from "react";

import { BookForm } from "@/app/_components/book-form";

type Book = {
  id: number;
  title: string;
  language: "EN" | "KO";
  totalChapters: number | null;
  totalPages: number | null;
};

export function BookRow({ book, progressLabel }: { book: Book; progressLabel: string }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <BookForm mode="edit" bookId={book.id} initial={book} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {book.language === "EN" ? "영어" : "한글"} · {progressLabel}
        </p>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{book.title}</p>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="min-h-11 rounded-md border border-zinc-300 px-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
      >
        수정
      </button>
    </li>
  );
}
