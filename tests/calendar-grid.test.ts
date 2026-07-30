import { describe, expect, it } from "vitest";

import { chunk, dateRange, GRID_COLUMNS, vacationDates } from "@/lib/calendar/grid";

describe("dateRange", () => {
  it("정상 케이스: 시작~끝(포함) 날짜를 순서대로 반환한다", () => {
    expect(dateRange("2026-07-29", "2026-08-02")).toEqual([
      "2026-07-29",
      "2026-07-30",
      "2026-07-31",
      "2026-08-01",
      "2026-08-02",
    ]);
  });

  it("경계값: 시작과 끝이 같으면 날짜 1개만 반환한다", () => {
    expect(dateRange("2026-07-29", "2026-07-29")).toEqual(["2026-07-29"]);
  });

  it("월 경계를 올바르게 넘는다", () => {
    const range = dateRange("2026-07-30", "2026-08-01");
    expect(range).toEqual(["2026-07-30", "2026-07-31", "2026-08-01"]);
  });
});

describe("chunk", () => {
  it("정상 케이스: 지정한 크기로 묶는다", () => {
    expect(chunk([1, 2, 3, 4, 5, 6], 5)).toEqual([[1, 2, 3, 4, 5], [6]]);
  });

  it("경계값: 정확히 나누어떨어지면 마지막 행에 빈 배열이 남지 않는다", () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("경계값: 빈 배열이면 빈 배열을 반환한다", () => {
    expect(chunk([], 5)).toEqual([]);
  });
});

describe("vacationDates", () => {
  it("정상 케이스: 7/29~8/17 20일, 5열×4행 그리드에 맞는 개수를 반환한다", () => {
    const dates = vacationDates();
    expect(dates).toHaveLength(20);
    expect(dates[0]).toBe("2026-07-29");
    expect(dates.at(-1)).toBe("2026-08-17");
    expect(chunk(dates, GRID_COLUMNS)).toHaveLength(4);
  });
});
