import { BottomNav } from "@/app/_components/bottom-nav";

// architecture.md §6.2 — 아직 구현 전. 하단 내비게이션이 빈 라우트로 빠지지 않도록
// 자리만 잡아둔다(자세한 사유는 docs/decisions.md 참고).
export default function CalendarPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 items-center justify-center px-4 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">달력 화면은 준비 중이에요.</p>
      </main>
      <BottomNav active="/calendar" />
    </div>
  );
}
