import { z } from "zod";
import { Role } from "@prisma/client";

export const signupSchema = z.object({
  name: z.string().min(3),

  email: z.email(),

  password: z.string().min(6),

  role: z.nativeEnum(Role).optional(),

  reportsToId: z.string().uuid().optional(),
});

export const loginSchema = z.object({
  email: z.email(),

  password: z.string().min(6),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});