import { z } from "zod";

import { expenseCategories } from "@/types/domain";

export const claimSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.string().min(3).max(3),
  category: z.enum(expenseCategories),
  description: z.string().min(3, "Description must be at least 3 characters"),
  expenseDate: z.string().min(1, "Expense date is required"),
  saveAsDraft: z.boolean(),
});

export const noteSchema = z.object({
  note: z.string().min(3, "Note must be at least 3 characters"),
});

export type ClaimValues = z.infer<typeof claimSchema>;
export type NoteValues = z.infer<typeof noteSchema>;
