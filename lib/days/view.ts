import type { Assignment, RoutineBlock } from "@prisma/client";

import { serializeAssignment } from "@/lib/assignments/serialize";

// architecture.md §4.1: 특정 날짜의 시간표 = isActive인 RoutineBlock 전체 + 그 날짜의
// Assignment를 routineBlockId로 조인한 결과.
// routineBlockId가 (비활성화 등으로) 넘어온 blocks에 없는 경우도 미연결로 취급한다 —
// 그렇지 않으면 블록을 비활성화하는 순간 그 과제가 오늘 화면 어디에도 안 보이게 되어
// "밀린 것이 영원히 묻힌다"는 이 앱이 피하려는 실패 양상을 그대로 재현한다.
export function buildDayView(date: string, blocks: RoutineBlock[], assignments: Assignment[]) {
  const activeBlockIds = new Set(blocks.map((block) => block.id));
  const assignmentsByBlockId = new Map<number, Assignment[]>();
  const unlinkedAssignments: Assignment[] = [];

  for (const assignment of assignments) {
    if (assignment.routineBlockId !== null && activeBlockIds.has(assignment.routineBlockId)) {
      const list = assignmentsByBlockId.get(assignment.routineBlockId) ?? [];
      list.push(assignment);
      assignmentsByBlockId.set(assignment.routineBlockId, list);
    } else {
      unlinkedAssignments.push(assignment);
    }
  }

  return {
    date,
    blocks: blocks.map((block) => ({
      ...block,
      assignments: (assignmentsByBlockId.get(block.id) ?? []).map(serializeAssignment),
    })),
    unlinkedAssignments: unlinkedAssignments.map(serializeAssignment),
  };
}
