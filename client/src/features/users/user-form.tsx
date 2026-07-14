"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/common/field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api, getErrorMessage } from "@/lib/api";
import { ApiResponse, PaginatedResponse, Role, User, roles } from "@/types/domain";
import { UserValues, userSchema } from "./schemas";

const reporterRoleByUserRole: Partial<Record<Role, Role>> = {
  EMPLOYEE: "MANAGER",
  MANAGER: "SENIOR_MANAGER",
};

export function UserForm({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<UserValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "Password@123",
      role: "EMPLOYEE",
      reportsToId: "",
    },
  });

  const selectedRole = useWatch({
    control: form.control,
    name: "role",
  });
  const requiredReporterRole = reporterRoleByUserRole[selectedRole];

  const reportersQuery = useQuery({
    queryKey: ["user-reporters", requiredReporterRole],
    enabled: Boolean(requiredReporterRole),
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaginatedResponse<User>>>(
        "/api/users",
        {
          params: {
            role: requiredReporterRole,
            limit: 100,
          },
        }
      );

      return response.data.data.items;
    },
  });

  useEffect(() => {
    form.setValue("reportsToId", "");
  }, [selectedRole, form]);

  const createUser = useMutation({
    mutationFn: async (values: UserValues) => {
      const response = await api.post<ApiResponse<User>>("/api/users", {
        ...values,
        reportsToId: values.reportsToId || undefined,
      });

      return response.data.data;
    },
    onSuccess: () => {
      toast.success("User created");
      form.reset({
        name: "",
        email: "",
        password: "Password@123",
        role: "EMPLOYEE",
        reportsToId: "",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onSuccess?.();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create user</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) => createUser.mutate(values))}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} />
            </Field>
            <Field label="Email" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register("email")} />
            </Field>
            <Field
              label="Password"
              error={form.formState.errors.password?.message}
            >
              <div className="relative">
                <Input
                  className="pr-10"
                  type={showPassword ? "text" : "password"}
                  {...form.register("password")}
                />
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </Field>
            <Field label="Role" error={form.formState.errors.role?.message}>
              <Select {...form.register("role")}>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field
            label="Reports to"
            error={form.formState.errors.reportsToId?.message}
          >
            <Select
              disabled={!requiredReporterRole || reportersQuery.isLoading}
              {...form.register("reportsToId")}
            >
              <option value="">
                {requiredReporterRole
                  ? reportersQuery.isLoading
                    ? "Loading reporting options..."
                    : `Select ${requiredReporterRole
                        .replaceAll("_", " ")
                        .toLowerCase()}`
                  : "No reporting manager needed"}
              </option>
              {(reportersQuery.data ?? []).map((reporter) => (
                <option key={reporter.id} value={reporter.id}>
                  {reporter.name} ({reporter.role.replaceAll("_", " ")})
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" disabled={createUser.isPending}>
            <UserPlus />
            {createUser.isPending ? "Creating..." : "Create user"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
