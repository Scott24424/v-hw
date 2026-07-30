"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  id: number;
  label: string;
  dateLabel?: string;
  checked: boolean;
};

// architecture.md §3.1: 체크박스 한 번으로 PLANNED/IN_PROGRESS → DONE, 다시 누르면 DONE → PLANNED.
// §6.4: 터치 타깃 44pt 이상 — label 전체를 탭 영역으로 써서 체크박스 아이콘만 조준할 필요가 없게 한다.
export function AssignmentCheckbox({ id, label, dateLabel, checked }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch(`/api/assignments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: checked ? "PLANNED" : "DONE" }),
      });
      if (response.ok) {
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <label className="flex min-h-11 items-center gap-3 px-2 py-3 active:bg-zinc-50 dark:active:bg-zinc-900">
      <input
        type="checkbox"
        checked={checked}
        onChange={toggle}
        disabled={pending}
        aria-label={label}
        className="h-6 w-6 shrink-0 accent-blue-600"
      />
      <span
        className={`flex-1 text-lg ${
          checked
            ? "text-zinc-400 line-through dark:text-zinc-600"
            : "text-zinc-900 dark:text-zinc-50"
        }`}
      >
        {label}
      </span>
      {dateLabel && <span className="text-sm text-zinc-500 dark:text-zinc-400">{dateLabel}</span>}
    </label>
  );
}
