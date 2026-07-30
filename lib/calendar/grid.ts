// architecture.md §0.1: plan-20days.jpg 실물 그대로 — 7/29~8/17(20일), 5열×4행.
// 요일 정렬이 아니라 그냥 5일마다 줄바꿈하는 순차 그리드다. 이 방학 한 철짜리 실물을
// 그대로 옮기는 게 범위라 날짜 범위는 상수로 고정한다(§0.3의 "1인·1시즌" 전제와 동일).
export const VACATION_START = "2026-07-29";
export const VACATION_END = "2026-08-17";
export const GRID_COLUMNS = 5;

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day));
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = start;
  while (current <= end) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

export function vacationDates(): string[] {
  return dateRange(VACATION_START, VACATION_END);
}
