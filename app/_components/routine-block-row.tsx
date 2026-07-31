"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatMinutesAsClock } from "@/app/_components/format";
import { RoutineBlockForm } from "@/app/_components/routine-block-form";

type Block = {
  id: number;
  startMinute: number;
  endMinute: number;
  label: string;
  category: "STUDY" | "ROUTINE";
  isActive: boolean;
};

export function RoutineBlockRow({ block }: { block: Block }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);

  async function toggleActive() {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch(`/api/routine-blocks/${block.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !block.isActive }),
      });
      if (response.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (pending) return;
    // architecture.md §5.1: 삭제는 물리 삭제 — 되돌릴 수 없어 확인을 거친다.
    if (!window.confirm(`"${block.label}"을(를) 삭제할까요? 되돌릴 수 없어요.`)) return;
    setPending(true);
    try {
      const response = await fetch(`/api/routine-blocks/${block.id}`, { method: "DELETE" });
      if (response.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (editing) {
    return (
      <li className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        <RoutineBlockForm mode="edit" blockId={block.id} initial={block} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 ${
        block.isActive
          ? "border-zinc-200 dark:border-zinc-800"
          : "border-zinc-100 opacity-50 dark:border-zinc-900"
      }`}
    >
      <div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {formatMinutesAsClock(block.startMinute)} ~ {formatMinutesAsClock(block.endMinute)} ·{" "}
          {block.category === "STUDY" ? "학습" : "생활"}
        </p>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{block.label}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={toggleActive}
          disabled={pending}
          className="min-h-11 rounded-md border border-zinc-300 px-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
        >
          {block.isActive ? "끄기" : "켜기"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="min-h-11 rounded-md border border-zinc-300 px-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
        >
          수정
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="min-h-11 rounded-md border border-red-300 px-2 text-sm text-red-600 dark:border-red-800 dark:text-red-400"
        >
          삭제
        </button>
      </div>
    </li>
  );
}
