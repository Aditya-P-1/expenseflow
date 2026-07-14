"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { SectionHeading } from "@/components/common/section-heading";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { api, getErrorMessage } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import {
  ApiResponse,
  Claim,
  ClaimStatus,
  ExpenseCategory,
  PaginatedResponse,
  claimStatuses,
  editableClaimStatuses,
  expenseCategories,
} from "@/types/domain";
import { ClaimActions } from "./claim-actions";
import { ClaimForm } from "./claim-form";

type ActionWarningProps = {
  message?: string;
  children: ReactNode;
};

function ActionWarning({ message, children }: ActionWarningProps) {
  return (
    <span className="group relative inline-flex" title={message}>
      {children}
      {message ? (
        <span className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 hidden w-56 rounded-md border border-slate-800 bg-slate-950 px-2.5 py-2 text-left text-xs font-medium leading-snug text-white shadow-lg group-hover:block group-focus-within:block">
          {message}
        </span>
      ) : null}
    </span>
  );
}

function RevertMessage({ message }: { message: string }) {
  return (
    <span
      className="group relative block max-w-full"
      title={message}
      tabIndex={0}
    >
      <span className="block max-w-[190px] truncate rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
        {message}
      </span>
      <span className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-72 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-left text-xs font-medium leading-relaxed text-white shadow-lg group-hover:block group-focus:block">
        {message}
      </span>
    </span>
  );
}

export function ClaimsWorkspace() {
  const user = useAppSelector((state) => state.auth.user);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ClaimStatus | "">("");
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [claimToDelete, setClaimToDelete] = useState<Claim | null>(null);

  const filters = useDebounce({ status, category, fromDate, toDate }, 350);

  const claimsQuery = useQuery({
    queryKey: ["claims", page, filters],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaginatedResponse<Claim>>>(
        "/api/claims",
        {
          params: {
            page,
            limit: 8,
            status: filters.status || undefined,
            category: filters.category || undefined,
            fromDate: filters.fromDate || undefined,
            toDate: filters.toDate || undefined,
          },
        }
      );

      return response.data.data;
    },
  });

  const claims = claimsQuery.data?.items ?? [];
  const meta = claimsQuery.data?.meta;
  const canAddClaim = user?.role === "EMPLOYEE";

  const deleteClaim = useMutation({
    mutationFn: async (claimId: string) => {
      await api.delete(`/api/claims/${claimId}`);
    },
    onSuccess: () => {
      toast.success("Claim deleted");
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const canEditClaim = (claim: Claim) =>
    claim.employeeId === user?.id &&
    editableClaimStatuses.includes(claim.status);

  const canDeleteClaim = (claim: Claim) =>
    editableClaimStatuses.includes(claim.status) &&
    (user?.role === "ADMIN" || claim.employeeId === user?.id);

  const getEditWarning = (claim: Claim) => {
    if (canEditClaim(claim)) {
      return undefined;
    }

    if (claim.employeeId !== user?.id) {
      return "You can edit only your own claims.";
    }

    return "Only Draft or Reverted-to-Employee claims can be edited.";
  };

  const getDeleteWarning = (claim: Claim) => {
    if (canDeleteClaim(claim)) {
      return undefined;
    }

    if (!editableClaimStatuses.includes(claim.status)) {
      return "Only Draft or Reverted-to-Employee claims can be deleted.";
    }

    return "You can delete only your own claims.";
  };

  const getLatestRevertMessage = (claim: Claim) => {
    if (
      claim.status !== "REVERTED_TO_EMPLOYEE" &&
      claim.status !== "REVERTED_TO_MANAGER"
    ) {
      return undefined;
    }

    return claim.activities?.find((activity) => activity.action === "REVERTED")
      ?.note;
  };

  const openCreateForm = () => {
    setEditingClaim(null);
    setIsFormOpen(true);
  };

  const openEditForm = (claim: Claim) => {
    setEditingClaim(claim);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingClaim(null);
    setIsFormOpen(false);
  };

  const confirmDeleteClaim = () => {
    if (!claimToDelete) {
      return;
    }

    deleteClaim.mutate(claimToDelete.id, {
      onSuccess: () => setClaimToDelete(null),
    });
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeading
          title="Claims"
          description="Filter, review, and track reimbursement requests."
        />
        {canAddClaim ? (
          <Button className="w-fit" onClick={openCreateForm}>
            <Plus />
            Add claim
          </Button>
        ) : null}
      </div>

      <AnimatePresence>
        {isFormOpen ? (
          <motion.div
            className="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-3 flex justify-end">
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Close claim form"
                  onClick={closeForm}
                >
                  <X />
                </Button>
              </div>
              <ClaimForm
                claim={editingClaim ?? undefined}
                onCancel={closeForm}
                onSuccess={closeForm}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {claimToDelete ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-lg border bg-white p-5 shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-claim-title"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600">
                  <TriangleAlert className="size-5" />
                </span>
                <div className="grid gap-1">
                  <h2
                    id="delete-claim-title"
                    className="text-base font-semibold text-slate-950"
                  >
                    Delete claim
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Delete {claimToDelete.claimNumber}? This action cannot be
                    undone.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setClaimToDelete(null)}
                  disabled={deleteClaim.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={confirmDeleteClaim}
                  disabled={deleteClaim.isPending}
                >
                  <Trash2 />
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Card className="overflow-hidden rounded-lg">
        <CardHeader>
          <CardTitle>Claim list</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as ClaimStatus | "");
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {claimStatuses.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
            <Select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as ExpenseCategory | "");
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {expenseCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <Input
              type="date"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value);
                setPage(1);
              }}
            />
            <Input
              type="date"
              value={toDate}
              onChange={(event) => {
                setToDate(event.target.value);
                setPage(1);
              }}
            />
          </div>

          {claimsQuery.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-32" />
              ))}
            </div>
          ) : claims.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No claims found"
              description="Adjust filters or use Add claim to get started."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[1280px] table-fixed border-collapse bg-white text-sm">
                <colgroup>
                  <col className="w-[160px]" />
                  <col className="w-[130px]" />
                  <col className="w-[95px]" />
                  <col className="w-[100px]" />
                  <col className="w-[160px]" />
                  <col className="w-[210px]" />
                  <col className="w-[145px]" />
                  <col className="w-[110px]" />
                  <col className="w-[270px]" />
                </colgroup>
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Claim</th>
                    <th className="px-4 py-3 font-semibold">Employee</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Revert message</th>
                    <th className="px-4 py-3 font-semibold">Pending with</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {claims.map((claim, index) => (
                      <motion.tr
                        key={claim.id}
                        className="border-t align-top transition hover:bg-cyan-50/40"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18, delay: index * 0.025 }}
                      >
                        <td className="px-4 py-4">
                          <p className="whitespace-nowrap font-semibold text-slate-950">
                            {claim.claimNumber}
                          </p>
                          <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                            {claim.description}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          {claim.employee?.name ?? claim.employeeId}
                        </td>
                        <td className="px-4 py-4 font-semibold">
                          {claim.currency} {Number(claim.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-4">{claim.category}</td>
                        <td className="px-4 py-4">
                          <div className="max-w-full">
                            <StatusBadge status={claim.status} />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {getLatestRevertMessage(claim) ? (
                            <RevertMessage
                              message={getLatestRevertMessage(claim) ?? ""}
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              -
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {claim.pendingWith?.name ??
                            claim.pendingWithId ??
                            "None"}
                        </td>
                        <td className="px-4 py-4">
                          {new Date(claim.expenseDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4">
                          <div className="grid justify-items-end gap-2">
                            <div className="flex justify-end gap-2">
                              <ActionWarning message={getEditWarning(claim)}>
                                <Button
                                  size="icon-sm"
                                  variant="outline"
                                  aria-label="Edit claim"
                                  disabled={!canEditClaim(claim)}
                                  onClick={() => openEditForm(claim)}
                                >
                                  <Pencil />
                                </Button>
                              </ActionWarning>
                              <ActionWarning message={getDeleteWarning(claim)}>
                                <Button
                                  size="icon-sm"
                                  variant="destructive"
                                  aria-label="Delete claim"
                                  disabled={
                                    !canDeleteClaim(claim) ||
                                    deleteClaim.isPending
                                  }
                                  onClick={() => setClaimToDelete(claim)}
                                >
                                  <Trash2 />
                                </Button>
                              </ActionWarning>
                            </div>
                            <ClaimActions claim={claim} />
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4 text-sm">
            <span className="text-muted-foreground">
              Page {meta?.page ?? page} of {meta?.totalPages ?? 1}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || claimsQuery.isFetching}
                onClick={() => setPage((value) => Math.max(value - 1, 1))}
              >
                <ChevronLeft />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  claimsQuery.isFetching ||
                  Boolean(meta && page >= meta.totalPages)
                }
                onClick={() => setPage((value) => value + 1)}
              >
                Next
                <ChevronRight />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
