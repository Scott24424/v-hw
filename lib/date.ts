import type { AssignmentStatus } from "@prisma/client";

const DATE_STRING_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const OVERDUE_STATUSES: readonly AssignmentStatus[] = ["PLANNED", "IN_PROGRESS"];

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
