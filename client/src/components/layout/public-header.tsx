import Link from "next/link";
import { BarChart3, LogIn, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-950 via-indigo-900 to-cyan-700 text-white shadow-sm">
            <BarChart3 className="size-5" />
          </span>
          <span className="bg-gradient-to-r from-slate-950 via-indigo-700 to-cyan-600 bg-clip-text text-lg font-bold text-transparent">
            ExpenseFlow
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" className="text-cyan-700 hover:text-indigo-700">
            <Link href="/login">
              <LogIn />
              Login
            </Link>
          </Button>
          <Button asChild>
            <Link href="/signup">
              <UserPlus />
              Signup
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
