import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const toneClasses = {
  default: "border-border bg-secondary text-secondary-foreground",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: keyof typeof toneClasses;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 max-w-full items-center rounded-md border px-2 py-1 text-xs font-medium leading-tight break-words",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
