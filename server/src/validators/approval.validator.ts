import { z } from "zod";

export const approvalSchema = z.object({
  note: z.string().min(3).optional(),
});

export const rejectionSchema = z.object({
  note: z.string().min(3),
});

export const revertSchema = z.object({
  note: z.string().min(3),
});
