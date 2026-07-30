import type { Assignment, RoutineBlock } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { buildDayView } from "@/lib/days/view";

function makeBlock(overrides: Partial<RoutineBlock> & { id: number }): RoutineBlock {
  return {
    startMinute: 480,
    endMinute: 600,
    label: "수학 문제집",
    category: "STUDY",
    sortOrder: 0,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function makeAssignment(overrides: Partial<Assignment> & { id: number }): Assignment {
  return {
    date: "2026-07-29",
    type: "DIARY",
    title: "일기",
    note: null,
    status: "PLANNED",
    sortOrder: 0,
    completedAt: null,
    bookId: null,
    progressUnit: null,
    progressStart: null,
    progressEnd: null,
    routineBlockId: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("buildDayView", () => {
  it("정상 케이스: 과제를 연결된 블록 밑으로 묶는다", () => {
    const block = makeBlock({ id: 1 });
    const assignment = makeAssignment({ id: 10, routineBlockId: 1 });

    const result = buildDayView("2026-07-29", [block], [assignment]);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].assignments.map((a) => a.id)).toEqual([10]);
    expect(result.unlinkedAssignments).toEqual([]);
  });

  it("정상 케이스: routineBlockId가 null인 과제는 미연결로 분류한다", () => {
    const assignment = makeAssignment({ id: 11, routineBlockId: null });

    const result = buildDayView("2026-07-29", [], [assignment]);

    expect(result.unlinkedAssignments.map((a) => a.id)).toEqual([11]);
  });

  it("규칙 위반 방지: 비활성화된(전달되지 않은) 블록을 가리키는 과제는 미연결로 취급해 사라지지 않는다", () => {
    // blocks 인자에는 isActive=true인 블록만 넘어온다는 라우트 계약을 재현 —
    // routineBlockId=999는 넘어온 blocks 목록에 없다(비활성화되었거나 삭제된 상황).
    const assignment = makeAssignment({ id: 12, routineBlockId: 999 });

    const result = buildDayView("2026-07-29", [], [assignment]);

    expect(result.unlinkedAssignments.map((a) => a.id)).toEqual([12]);
  });

  it("정상 케이스: 과제가 없는 블록은 빈 assignments 배열을 가진다", () => {
    const block = makeBlock({ id: 2 });

    const result = buildDayView("2026-07-29", [block], []);

    expect(result.blocks[0].assignments).toEqual([]);
  });

  it("정상 케이스: 같은 블록에 여러 과제가 연결되면 입력 순서를 유지한다", () => {
    const block = makeBlock({ id: 3 });
    const first = makeAssignment({ id: 20, routineBlockId: 3, sortOrder: 0 });
    const second = makeAssignment({ id: 21, routineBlockId: 3, sortOrder: 1 });

    const result = buildDayView("2026-07-29", [block], [first, second]);

    expect(result.blocks[0].assignments.map((a) => a.id)).toEqual([20, 21]);
  });

  it("응답에 date가 그대로 포함된다", () => {
    const result = buildDayView("2026-07-29", [], []);
    expect(result.date).toBe("2026-07-29");
  });
});
