import type { AssignmentStatus } from "@prisma/client";

const DATE_STRING_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export const OVERDUE_STATUSES: readonly AssignmentStatus[] = ["PLANNED", "IN_PROGRESS"];

export function isValidDateString(value: string): boolean {
  if (!DATE_STRING_PATTERN.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function todayKST(): string {
  const kstMs = Date.now() + KST_OFFSET_MS;
  return new Date(kstMs).toISOString().slice(0, 10);
}

export function isOverdue(date: string, status: AssignmentStatus): boolean {
  return date < todayKST() && OVERDUE_STATUSES.includes(status);
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day));
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

// "이번 주"는 달력 주(월요일~일요일) 기준. 사용자 확정 사항(2026-07-30).
export function weekRangeKST(date: string = todayKST()): { start: string; end: string } {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=일 ... 6=토
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const start = addDays(date, mondayOffset);
  const end = addDays(start, 6);
  return { start, end };
}
