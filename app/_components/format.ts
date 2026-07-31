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

// mockup(plan-20days.jpg)은 달이 바뀌는 칸에만 "7/29", "8/1"처럼 월을 적고
// 나머지는 "30", "31"처럼 일자만 적는다. 순서대로 훑으며 같은 규칙을 재현한다.
export function gridDayLabels(dates: string[]): string[] {
  let previousMonth: number | null = null;
  return dates.map((date) => {
    const [, monthStr, dayStr] = date.split("-");
    const month = Number(monthStr);
    const day = Number(dayStr);
    const label = month !== previousMonth ? `${month}/${day}` : `${day}`;
    previousMonth = month;
    return label;
  });
}

// architecture.md §0.2: 실물 시간표는 12시간제(AM/PM 표기 없이)로 적혀 있고, 저장은
// 자정 기준 분(24시간제)이다. 화면은 실물 표기를 그대로 재현한다 — "14:00"이 아니라 "2:00".
export function formatMinutesAsClock(totalMinutes: number): string {
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, "0")}`;
}

// <input type="time">는 "HH:MM"(24시간제) 문자열을 주고받는다. RoutineBlock은
// 자정 기준 분으로 저장하므로 폼과 API 사이를 이 두 함수로 잇는다.
export function minutesToTimeInputValue(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function timeInputValueToMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
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
