"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { readStoredAuth } from "@/lib/auth-storage";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const storedAuth = readStoredAuth();

    if (storedAuth?.accessToken) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fbfdff_0%,#eef6ff_42%,#f7f0ff_100%)]">
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
