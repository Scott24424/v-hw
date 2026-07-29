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

// PATCH /api/assignments/:id: architecture.md §5 "수정 (날짜·제목·진도·블록 연결·정렬)".
// type/status는 이 스키마 대상이 아니다 — type은 사실상 불변이고 status는
// /api/assignments/:id/status 전용 엔드포인트(§5.1)로 분리되어 있다.
// READING 여부에 따른 진도 필드 허용 규칙(§2.2)은 update 시점엔 기존 레코드의
// type을 DB에서 조회해야 판단 가능하므로 라우트 핸들러에서 검증한다.
export const updateAssignmentSchema = z
  .object({
    date: dateString.optional(),
    title: z.string().min(1).optional(),
    note: z.string().nullable().optional(),
    bookId: z.number().int().positive().optional(),
    progressUnit: z.nativeEnum(ProgressUnit).optional(),
    progressStart: z.number().int().positive().optional(),
    progressEnd: z.number().int().positive().optional(),
    routineBlockId: z.number().int().positive().nullable().optional(),
    sortOrder: z.number().int().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "수정할 필드가 최소 1개 필요합니다",
  })
  .refine(
    (data) =>
      data.progressStart === undefined ||
      data.progressEnd === undefined ||
      data.progressStart <= data.progressEnd,
    { message: "progressStart는 progressEnd보다 클 수 없습니다", path: ["progressStart"] },
  );

export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;

// PATCH /api/assignments/:id/status: 아이용 원터치 상태 변경 전용(§5.1).
// 전이 규칙만 검사하고 다른 필드는 받지 않으므로 .strict()로 여분 필드를 거부한다.
export const updateAssignmentStatusSchema = z
  .object({
    status: z.nativeEnum(AssignmentStatus),
  })
  .strict();

export type UpdateAssignmentStatusInput = z.infer<typeof updateAssignmentStatusSchema>;
