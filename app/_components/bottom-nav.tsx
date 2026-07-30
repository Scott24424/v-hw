import Link from "next/link";

const TABS = [
  { href: "/", label: "오늘" },
  { href: "/calendar", label: "달력" },
  { href: "/schedule", label: "시간표" },
] as const;

type Href = (typeof TABS)[number]["href"];

// architecture.md §6.4: 하단 3탭 내비게이션 — 태블릿을 양손으로 들었을 때 엄지가 닿는 위치.
export function BottomNav({ active }: { active: Href }) {
  return (
    <nav className="sticky bottom-0 inset-x-0 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <ul className="flex">
        {TABS.map((tab) => (
          <li key={tab.href} className="flex-1">
            <Link
              href={tab.href}
              className={`flex min-h-11 items-center justify-center py-3 text-base font-medium ${
                tab.href === active
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
