import { afterEach, describe, expect, it, vi } from "vitest";

import { isOverdue, isValidDateString, todayKST, weekRangeKST } from "@/lib/date";

describe("isValidDateString", () => {
  it("정상 케이스: 유효한 YYYY-MM-DD 문자열을 통과시킨다", () => {
    expect(isValidDateString("2026-07-29")).toBe(true);
  });

  it("규칙 위반: 형식이 어긋나면 거부한다", () => {
    expect(isValidDateString("2026/07/29")).toBe(false);
    expect(isValidDateString("26-07-29")).toBe(false);
  });

  it("규칙 위반: 존재하지 않는 달력 날짜를 거부한다", () => {
    expect(isValidDateString("2026-02-30")).toBe(false);
    expect(isValidDateString("2026-13-01")).toBe(false);
  });
});

describe("todayKST / isOverdue", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("KST 자정을 넘으면 UTC 기준 전날이어도 오늘 날짜가 바뀐다", () => {
    // UTC 2026-07-28T15:30:00Z == KST 2026-07-29 00:30
    vi.setSystemTime(new Date("2026-07-28T15:30:00Z"));
    expect(todayKST()).toBe("2026-07-29");
  });

  it("정상 케이스: 오늘 이전 날짜 + 미완료 상태는 밀린 것이다", () => {
    vi.setSystemTime(new Date("2026-07-29T12:00:00+09:00"));
    expect(isOverdue("2026-07-28", "PLANNED")).toBe(true);
    expect(isOverdue("2026-07-28", "IN_PROGRESS")).toBe(true);
  });

  it("규칙 위반 방지: 완료·건너뜀 상태는 날짜가 지났어도 밀린 것이 아니다", () => {
    vi.setSystemTime(new Date("2026-07-29T12:00:00+09:00"));
    expect(isOverdue("2026-07-28", "DONE")).toBe(false);
    expect(isOverdue("2026-07-28", "SKIPPED")).toBe(false);
  });

  it("오늘 날짜와 미래 날짜는 밀린 것이 아니다", () => {
    vi.setSystemTime(new Date("2026-07-29T12:00:00+09:00"));
    expect(isOverdue("2026-07-29", "PLANNED")).toBe(false);
    expect(isOverdue("2026-07-30", "PLANNED")).toBe(false);
  });
});

describe("weekRangeKST", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("정상 케이스: 주 중간 날짜는 그 주의 월요일~일요일을 반환한다", () => {
    // 2026-07-29는 수요일
    expect(weekRangeKST("2026-07-29")).toEqual({ start: "2026-07-27", end: "2026-08-02" });
  });

  it("경계값: 월요일 자신은 그 주의 시작이다", () => {
    expect(weekRangeKST("2026-07-27")).toEqual({ start: "2026-07-27", end: "2026-08-02" });
  });

  it("경계값: 일요일 자신은 그 주의 끝이다", () => {
    expect(weekRangeKST("2026-08-02")).toEqual({ start: "2026-07-27", end: "2026-08-02" });
  });

  it("연도 경계를 넘는 주도 올바르게 계산한다", () => {
    // 2026-12-31은 목요일, 그 주는 12/28(월)~2027-01-03(일)
    expect(weekRangeKST("2026-12-31")).toEqual({ start: "2026-12-28", end: "2027-01-03" });
  });

  it("인자를 생략하면 todayKST() 기준으로 계산한다", () => {
    vi.setSystemTime(new Date("2026-07-29T12:00:00+09:00"));
    expect(weekRangeKST()).toEqual({ start: "2026-07-27", end: "2026-08-02" });
  });
});
