"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Send } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { api, getErrorMessage } from "@/lib/api";
import { ApiResponse, Claim, expenseCategories } from "@/types/domain";
import { ClaimValues, claimSchema } from "./schemas";

type ClaimFormProps = {
  claim?: Claim;
  onCancel?: () => void;
  onSuccess?: () => void;
};

const defaultValues: ClaimValues = {
  amount: 0,
  currency: "INR",
  category: "TRAVEL",
  description: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  saveAsDraft: false,
};

type ClaimPayload = Omit<ClaimValues, "saveAsDraft">;

export function ClaimForm({ claim, onCancel, onSuccess }: ClaimFormProps) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(claim);
  const form = useForm<ClaimValues>({
    resolver: zodResolver(claimSchema),
    defaultValues,
  });

  useEffect(() => {
    if (claim) {
      form.reset({
        amount: Number(claim.amount),
        currency: claim.currency,
        category: claim.category,
        description: claim.description,
        expenseDate: new Date(claim.expenseDate).toISOString().slice(0, 10),
        saveAsDraft: claim.status === "DRAFT",
      });
    } else {
      form.reset(defaultValues);
    }
  }, [claim, form]);

  const saveClaim = useMutation({
    mutationFn: async (values: ClaimValues) => {
      const payload: ClaimPayload = {
        amount: values.amount,
        currency: values.currency,
        category: values.category,
        description: values.description,
        expenseDate: values.expenseDate,
      };

      if (isEditing && claim) {
        const response = await api.patch<ApiResponse<Claim>>(
          `/api/claims/${claim.id}`,
          payload
        );

        return response.data.data;
      }

      const response = await api.post<ApiResponse<Claim>>("/api/claims", values);

      return response.data.data;
    },
    onSuccess: () => {
      toast.success(isEditing ? "Claim updated" : "Claim created");
      form.reset(defaultValues);
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onSuccess?.();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit claim" : "New claim"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) => saveClaim.mutate(values))}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Amount" error={form.formState.errors.amount?.message}>
              <Input
                type="number"
                step="1"
                {...form.register("amount", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Currency"
              error={form.formState.errors.currency?.message}
            >
              <Input maxLength={3} {...form.register("currency")} />
            </Field>
            <Field
              label="Category"
              error={form.formState.errors.category?.message}
            >
              <Select {...form.register("category")}>
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field
            label="Expense date"
            error={form.formState.errors.expenseDate?.message}
          >
            <Input type="date" {...form.register("expenseDate")} />
          </Field>
          <Field
            label="Description"
            error={form.formState.errors.description?.message}
          >
            <Textarea {...form.register("description")} />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={saveClaim.isPending}
              onClick={() => form.setValue("saveAsDraft", false)}
            >
              <Send />
              {isEditing ? "Update" : "Submit"}
            </Button>
            {isEditing ? null : (
              <Button
                type="submit"
                variant="outline"
                disabled={saveClaim.isPending}
                onClick={() => form.setValue("saveAsDraft", true)}
              >
                <Save />
                Save draft
              </Button>
            )}
            {onCancel ? (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
