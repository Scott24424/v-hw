import { describe, expect, it } from "vitest";

import {
  assignmentLabel,
  formatKoreanDate,
  formatMinutesAsClock,
  formatShortDate,
  gridDayLabels,
  progressLabel,
} from "@/app/_components/format";

describe("formatKoreanDate", () => {
  it("정상 케이스: YYYY-MM-DD를 'M월 D일 요일요일'로 바꾼다", () => {
    // 2026-07-29는 수요일
    expect(formatKoreanDate("2026-07-29")).toBe("7월 29일 수요일");
  });

  it("경계값: 일요일도 올바르게 계산한다", () => {
    expect(formatKoreanDate("2026-08-02")).toBe("8월 2일 일요일");
  });
});

describe("formatShortDate", () => {
  it("정상 케이스: YYYY-MM-DD를 'M/D'로 줄인다", () => {
    expect(formatShortDate("2026-07-29")).toBe("7/29");
  });
});

describe("gridDayLabels", () => {
  it("정상 케이스: 월이 바뀌는 칸에만 월을 붙인다 (mockup plan-20days.jpg 재현)", () => {
    expect(
      gridDayLabels(["2026-07-29", "2026-07-30", "2026-07-31", "2026-08-01", "2026-08-02"]),
    ).toEqual(["7/29", "30", "31", "8/1", "2"]);
  });

  it("경계값: 첫 날짜는 항상 월을 붙인다", () => {
    expect(gridDayLabels(["2026-08-05"])).toEqual(["8/5"]);
  });

  it("경계값: 빈 배열이면 빈 배열을 반환한다", () => {
    expect(gridDayLabels([])).toEqual([]);
  });
});

describe("formatMinutesAsClock", () => {
  it("정상 케이스: 오전 시각을 12시간제로 표시한다", () => {
    expect(formatMinutesAsClock(450)).toBe("7:30"); // 7:30
    expect(formatMinutesAsClock(480)).toBe("8:00"); // 8:00
  });

  it("정상 케이스: 오후 시각도 AM/PM 없이 12시간제로 표시한다 (실물 표기 그대로)", () => {
    expect(formatMinutesAsClock(840)).toBe("2:00"); // 14:00 → 2:00
    expect(formatMinutesAsClock(900)).toBe("3:00"); // 15:00 → 3:00
    expect(formatMinutesAsClock(1020)).toBe("5:00"); // 17:00 → 5:00
  });

  it("경계값: 정오는 12:00, 자정은 12:00으로 표시한다", () => {
    expect(formatMinutesAsClock(750)).toBe("12:30"); // 12:30
    expect(formatMinutesAsClock(0)).toBe("12:00");
  });
});

describe("progressLabel", () => {
  it("정상 케이스: READING + CHAPTER는 'ch.N'을 반환한다", () => {
    expect(
      progressLabel({ type: "READING", progressUnit: "CHAPTER", progressEnd: 6 }),
    ).toBe("ch.6");
  });

  it("정상 케이스: READING + PAGE는 'p.N'을 반환한다", () => {
    expect(progressLabel({ type: "READING", progressUnit: "PAGE", progressEnd: 42 })).toBe(
      "p.42",
    );
  });

  it("규칙 위반 방지: READING이 아니면 undefined를 반환한다", () => {
    expect(
      progressLabel({ type: "DIARY", progressUnit: null, progressEnd: null }),
    ).toBeUndefined();
  });

  it("규칙 위반 방지: progressEnd가 없으면 undefined를 반환한다", () => {
    expect(
      progressLabel({ type: "READING", progressUnit: "CHAPTER", progressEnd: null }),
    ).toBeUndefined();
  });
});

describe("assignmentLabel", () => {
  it("정상 케이스: READING 과제는 제목 뒤에 진도를 붙인다", () => {
    expect(
      assignmentLabel({
        title: "Big Note",
        type: "READING",
        progressUnit: "CHAPTER",
        progressEnd: 6,
      }),
    ).toBe("Big Note ch.6");
  });

  it("정상 케이스: READING이 아니면 제목만 반환한다", () => {
    expect(
      assignmentLabel({ title: "일기", type: "DIARY", progressUnit: null, progressEnd: null }),
    ).toBe("일기");
  });
});
