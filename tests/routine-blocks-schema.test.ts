import { describe, expect, it } from "vitest";

import { createRoutineBlockSchema, updateRoutineBlockSchema } from "@/lib/routine-blocks/schema";

describe("createRoutineBlockSchema", () => {
  it("정상 케이스: 필수 필드만 있어도 통과한다", () => {
    const result = createRoutineBlockSchema.safeParse({
      startMinute: 450,
      endMinute: 480,
      label: "기상 & 아침식사",
    });
    expect(result.success).toBe(true);
  });

  it("정상 케이스: category/sortOrder/isActive를 포함해도 통과한다", () => {
    const result = createRoutineBlockSchema.safeParse({
      startMinute: 480,
      endMinute: 600,
      label: "수학 문제집",
      category: "STUDY",
      sortOrder: 1,
      isActive: true,
    });
    expect(result.success).toBe(true);
  });

  it("규칙 위반: label이 빈 문자열이면 거부한다", () => {
    const result = createRoutineBlockSchema.safeParse({
      startMinute: 450,
      endMinute: 480,
      label: "",
    });
    expect(result.success).toBe(false);
  });

  it("규칙 위반: startMinute이 endMinute보다 크거나 같으면 거부한다", () => {
    const result = createRoutineBlockSchema.safeParse({
      startMinute: 600,
      endMinute: 480,
      label: "잘못된 블록",
    });
    expect(result.success).toBe(false);
  });

  it("규칙 위반: startMinute이 범위(0~1439)를 벗어나면 거부한다", () => {
    const result = createRoutineBlockSchema.safeParse({
      startMinute: -1,
      endMinute: 480,
      label: "범위 밖",
    });
    expect(result.success).toBe(false);
  });

  it("규칙 위반: category가 STUDY/ROUTINE이 아니면 거부한다", () => {
    const result = createRoutineBlockSchema.safeParse({
      startMinute: 450,
      endMinute: 480,
      label: "기상 & 아침식사",
      category: "PLAY",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateRoutineBlockSchema", () => {
  it("정상 케이스: 필드 하나만 수정해도 통과한다", () => {
    const result = updateRoutineBlockSchema.safeParse({ label: "새 이름" });
    expect(result.success).toBe(true);
  });

  it("정상 케이스: startMinute/endMinute을 함께 수정하면 순서를 검증한다", () => {
    const result = updateRoutineBlockSchema.safeParse({ startMinute: 500, endMinute: 550 });
    expect(result.success).toBe(true);
  });

  it("규칙 위반: 빈 객체는 거부한다(수정할 필드가 없음)", () => {
    const result = updateRoutineBlockSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("규칙 위반: startMinute/endMinute을 함께 수정할 때 순서가 뒤바뀌면 거부한다", () => {
    const result = updateRoutineBlockSchema.safeParse({ startMinute: 600, endMinute: 500 });
    expect(result.success).toBe(false);
  });

  it("규칙 위반: isActive가 boolean이 아니면 거부한다", () => {
    const result = updateRoutineBlockSchema.safeParse({ isActive: "yes" });
    expect(result.success).toBe(false);
  });
});
