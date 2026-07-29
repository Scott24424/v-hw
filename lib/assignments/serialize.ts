import type { Assignment } from "@prisma/client";

import { isOverdue } from "@/lib/date";

export function serializeAssignment(assignment: Assignment) {
  return {
    ...assignment,
    isOverdue: isOverdue(assignment.date, assignment.status),
  };
}
