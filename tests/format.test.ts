import { describe, expect, it } from "vitest";

import {
  assignmentLabel,
  formatKoreanDate,
  formatShortDate,
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
