import { z } from "zod";

import { roles } from "@/types/domain";

export const userSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    email: z.email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(roles),
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

export type UserValues = z.infer<typeof userSchema>;
