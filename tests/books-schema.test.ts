import { describe, expect, it } from "vitest";

import { createBookSchema, updateBookSchema } from "@/lib/books/schema";

describe("createBookSchema", () => {
  it("정상 케이스: title/language만 있어도 통과한다", () => {
    const result = createBookSchema.safeParse({
      title: "Big Note",
      language: "EN",
    });
    expect(result.success).toBe(true);
  });

  it("정상 케이스: totalChapters/totalPages를 포함해도 통과한다", () => {
    const result = createBookSchema.safeParse({
      title: "무지개 물고기",
      language: "KO",
      totalChapters: 10,
      totalPages: 32,
    });
    expect(result.success).toBe(true);
  });

  it("규칙 위반: title이 빈 문자열이면 거부한다", () => {
    const result = createBookSchema.safeParse({ title: "", language: "EN" });
    expect(result.success).toBe(false);
  });

  it("규칙 위반: title이 없으면 거부한다", () => {
    const result = createBookSchema.safeParse({ language: "EN" });
    expect(result.success).toBe(false);
  });

  it("규칙 위반: language가 EN/KO가 아니면 거부한다", () => {
    const result = createBookSchema.safeParse({ title: "Big Note", language: "JP" });
    expect(result.success).toBe(false);
  });

  it("규칙 위반: totalChapters가 0 이하이면 거부한다", () => {
    const result = createBookSchema.safeParse({
      title: "Big Note",
      language: "EN",
      totalChapters: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateBookSchema", () => {
  it("정상 케이스: 필드 하나만 수정해도 통과한다", () => {
    const result = updateBookSchema.safeParse({ totalPages: 217 });
    expect(result.success).toBe(true);
  });

  it("정상 케이스: null로 넘기면 값을 지우는 것으로 허용한다", () => {
    const result = updateBookSchema.safeParse({ totalPages: null });
    expect(result.success).toBe(true);
  });

  it("규칙 위반: 빈 객체는 거부한다(수정할 필드가 없음)", () => {
    const result = updateBookSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("규칙 위반: language가 EN/KO가 아니면 거부한다", () => {
    const result = updateBookSchema.safeParse({ language: "FR" });
    expect(result.success).toBe(false);
  });
});
