import { BlockCategory } from "@prisma/client";
import { z } from "zod";

const minuteOfDay = z.number().int().min(0).max(1439);

export const createRoutineBlockSchema = z
  .object({
    startMinute: minuteOfDay,
    endMinute: minuteOfDay,
    label: z.string().min(1),
    category: z.nativeEnum(BlockCategory).optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.startMinute < data.endMinute, {
    message: "startMinute은 endMinute보다 작아야 합니다",
    path: ["endMinute"],
  });

export type CreateRoutineBlockInput = z.infer<typeof createRoutineBlockSchema>;

export const updateRoutineBlockSchema = z
  .object({
    startMinute: minuteOfDay.optional(),
    endMinute: minuteOfDay.optional(),
    label: z.string().min(1).optional(),
    category: z.nativeEnum(BlockCategory).optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "수정할 필드가 최소 1개 필요합니다",
  })
  .refine(
    (data) =>
      data.startMinute === undefined ||
      data.endMinute === undefined ||
      data.startMinute < data.endMinute,
    { message: "startMinute은 endMinute보다 작아야 합니다", path: ["endMinute"] },
  );

export type UpdateRoutineBlockInput = z.infer<typeof updateRoutineBlockSchema>;
