"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Candidate = { id: number; label: string };

// architecture.md §6.3: STUDY 블록에 연결된 과제가 없으면 "과제 연결" 버튼을 둔다.
// 아직 과제 생성 폼이 없어(decisions.md) 이미 있는 그날의 미연결 과제 중에서
// 고르는 것까지만 지원 — 새 과제를 여기서 만들지는 않는다.
export function ConnectAssignmentButton({
  blockId,
  candidates,
}: {
  blockId: number;
  candidates: Candidate[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function connect(assignmentId: number) {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routineBlockId: blockId }),
      });
      if (response.ok) {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 min-h-11 rounded-lg border border-dashed border-zinc-300 px-3 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
      >
        + 과제 연결
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-1 rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
      {candidates.length === 0 ? (
        <p className="px-1 py-2 text-sm text-zinc-500 dark:text-zinc-400">
          연결할 수 있는 과제가 없어요.
        </p>
      ) : (
        candidates.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            disabled={pending}
            onClick={() => connect(candidate.id)}
            className="min-h-11 rounded-md px-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {candidate.label}
          </button>
        ))
      )}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="min-h-11 px-2 text-left text-sm text-zinc-400"
      >
        취소
      </button>
    </div>
  );
}
