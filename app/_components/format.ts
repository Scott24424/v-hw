const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatKoreanDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${month}월 ${day}일 ${WEEKDAYS[weekday]}요일`;
}

export function formatShortDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-").map(Number);
  return `${month}/${day}`;
}

export function progressLabel(assignment: {
  type: string;
  progressUnit: string | null;
  progressEnd: number | null;
}): string | undefined {
  if (assignment.type !== "READING" || assignment.progressEnd === null) return undefined;
  const unit = assignment.progressUnit === "PAGE" ? "p." : "ch.";
  return `${unit}${assignment.progressEnd}`;
}

export function assignmentLabel(assignment: {
  title: string;
  type: string;
  progressUnit: string | null;
  progressEnd: number | null;
}): string {
  const progress = progressLabel(assignment);
  return progress ? `${assignment.title} ${progress}` : assignment.title;
}
