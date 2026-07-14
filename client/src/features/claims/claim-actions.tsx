"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, History, MessageSquareText, RotateCcw, Upload, X } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/common/field";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, getErrorMessage } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import { ApiResponse, Claim, ClaimActivity } from "@/types/domain";
import { NoteValues, noteSchema } from "./schemas";

export function ClaimActions({ claim }: { claim: Claim }) {
  const user = useAppSelector((state) => state.auth.user);
  const queryClient = useQueryClient();
  const [action, setAction] = useState<"reject" | "revert" | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  const form = useForm<NoteValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { note: "" },
  });

  const canReview =
    claim.pendingWithId === user?.id &&
    (user?.role === "MANAGER" || user?.role === "SENIOR_MANAGER");
  const canEmployeeSubmit =
    claim.employeeId === user?.id &&
    (claim.status === "DRAFT" || claim.status === "REVERTED_TO_EMPLOYEE");
  const actionDetails =
    action === "revert"
      ? {
          title: "Revert to employee",
          description:
            "Add a clear correction message. The employee will see it before resubmitting.",
          label: "Correction message",
          placeholder: "Example: Please attach the receipt and clarify this expense.",
          confirm: "Send revert",
        }
      : {
          title: "Reject claim",
          description:
            "Add the reason for rejection so the decision is clear in the timeline.",
          label: "Rejection reason",
          placeholder: "Example: This expense is outside the reimbursement policy.",
          confirm: "Reject claim",
        };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["claims"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["timeline", claim.id] });
  };

  const simpleAction = useMutation({
    mutationFn: async (endpoint: string) => {
      const response = await api.post<ApiResponse<Claim>>(endpoint, {});
      return response.data.data;
    },
    onSuccess: () => {
      toast.success("Claim updated");
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const noteAction = useMutation({
    mutationFn: async (values: NoteValues) => {
      const response = await api.post<ApiResponse<Claim>>(
        `/api/approvals/${claim.id}/${action}`,
        values
      );
      return response.data.data;
    },
    onSuccess: () => {
      toast.success(action === "revert" ? "Claim reverted" : "Claim rejected");
      form.reset();
      setAction(null);
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const receiptUpload = useMutation({
    mutationFn: async (file: File) => {
      const data = new FormData();
      data.append("receipt", file);

      const response = await api.post<ApiResponse<Claim>>(
        `/api/claims/${claim.id}/receipt`,
        data
      );

      return response.data.data;
    },
    onSuccess: () => {
      toast.success("Receipt uploaded");
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const timelineQuery = useQuery({
    queryKey: ["timeline", claim.id],
    enabled: showTimeline,
    queryFn: async () => {
      const response = await api.get<ApiResponse<ClaimActivity[]>>(
        `/api/claims/${claim.id}/timeline`
      );

      return response.data.data;
    },
  });

  const onUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      receiptUpload.mutate(file);
    }
  };

  const openNoteAction = (nextAction: "reject" | "revert") => {
    form.reset();
    setAction(nextAction);
  };

  return (
    <div className="grid justify-items-end gap-3">
      <div className="flex flex-wrap justify-end gap-2">
        {canEmployeeSubmit ? (
          <Button
            size="sm"
            onClick={() => simpleAction.mutate(`/api/claims/${claim.id}/submit`)}
            disabled={simpleAction.isPending}
          >
            <Check />
            Submit
          </Button>
        ) : null}
        {canReview ? (
          <>
            <Button
              size="sm"
              onClick={() =>
                simpleAction.mutate(`/api/approvals/${claim.id}/approve`)
              }
              disabled={simpleAction.isPending}
            >
              <Check />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => openNoteAction("reject")}
            >
              <X />
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openNoteAction("revert")}
            >
              <RotateCcw />
              Revert
            </Button>
          </>
        ) : null}
        {canEmployeeSubmit ? (
          <label>
            <Input className="hidden" type="file" onChange={onUpload} />
            <span className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border px-2.5 text-[0.8rem] font-medium hover:bg-muted">
              <Upload className="size-3.5" />
              Receipt
            </span>
          </label>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowTimeline((value) => !value)}
        >
          <History />
          Timeline
        </Button>
      </div>

      {action ? (
        <form
          className="grid w-full max-w-[360px] gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left shadow-sm"
          onSubmit={form.handleSubmit((values) => noteAction.mutate(values))}
        >
          <div className="flex items-start gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-cyan-50 text-cyan-700">
              <MessageSquareText className="size-4" />
            </span>
            <div className="grid gap-1">
              <p className="text-sm font-semibold text-slate-950">
                {actionDetails.title}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {actionDetails.description}
              </p>
            </div>
          </div>
          <Field
            label={actionDetails.label}
            error={form.formState.errors.note?.message}
          >
            <Textarea
              className="min-h-20"
              placeholder={actionDetails.placeholder}
              {...form.register("note")}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button size="sm" type="submit" disabled={noteAction.isPending}>
              {actionDetails.confirm}
            </Button>
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => setAction(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {showTimeline ? (
        <Card className="w-full max-w-[300px] overflow-hidden">
          <CardHeader className="shrink-0">
            <CardTitle>Activity timeline</CardTitle>
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto p-3">
            {timelineQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading timeline...</p>
            ) : timelineQuery.data?.length ? (
              <div className="grid gap-3">
                {timelineQuery.data.map((activity) => (
                  <div key={activity.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium">{activity.action}</span>
                      <StatusBadge status={claim.status} />
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {activity.actor.name} •{" "}
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                    {activity.note ? (
                      <p className="mt-2 break-words">{activity.note}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No activity recorded yet.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
