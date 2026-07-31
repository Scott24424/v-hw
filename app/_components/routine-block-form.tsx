"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { minutesToTimeInputValue, timeInputValueToMinutes } from "@/app/_components/format";

type Category = "STUDY" | "ROUTINE";

type Initial = {
  startMinute: number;
  endMinute: number;
  label: string;
  category: Category;
};

type Props =
  | { mode: "create"; blockId?: undefined; initial?: undefined; onDone?: () => void }
  | { mode: "edit"; blockId: number; initial: Initial; onDone: () => void };

const inputClass =
  "min-h-11 rounded-md border border-zinc-300 px-2 dark:border-zinc-700 dark:bg-zinc-900";

// architecture.md §6 "/manage/routine — 블록 추가·수정·삭제"의 추가/수정 폼. 생성과
// 수정이 필드 구성이 완전히 같아 하나의 폼으로 공유하고 mode로 요청 방식만 바꾼다.
export function RoutineBlockForm({ mode, blockId, initial, onDone }: Props) {
  const router = useRouter();
  const [startTime, setStartTime] = useState(
    initial ? minutesToTimeInputValue(initial.startMinute) : "07:30",
  );
  const [endTime, setEndTime] = useState(
    initial ? minutesToTimeInputValue(initial.endMinute) : "08:00",
  );
  const [label, setLabel] = useState(initial?.label ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "STUDY");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);

    const body = {
      startMinute: timeInputValueToMinutes(startTime),
      endMinute: timeInputValueToMinutes(endTime),
      label,
      category,
    };

    try {
      const response = await fetch(
        mode === "create" ? "/api/routine-blocks" : `/api/routine-blocks/${blockId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
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
        setLabel("");
      }
      router.refresh();
      onDone?.();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col text-sm text-zinc-600 dark:text-zinc-400">
          시작
          <input
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            required
            className={inputClass}
          />
        </label>
        <label className="flex flex-1 flex-col text-sm text-zinc-600 dark:text-zinc-400">
          종료
          <input
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            required
            className={inputClass}
          />
        </label>
      </div>
      <label className="flex flex-col text-sm text-zinc-600 dark:text-zinc-400">
        이름
        <input
          type="text"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          required
          className={inputClass}
        />
      </label>
      <label className="flex flex-col text-sm text-zinc-600 dark:text-zinc-400">
        분류
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as Category)}
          className={inputClass}
        >
          <option value="STUDY">학습</option>
          <option value="ROUTINE">생활</option>
        </select>
      </label>

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
