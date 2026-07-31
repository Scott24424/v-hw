type ProgressAssignment = {
  bookId: number | null;
  progressEnd: number | null;
  progressUnit: "CHAPTER" | "PAGE" | null;
};

type Progress = { progressEnd: number; progressUnit: "CHAPTER" | "PAGE" };

// architecture.md §1.4와 같은 규칙(직전 progressEnd가 "지금까지 읽은 데")을 재사용 —
// 책의 진도는 별도 필드로 저장하지 않고 가장 최근 READING 과제에서 파생한다.
// assignments는 date desc, id desc로 정렬돼 들어온다고 가정(먼저 나온 것이 최신).
export function latestProgressByBook(
  assignments: ProgressAssignment[],
): Map<number, Progress> {
  const result = new Map<number, Progress>();
  for (const assignment of assignments) {
    if (assignment.bookId === null) continue;
    if (assignment.progressEnd === null || assignment.progressUnit === null) continue;
    if (result.has(assignment.bookId)) continue;
    result.set(assignment.bookId, {
      progressEnd: assignment.progressEnd,
      progressUnit: assignment.progressUnit,
    });
  }
  return result;
}

export function bookProgressLabel(
  book: { totalChapters: number | null; totalPages: number | null },
  latest: Progress | undefined,
): string {
  if (!latest) return "진행 기록 없음";
  const unit = latest.progressUnit === "PAGE" ? "p." : "ch.";
  const total = latest.progressUnit === "PAGE" ? book.totalPages : book.totalChapters;
  return total ? `${unit}${latest.progressEnd} / ${total}` : `${unit}${latest.progressEnd}`;
}
