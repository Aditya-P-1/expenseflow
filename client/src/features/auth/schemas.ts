import { z } from "zod";

import { signupRoles } from "@/types/domain";

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = loginSchema
  .extend({
    name: z.string().min(3, "Name must be at least 3 characters"),
    role: z.enum(signupRoles),
    reportsToId: z.string().optional(),
  })
  .superRefine((values, context) => {
    if (
      (values.role === "EMPLOYEE" || values.role === "MANAGER") &&
      !values.reportsToId
    ) {
      context.addIssue({
        code: "custom",
        path: ["reportsToId"],
        message:
          values.role === "EMPLOYEE"
            ? "Select the manager this employee reports to"
            : "Select the senior manager this manager reports to",
      });
    }
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
