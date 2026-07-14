"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Users,
  X,
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

import { RoleBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import {
  api,
  API_URL,
  AUTH_EXPIRED_EVENT,
  AUTH_REFRESHED_EVENT,
  ensureFreshSession,
} from "@/lib/api";
import { clearStoredAuth, readStoredAuth } from "@/lib/auth-storage";
import { cn } from "@/lib/utils";
import { logout, setCredentials, setHydrated } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { ApiResponse, AuthResponse, ClaimStatusNotification } from "@/types/domain";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/claims", label: "Claims", icon: ClipboardList },
  { href: "/users", label: "Users", icon: Users, adminOnly: true },
];

export function ProtectedShell({ children }: { children: ReactNode }) {
  const auth = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    ClaimStatusNotification[]
  >([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const storedAuth = readStoredAuth();

    if (storedAuth) {
      dispatch(setCredentials(storedAuth));
    } else {
      dispatch(setHydrated());
      router.replace("/login");
    }
  }, [dispatch, router]);

  useEffect(() => {
    const handleAuthExpired = () => {
      queryClient.clear();
      dispatch(logout());
      router.replace("/login");
    };

    const handleAuthRefreshed = (event: Event) => {
      const authEvent = event as CustomEvent<AuthResponse>;
      dispatch(setCredentials(authEvent.detail));
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    window.addEventListener(AUTH_REFRESHED_EVENT, handleAuthRefreshed);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
      window.removeEventListener(AUTH_REFRESHED_EVENT, handleAuthRefreshed);
    };
  }, [dispatch, queryClient, router]);

  const logoutMutation = useMutation({
    mutationFn: async () => api.post("/api/auth/logout"),
    onSettled: () => {
      clearStoredAuth();
      queryClient.clear();
      dispatch(logout());
      router.replace("/login");
    },
  });

  const requestLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = () => logoutMutation.mutate();

  useEffect(() => {
    if (!auth.accessToken || !auth.user) {
      return;
    }

    api
      .get<ApiResponse<ClaimStatusNotification[]>>("/api/notifications")
      .then((response) => setNotifications(response.data.data))
      .catch(() => setNotifications([]));
  }, [auth.accessToken, auth.user]);

  useEffect(() => {
    if (!auth.accessToken || !auth.user) {
      return;
    }

    const stream = new EventSource(
      `${API_URL}/api/notifications/stream?token=${encodeURIComponent(
        auth.accessToken
      )}`
    );

    stream.addEventListener("claim-status", (event) => {
      const notification = JSON.parse(
        event.data
      ) as ClaimStatusNotification;
      const ownClaim = notification.employeeId === auth.user?.id;
      const title = ownClaim
        ? "Your claim status changed"
        : "Claim status changed";

      setNotifications((current) => [notification, ...current].slice(0, 10));
      setUnreadNotifications((count) => count + 1);
      toast.info(title, {
        description: notification.message,
      });

      queryClient.invalidateQueries({ queryKey: ["claims"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });

    stream.onerror = async () => {
      stream.close();
      await ensureFreshSession();
    };

    return () => stream.close();
  }, [auth.accessToken, auth.user, queryClient]);

  const openNotifications = () => {
    setIsNotificationsOpen((open) => !open);
    setUnreadNotifications(0);
  };

  if (!auth.hydrated || !auth.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-9 animate-spin rounded-full border-2 border-muted border-t-cyan-600" />
      </div>
    );
  }

  const visibleNav = navItems.filter(
    (item) => !item.adminOnly || auth.user?.role === "ADMIN"
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <AnimatePresence>
        {showLogoutConfirm ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-title"
              className="w-full max-w-sm rounded-lg border bg-white p-5 shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="logout-title"
                    className="bg-gradient-to-r from-slate-950 via-indigo-700 to-cyan-600 bg-clip-text text-lg font-bold text-transparent"
                  >
                    Logout?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Your current session will end and you will return to login.
                  </p>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Close logout confirmation"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  <X />
                </Button>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut />
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r bg-white lg:block">
        <div className="flex h-full flex-col">
          <motion.div
            className="border-b px-5 py-5"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22 }}
          >
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-950 via-indigo-900 to-cyan-700 text-white">
                <BarChart3 className="size-5" />
              </div>
              <div>
                <p className="bg-gradient-to-r from-slate-950 via-indigo-700 to-cyan-600 bg-clip-text font-bold text-transparent">
                  ExpenseFlow
                </p>
                <p className="text-xs text-muted-foreground">Approval console</p>
              </div>
            </Link>
          </motion.div>

          <nav className="grid gap-1 p-3">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <motion.div
                  key={item.href}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                      active &&
                        "bg-gradient-to-r from-slate-950 via-indigo-900 to-cyan-700 text-white shadow-sm hover:text-white"
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <div className="mt-auto border-t p-4">
            <div className="mb-3">
              <p className="truncate text-sm font-semibold">{auth.user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {auth.user.email}
              </p>
              <div className="mt-2">
                <RoleBadge role={auth.user.role} />
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={requestLogout}
            >
              <LogOut />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-10 border-b bg-white/90 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="bg-gradient-to-r from-slate-950 via-indigo-700 to-cyan-600 bg-clip-text text-lg font-bold text-transparent lg:hidden">
                ExpenseFlow
              </p>
              <p className="text-sm font-medium text-slate-700">
                {auth.user.role.replaceAll("_", " ")} workspace
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Notifications"
                  onClick={openNotifications}
                >
                  <Bell />
                </Button>
                {unreadNotifications > 0 ? (
                  <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-cyan-600 px-1 text-[10px] font-bold leading-5 text-white">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                ) : null}
                {isNotificationsOpen ? (
                  <div className="absolute right-0 top-11 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-lg border bg-white p-3 text-left shadow-xl">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">Notifications</p>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Close notifications"
                        onClick={() => setIsNotificationsOpen(false)}
                      >
                        <X />
                      </Button>
                    </div>
                    {notifications.length ? (
                      <div className="grid max-h-80 gap-2 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="rounded-md border bg-slate-50 p-3"
                          >
                            <p className="text-sm font-medium text-slate-950">
                              {notification.claimNumber}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {notification.message}
                            </p>
                            <p className="mt-2 text-[11px] font-medium text-slate-500">
                              {new Date(
                                notification.createdAt
                              ).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                        No notifications yet.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
              <Button
                size="icon"
                variant="outline"
                aria-label="Logout"
                onClick={requestLogout}
              >
                <LogOut />
              </Button>
            </div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {visibleNav.map((item) => (
              <Button
                key={item.href}
                asChild
                size="sm"
                variant={pathname === item.href ? "default" : "outline"}
              >
                <Link href={item.href}>
                  <item.icon />
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          {children}
        </div>

        <footer className="border-t bg-white px-4 py-4 text-sm text-muted-foreground sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="bg-gradient-to-r from-slate-950 via-indigo-700 to-cyan-600 bg-clip-text font-semibold text-transparent">
              ExpenseFlow
            </p>
            <p>Claims, approvals, users, and reporting.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
