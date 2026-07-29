import { AssignmentStatus, AssignmentType, ProgressUnit } from "@prisma/client";
import { z } from "zod";

import { isValidDateString } from "@/lib/date";

const dateString = z.string().refine(isValidDateString, {
  message: "date must be a valid YYYY-MM-DD",
});

export const createAssignmentSchema = z
  .object({
    date: dateString,
    type: z.nativeEnum(AssignmentType),
    title: z.string().min(1),
    note: z.string().optional(),
    bookId: z.number().int().positive().optional(),
    progressUnit: z.nativeEnum(ProgressUnit).optional(),
    progressStart: z.number().int().positive().optional(),
    progressEnd: z.number().int().positive().optional(),
    routineBlockId: z.number().int().positive().optional(),
  })
  .superRefine((data, ctx) => {
    // architecture.md §2.2: type === READING ⇒ bookId/progressUnit/progressEnd 필수,
    // 그 외 유형 ⇒ bookId/progress* 전부 null.
    if (data.type === AssignmentType.READING) {
      if (data.bookId === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bookId"],
          message: "READING 유형은 bookId가 필요합니다",
        });
      }
      if (data.progressUnit === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["progressUnit"],
          message: "READING 유형은 progressUnit이 필요합니다",
        });
      }
      if (data.progressEnd === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["progressEnd"],
          message: "READING 유형은 progressEnd가 필요합니다",
        });
      }
      if (
        data.progressStart !== undefined &&
        data.progressEnd !== undefined &&
        data.progressStart > data.progressEnd
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["progressStart"],
          message: "progressStart는 progressEnd보다 클 수 없습니다",
        });
      }
    } else {
      for (const field of ["bookId", "progressUnit", "progressStart", "progressEnd"] as const) {
        if (data[field] !== undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: `READING이 아닌 유형은 ${field}를 가질 수 없습니다`,
          });
        }
      }
    }
  });

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export const listAssignmentsQuerySchema = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
  status: z.nativeEnum(AssignmentStatus).optional(),
  type: z.nativeEnum(AssignmentType).optional(),
});

export type ListAssignmentsQuery = z.infer<typeof listAssignmentsQuerySchema>;
