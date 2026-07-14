import { z } from "zod";
import { Role } from "@prisma/client";

export const createUserSchema = z.object({
  name: z.string().min(3),
  email: z.email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role),
  reportsToId: z.string().uuid().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(3).optional(),
  role: z.nativeEnum(Role).optional(),
  reportsToId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});
