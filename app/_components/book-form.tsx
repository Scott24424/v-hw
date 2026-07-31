"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Language = "EN" | "KO";

type Initial = {
  title: string;
  language: Language;
  totalChapters: number | null;
  totalPages: number | null;
};

type Props =
  | { mode: "create"; bookId?: undefined; initial?: undefined; onDone?: () => void }
  | { mode: "edit"; bookId: number; initial: Initial; onDone: () => void };

const inputClass =
  "min-h-11 rounded-md border border-zinc-300 px-2 dark:border-zinc-700 dark:bg-zinc-900";

function toNullableInt(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

// architecture.md §6 "/manage/books — 책 목록, 진도 현황"의 추가/수정 폼. DELETE는
// architecture.md §5 API 표에 애초에 없어(routine-blocks와 달리) 이 폼도 삭제를
// 지원하지 않는다(decisions.md 참고).
export function BookForm({ mode, bookId, initial, onDone }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [language, setLanguage] = useState<Language>(initial?.language ?? "EN");
  const [totalChapters, setTotalChapters] = useState(
    initial?.totalChapters != null ? String(initial.totalChapters) : "",
  );
  const [totalPages, setTotalPages] = useState(
    initial?.totalPages != null ? String(initial.totalPages) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);

    const body = {
      title,
      language,
      totalChapters: toNullableInt(totalChapters),
      totalPages: toNullableInt(totalPages),
    };

    try {
      const response = await fetch(mode === "create" ? "/api/books" : `/api/books/${bookId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message =
          typeof data?.error === "string"
            ? data.error
            : (Object.values(data?.error?.fieldErrors ?? {}).flat()[0] as string | undefined);
        setError(message ?? "저장하지 못했어요.");
        return;
      }
      if (mode === "create") {
        setTitle("");
        setTotalChapters("");
        setTotalPages("");
      }
      router.refresh();
      onDone?.();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col text-sm text-zinc-600 dark:text-zinc-400">
        제목
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className={inputClass}
        />
      </label>
      <label className="flex flex-col text-sm text-zinc-600 dark:text-zinc-400">
        언어
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value as Language)}
          className={inputClass}
        >
          <option value="EN">영어</option>
          <option value="KO">한글</option>
        </select>
      </label>
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col text-sm text-zinc-600 dark:text-zinc-400">
          총 챕터 수 (선택)
          <input
            type="number"
            min={1}
            value={totalChapters}
            onChange={(event) => setTotalChapters(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-1 flex-col text-sm text-zinc-600 dark:text-zinc-400">
          총 페이지 수 (선택)
          <input
            type="number"
            min={1}
            value={totalPages}
            onChange={(event) => setTotalPages(event.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white disabled:opacity-50"
        >
          {mode === "create" ? "추가" : "저장"}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            onClick={onDone}
            className="min-h-11 rounded-lg px-4 text-sm text-zinc-500 dark:text-zinc-400"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}
