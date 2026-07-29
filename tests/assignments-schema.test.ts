import { describe, expect, it } from "vitest";

import { createAssignmentSchema } from "@/lib/assignments/schema";

describe("createAssignmentSchema", () => {
  it("정상 케이스: READING 유형은 bookId/progressUnit/progressEnd와 함께 통과한다", () => {
    const result = createAssignmentSchema.safeParse({
      date: "2026-07-29",
      type: "READING",
      title: "Big Note ch.12",
      bookId: 1,
      progressUnit: "CHAPTER",
      progressEnd: 12,
    });
    expect(result.success).toBe(true);
  });

  it("정상 케이스: READING이 아닌 유형은 책 관련 필드 없이 통과한다", () => {
    const result = createAssignmentSchema.safeParse({
      date: "2026-07-29",
      type: "WORKSHEET",
      title: "work sheet",
    });
    expect(result.success).toBe(true);
  });

  it("정상 케이스: progressStart를 직접 지정해도 progressEnd 이하이면 통과한다", () => {
    const result = createAssignmentSchema.safeParse({
      date: "2026-08-08",
      type: "READING",
      title: "Wimpy Kid ~p.102",
      bookId: 2,
      progressUnit: "PAGE",
      progressStart: 1,
      progressEnd: 102,
    });
    expect(result.success).toBe(true);
  });

  it("규칙 위반: READING인데 bookId가 없으면 거부한다", () => {
    const result = createAssignmentSchema.safeParse({
      date: "2026-07-29",
      type: "READING",
      title: "제목 없는 책",
      progressUnit: "CHAPTER",
      progressEnd: 12,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("bookId"))).toBe(true);
    }
  });

  it("규칙 위반: READING인데 progressUnit/progressEnd가 없으면 거부한다", () => {
    const result = createAssignmentSchema.safeParse({
      date: "2026-07-29",
      type: "READING",
      title: "Kid Spy ch.16",
      bookId: 1,
    });
    expect(result.success).toBe(false);
  });

  it("규칙 위반: READING이 아닌데 bookId를 지정하면 거부한다", () => {
    const result = createAssignmentSchema.safeParse({
      date: "2026-07-29",
      type: "DIARY",
      title: "일기",
      bookId: 1,
    });
    expect(result.success).toBe(false);
  });

  it("규칙 위반: READING이 아닌데 progressEnd를 지정하면 거부한다", () => {
    const result = createAssignmentSchema.safeParse({
      date: "2026-07-29",
      type: "PROJECT",
      title: "reading project",
      progressEnd: 5,
    });
    expect(result.success).toBe(false);
  });

  it("규칙 위반: progressStart가 progressEnd보다 크면 거부한다", () => {
    const result = createAssignmentSchema.safeParse({
      date: "2026-08-09",
      type: "READING",
      title: "Wimpy Kid ~p.217",
      bookId: 2,
      progressUnit: "PAGE",
      progressStart: 300,
      progressEnd: 217,
    });
    expect(result.success).toBe(false);
  });

  it("규칙 위반: 날짜 형식이 어긋나면 거부한다", () => {
    const result = createAssignmentSchema.safeParse({
      date: "2026/07/29",
      type: "DIARY",
      title: "일기",
    });
    expect(result.success).toBe(false);
  });

  it("규칙 위반: 제목이 빈 문자열이면 거부한다", () => {
    const result = createAssignmentSchema.safeParse({
      date: "2026-07-29",
      type: "DIARY",
      title: "",
    });
    expect(result.success).toBe(false);
  });
});
