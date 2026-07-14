import { z } from "zod";
import { ExpenseCategory } from "@prisma/client";

export const createClaimSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().min(3).max(3).optional(),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(3),
  expenseDate: z.coerce.date(),
  receiptUrl: z.string().url().optional(),
  saveAsDraft: z.boolean().optional(),
});

export const updateClaimSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  currency: z.string().min(3).max(3).optional(),
  category: z.nativeEnum(ExpenseCategory).optional(),
  description: z.string().min(3).optional(),
  expenseDate: z.coerce.date().optional(),
  receiptUrl: z.string().url().nullable().optional(),
});
