import { BookLanguage } from "@prisma/client";
import { z } from "zod";

const totalCount = z.number().int().positive().nullable().optional();

export const createBookSchema = z.object({
  title: z.string().min(1),
  language: z.nativeEnum(BookLanguage),
  totalChapters: totalCount,
  totalPages: totalCount,
});

export type CreateBookInput = z.infer<typeof createBookSchema>;

export const updateBookSchema = z
  .object({
    title: z.string().min(1).optional(),
    language: z.nativeEnum(BookLanguage).optional(),
    totalChapters: totalCount,
    totalPages: totalCount,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "수정할 필드가 최소 1개 필요합니다",
  });

export type UpdateBookInput = z.infer<typeof updateBookSchema>;
