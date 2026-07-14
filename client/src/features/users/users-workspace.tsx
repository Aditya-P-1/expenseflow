"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, UserPlus, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { RoleBadge } from "@/components/common/status-badge";
import { SectionHeading } from "@/components/common/section-heading";
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
import { ApiResponse, PaginatedResponse, Role, User, roles } from "@/types/domain";
import { UserForm } from "./user-form";

export function UsersWorkspace() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<Role | "">("");
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const filters = useDebounce({ role, search }, 350);
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["users", page, filters],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaginatedResponse<User>>>(
        "/api/users",
        {
          params: {
            page,
            limit: 8,
            role: filters.role || undefined,
            search: filters.search || undefined,
          },
        }
      );

      return response.data.data;
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => {
      const response = await api.patch<ApiResponse<User>>(`/api/users/${id}`, {
        isActive,
      });

      return response.data.data;
    },
    onSuccess: () => {
      toast.success("User updated");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const users = usersQuery.data?.items ?? [];
  const meta = usersQuery.data?.meta;

  return (
    <div className="grid gap-6">
      <SectionHeading
        title="Users"
        description="Review users, roles, and reporting relationships."
        action={
          <Button className="w-fit" onClick={() => setIsCreateOpen(true)}>
            <UserPlus />
            Add user
          </Button>
        }
      />

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto">
            <div className="mb-3 flex justify-end">
              <Button
                size="icon"
                variant="outline"
                aria-label="Close user form"
                onClick={() => setIsCreateOpen(false)}
              >
                <X />
              </Button>
            </div>
            <UserForm onSuccess={() => setIsCreateOpen(false)} />
          </div>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>User directory</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search name or email"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={role}
              onChange={(event) => {
                setRole(event.target.value as Role | "");
                setPage(1);
              }}
            >
              <option value="">All roles</option>
              {roles.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>

          {usersQuery.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users found"
              description="Create a user or adjust the search filters."
            />
          ) : (
            <div className="grid gap-3">
              {users.map((user) => (
                <article
                  key={user.id}
                  className="flex flex-col gap-3 rounded-lg border bg-white p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{user.name}</h3>
                      <RoleBadge role={user.role} />
                      <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Reports to: {user.reportsTo?.name ?? user.reportsToId ?? "None"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateUser.isPending}
                    onClick={() =>
                      updateUser.mutate({
                        id: user.id,
                        isActive: !user.isActive,
                      })
                    }
                  >
                    {user.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </article>
              ))}
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
                disabled={page <= 1 || usersQuery.isFetching}
                onClick={() => setPage((value) => Math.max(value - 1, 1))}
              >
                <ChevronLeft />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  usersQuery.isFetching || Boolean(meta && page >= meta.totalPages)
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
