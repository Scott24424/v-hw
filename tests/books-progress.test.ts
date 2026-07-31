import { describe, expect, it } from "vitest";

import { bookProgressLabel, latestProgressByBook } from "@/lib/books/progress";

describe("latestProgressByBook", () => {
  it("정상 케이스: 가장 먼저 나온(최신) 과제의 진도를 책별로 뽑는다", () => {
    const result = latestProgressByBook([
      { bookId: 1, progressEnd: 12, progressUnit: "CHAPTER" },
      { bookId: 1, progressEnd: 6, progressUnit: "CHAPTER" },
      { bookId: 2, progressEnd: 217, progressUnit: "PAGE" },
    ]);
    expect(result.get(1)).toEqual({ progressEnd: 12, progressUnit: "CHAPTER" });
    expect(result.get(2)).toEqual({ progressEnd: 217, progressUnit: "PAGE" });
  });

  it("규칙 위반 방지: bookId가 null이거나 progressEnd/progressUnit이 없으면 건너뛴다", () => {
    const result = latestProgressByBook([
      { bookId: null, progressEnd: 5, progressUnit: "CHAPTER" },
      { bookId: 3, progressEnd: null, progressUnit: null },
    ]);
    expect(result.size).toBe(0);
  });

  it("경계값: 빈 배열이면 빈 Map을 반환한다", () => {
    expect(latestProgressByBook([]).size).toBe(0);
  });
});

describe("bookProgressLabel", () => {
  it("정상 케이스: 진도 기록이 없으면 안내 문구를 반환한다", () => {
    expect(bookProgressLabel({ totalChapters: null, totalPages: null }, undefined)).toBe(
      "진행 기록 없음",
    );
  });

  it("정상 케이스: totalChapters가 있으면 분모를 함께 보여준다", () => {
    expect(
      bookProgressLabel(
        { totalChapters: 20, totalPages: null },
        { progressEnd: 12, progressUnit: "CHAPTER" },
      ),
    ).toBe("ch.12 / 20");
  });

  it("정상 케이스: totalPages가 없으면 분자만 보여준다", () => {
    expect(
      bookProgressLabel(
        { totalChapters: null, totalPages: null },
        { progressEnd: 217, progressUnit: "PAGE" },
      ),
    ).toBe("p.217");
  });

  it("규칙 위반 방지: progressUnit이 PAGE면 totalChapters가 아니라 totalPages를 분모로 쓴다", () => {
    expect(
      bookProgressLabel(
        { totalChapters: 999, totalPages: 300 },
        { progressEnd: 217, progressUnit: "PAGE" },
      ),
    ).toBe("p.217 / 300");
  });
});
