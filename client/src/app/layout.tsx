import type { Metadata } from "next";

import { AppProviders } from "@/app/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExpenseFlow",
  description: "Expense workspace for teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
