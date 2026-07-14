"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileWarning,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { SectionHeading } from "@/components/common/section-heading";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import { ApiResponse } from "@/types/domain";

type GroupedMetric = {
  status?: string;
  role?: string;
  _count: { _all: number };
  _sum?: { amount?: string | null };
};

type AdminDashboard = {
  summary?: {
    totals?: {
      _count?: { _all?: number };
    };
  };
  users?: GroupedMetric[];
  claims?: GroupedMetric[];
};

export function DashboardView() {
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();
  const endpoint =
    user?.role === "ADMIN"
      ? "/api/dashboard/admin"
      : user?.role === "EMPLOYEE"
      ? "/api/dashboard/employee"
      : "/api/dashboard/manager";

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", user?.role],
    enabled: Boolean(user),
    queryFn: async () => {
      const response = await api.get<ApiResponse<unknown>>(endpoint);
      return response.data.data;
    },
  });

  const adminData = dashboardQuery.data as AdminDashboard | undefined;
  const groups: GroupedMetric[] = Array.isArray(dashboardQuery.data)
    ? dashboardQuery.data
    : user?.role === "ADMIN"
    ? adminData?.claims ?? []
    : [];

  const activeUserCount = (adminData?.users ?? []).reduce(
    (sum, item) => sum + (item._count?._all ?? 0),
    0
  );
  const totalClaimCount =
    adminData?.summary?.totals?._count?._all ??
    groups.reduce((sum, item) => sum + (item._count?._all ?? 0), 0);
  const totalItems = groups.reduce(
    (sum, item) => sum + (item._count?._all ?? 0),
    0
  );

  const claimStatusCards = [
      {
        label: "Approved",
        value:
          groups.find((item) => item.status === "APPROVED")?._count._all ?? 0,
        icon: CheckCircle2,
        href: "/claims",
      },
      {
        label: "Pending",
        value: groups
          .filter((item) => item.status?.startsWith("PENDING"))
          .reduce((sum, item) => sum + item._count._all, 0),
        icon: Clock,
        href: "/claims",
      },
      {
        label: "Needs action",
        value: groups
          .filter((item) => item.status?.startsWith("REVERTED"))
          .reduce((sum, item) => sum + item._count._all, 0),
        icon: FileWarning,
        href: "/claims",
      },
    ];
  const cards =
    user?.role === "ADMIN"
      ? [
          {
            label: "Users",
            value: activeUserCount,
            icon: Users,
            href: "/users",
          },
          {
            label: "Claims",
            value: totalClaimCount,
            icon: ClipboardList,
            href: "/claims",
          },
          ...claimStatusCards.slice(0, 2),
        ]
      : [
          {
            label: "Total claims",
            value: totalItems,
            icon: Activity,
            href: "/claims",
          },
          ...claimStatusCards,
        ];

  return (
    <div className="grid gap-6">
      <SectionHeading
        title={`${user?.role.replaceAll("_", " ")} dashboard`}
        description="A quick summary of the workflow state for your role."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardQuery.isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32" />
            ))
          : cards.map((card, index) => (
              <motion.div
                key={card.label}
                role="button"
                tabIndex={0}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: index * 0.05 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(card.href)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(card.href);
                  }
                }}
              >
              <Card className="cursor-pointer rounded-lg border-white bg-white shadow-md transition-shadow hover:shadow-xl">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="mt-2 bg-gradient-to-r from-slate-950 via-indigo-700 to-cyan-600 bg-clip-text text-3xl font-semibold text-transparent">
                      {card.value}
                    </p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-cyan-100">
                    <card.icon className="size-5 text-cyan-800" />
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.12 }}
      >
      <Card className="rounded-lg border-white bg-white shadow-md">
        <CardHeader>
          <CardTitle>Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardQuery.isLoading ? (
            <div className="grid gap-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No dashboard data available yet.
            </p>
          ) : (
            <div className="grid gap-2">
              {(user?.role === "ADMIN" ? adminData?.users ?? [] : groups).map((item) => (
                <div
                  key={item.status ?? item.role}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="font-medium">
                    {(item.status ?? item.role)?.replaceAll("_", " ")}
                  </span>
                  <span className="text-muted-foreground">
                    {item._count._all}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
