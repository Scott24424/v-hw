import { AssignmentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  createAssignmentSchema,
  updateAssignmentSchema,
  updateAssignmentStatusSchema,
} from "@/lib/assignments/schema";
import { isAllowedStatusTransition } from "@/lib/assignments/status";

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

describe("updateAssignmentSchema", () => {
  it("정상 케이스: 필드 하나만 수정해도 통과한다", () => {
    const result = updateAssignmentSchema.safeParse({ title: "새 제목" });
    expect(result.success).toBe(true);
  });

  it("정상 케이스: note를 null로 넘기면 값을 지우는 것으로 허용한다", () => {
    const result = updateAssignmentSchema.safeParse({ note: null });
    expect(result.success).toBe(true);
  });

  it("정상 케이스: routineBlockId를 null로 넘기면 연결을 해제하는 것으로 허용한다", () => {
    const result = updateAssignmentSchema.safeParse({ routineBlockId: null });
    expect(result.success).toBe(true);
  });

  it("정상 케이스: progressStart/progressEnd를 함께 수정하면 순서를 검증한다", () => {
    const result = updateAssignmentSchema.safeParse({ progressStart: 5, progressEnd: 10 });
    expect(result.success).toBe(true);
  });

  it("규칙 위반: 빈 객체는 거부한다(수정할 필드가 없음)", () => {
    const result = updateAssignmentSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("규칙 위반: progressStart가 progressEnd보다 크면 거부한다", () => {
    const result = updateAssignmentSchema.safeParse({ progressStart: 20, progressEnd: 10 });
    expect(result.success).toBe(false);
  });

  it("규칙 위반: 날짜 형식이 어긋나면 거부한다", () => {
    const result = updateAssignmentSchema.safeParse({ date: "2026/08/01" });
    expect(result.success).toBe(false);
  });

  it("규칙 위반: bookId를 null로 넘기면 거부한다(READING 불변식 보호)", () => {
    const result = updateAssignmentSchema.safeParse({ bookId: null });
    expect(result.success).toBe(false);
  });
});

describe("updateAssignmentStatusSchema", () => {
  it("정상 케이스: status만 있으면 통과한다", () => {
    const result = updateAssignmentStatusSchema.safeParse({ status: "DONE" });
    expect(result.success).toBe(true);
  });

  it("규칙 위반: status가 아닌 필드가 섞이면 거부한다(.strict())", () => {
    const result = updateAssignmentStatusSchema.safeParse({ status: "DONE", title: "몰래 수정" });
    expect(result.success).toBe(false);
  });

  it("규칙 위반: status가 허용된 enum 값이 아니면 거부한다", () => {
    const result = updateAssignmentStatusSchema.safeParse({ status: "CANCELLED" });
    expect(result.success).toBe(false);
  });
});

describe("isAllowedStatusTransition", () => {
  it("정상 케이스: architecture.md §3.1의 모든 허용 전이를 통과시킨다", () => {
    const { PLANNED, IN_PROGRESS, DONE, SKIPPED } = AssignmentStatus;
    const allowed: [AssignmentStatus, AssignmentStatus][] = [
      [PLANNED, IN_PROGRESS],
      [PLANNED, DONE],
      [PLANNED, SKIPPED],
      [IN_PROGRESS, DONE],
      [IN_PROGRESS, SKIPPED],
      [IN_PROGRESS, PLANNED],
      [DONE, PLANNED],
      [DONE, SKIPPED],
      [SKIPPED, PLANNED],
    ];
    for (const [from, to] of allowed) {
      expect(isAllowedStatusTransition(from, to)).toBe(true);
    }
  });

  it("규칙 위반: 표에 없는 전이는 거부한다", () => {
    expect(isAllowedStatusTransition(AssignmentStatus.SKIPPED, AssignmentStatus.DONE)).toBe(
      false,
    );
    expect(
      isAllowedStatusTransition(AssignmentStatus.SKIPPED, AssignmentStatus.IN_PROGRESS),
    ).toBe(false);
    expect(isAllowedStatusTransition(AssignmentStatus.DONE, AssignmentStatus.IN_PROGRESS)).toBe(
      false,
    );
  });

  it("규칙 위반: 동일 상태로의 전이는 거부한다", () => {
    expect(isAllowedStatusTransition(AssignmentStatus.PLANNED, AssignmentStatus.PLANNED)).toBe(
      false,
    );
    expect(isAllowedStatusTransition(AssignmentStatus.DONE, AssignmentStatus.DONE)).toBe(false);
  });
});
