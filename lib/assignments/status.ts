import { AssignmentStatus } from "@prisma/client";

// architecture.md §3.1 허용 전이 표. 표에 없는 전이(동일 상태로의 요청 포함)는 전부 거부.
const ALLOWED_TRANSITIONS: Record<AssignmentStatus, readonly AssignmentStatus[]> = {
  PLANNED: ["IN_PROGRESS", "DONE", "SKIPPED"],
  IN_PROGRESS: ["DONE", "SKIPPED", "PLANNED"],
  DONE: ["PLANNED", "SKIPPED"],
  SKIPPED: ["PLANNED"],
};

export function isAllowedStatusTransition(
  from: AssignmentStatus,
  to: AssignmentStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
