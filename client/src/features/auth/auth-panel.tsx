"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Field } from "@/components/common/field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api, getErrorMessage } from "@/lib/api";
import { persistAuth } from "@/lib/auth-storage";
import { setCredentials } from "@/store/auth-slice";
import { useAppDispatch } from "@/store/hooks";
import {
  ApiResponse,
  AuthResponse,
  Role,
  User,
  signupRoles,
} from "@/types/domain";
import { LoginValues, SignupValues, loginSchema, signupSchema } from "./schemas";

const reporterRoleBySignupRole: Partial<Record<SignupValues["role"], Role>> = {
  EMPLOYEE: "MANAGER",
  MANAGER: "SENIOR_MANAGER",
};

export function AuthPanel({ mode }: { mode: "login" | "signup" }) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "employee@expenseflow.com",
      password: "Password@123",
    },
  });

  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "EMPLOYEE",
      reportsToId: "",
    },
  });

  const selectedRole = useWatch({
    control: signupForm.control,
    name: "role",
  });
  const requiredReporterRole = reporterRoleBySignupRole[selectedRole];

  const reportersQuery = useQuery({
    queryKey: ["signup-reporters"],
    enabled: mode === "signup",
    queryFn: async () => {
      const response = await api.get<
        ApiResponse<Pick<User, "id" | "name" | "email" | "role">[]>
      >("/api/auth/reporters");

      return response.data.data;
    },
  });

  const reporterOptions =
    reportersQuery.data?.filter((user) => user.role === requiredReporterRole) ??
    [];

  useEffect(() => {
    signupForm.setValue("reportsToId", "");
  }, [selectedRole, signupForm]);

  const authMutation = useMutation({
    mutationFn: async ({
      endpoint,
      values,
    }: {
      endpoint: "login" | "signup";
      values: LoginValues | SignupValues;
    }) => {
      const response = await api.post<ApiResponse<AuthResponse>>(
        `/api/auth/${endpoint}`,
        values
      );

      return response.data.data;
    },
    onSuccess: (data) => {
      persistAuth(data);
      dispatch(setCredentials(data));
      toast.success(`Welcome, ${data.user.name}`);
      router.replace("/dashboard");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        className="w-full max-w-md"
      >
        <Card className="border-white/70 bg-white/95 shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-slate-950 via-indigo-700 to-cyan-600 bg-clip-text text-2xl text-transparent">
              {mode === "login" ? "Welcome back" : "Create account"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Login with your existing account"
                : "Create a user to start your journey"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="grid gap-4"
                  onSubmit={loginForm.handleSubmit((values) =>
                    authMutation.mutate({ endpoint: "login", values })
                  )}
                >
                  <Field
                    label="Email"
                    error={loginForm.formState.errors.email?.message}
                  >
                    <Input {...loginForm.register("email")} />
                  </Field>
                  <Field
                    label="Password"
                    error={loginForm.formState.errors.password?.message}
                  >
                    <Input type="password" {...loginForm.register("password")} />
                  </Field>
                  <Button disabled={authMutation.isPending} type="submit" size="lg">
                    <LogIn />
                    {authMutation.isPending ? "Signing in..." : "Sign in"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    New here?{" "}
                    <Link className="font-medium text-cyan-700" href="/signup">
                      Create an account
                    </Link>
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="grid gap-4"
                  onSubmit={signupForm.handleSubmit((values) =>
                    authMutation.mutate({
                      endpoint: "signup",
                      values: {
                        ...values,
                        reportsToId: values.reportsToId || undefined,
                      },
                    })
                  )}
                >
                  <Field
                    label="Name"
                    error={signupForm.formState.errors.name?.message}
                  >
                    <Input {...signupForm.register("name")} />
                  </Field>
                  <Field
                    label="Email"
                    error={signupForm.formState.errors.email?.message}
                  >
                    <Input {...signupForm.register("email")} />
                  </Field>
                  <Field
                    label="Password"
                    error={signupForm.formState.errors.password?.message}
                  >
                    <Input type="password" {...signupForm.register("password")} />
                  </Field>
                  <Field
                    label="Role"
                    error={signupForm.formState.errors.role?.message}
                  >
                    <Select {...signupForm.register("role")}>
                      {signupRoles.map((role) => (
                        <option key={role} value={role}>
                          {role.replaceAll("_", " ")}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    label="Reports to"
                    error={signupForm.formState.errors.reportsToId?.message}
                  >
                    <Select
                      disabled={!requiredReporterRole || reportersQuery.isLoading}
                      {...signupForm.register("reportsToId")}
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
                      {reporterOptions.map((reporter) => (
                        <option key={reporter.id} value={reporter.id}>
                          {reporter.name} ({reporter.role.replaceAll("_", " ")})
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Button disabled={authMutation.isPending} type="submit" size="lg">
                    <UserPlus />
                    {authMutation.isPending ? "Creating..." : "Create account"}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link className="font-medium text-cyan-700" href="/login">
                      Sign in
                    </Link>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
