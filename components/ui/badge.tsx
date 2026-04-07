import type { HTMLAttributes } from "react";
import { cn } from "@/components/ui/cn";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "border-slate-300/70 bg-slate-100 text-slate-800",
  success: "border-emerald-300/80 bg-emerald-50 text-emerald-900",
  warning: "border-amber-300/80 bg-amber-50 text-amber-900",
  danger: "border-rose-300/80 bg-rose-50 text-rose-900",
  info: "border-blue-300/80 bg-blue-50 text-blue-900"
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--ds-radius-sm)] border px-3 py-1.5 text-xs font-semibold",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
