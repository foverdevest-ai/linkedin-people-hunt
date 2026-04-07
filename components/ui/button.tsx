import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/components/ui/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leading?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "text-[var(--ds-color-text-inverse)] border border-white/25 bg-[linear-gradient(130deg,var(--ds-color-brand-primary),var(--ds-color-brand-primaryStrong))] shadow-[var(--ds-shadow-brand)] hover:-translate-y-px hover:brightness-[1.02]",
  secondary:
    "text-[var(--ds-color-brand-secondary)] border border-[var(--ds-color-border-strong)] bg-[var(--ds-color-surface-glassStrong)] shadow-[var(--ds-shadow-soft)] hover:bg-white/90",
  ghost: "text-[var(--ds-color-brand-link)] border border-transparent bg-transparent hover:bg-white/60"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm"
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-[var(--ds-radius-pill)] font-semibold transition-[transform,filter,box-shadow,background-color,border-color,color] duration-200 [transition-timing-function:var(--ds-ease-smooth)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 disabled:cursor-not-allowed disabled:opacity-55",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  leading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClass({ variant, size, className })}
      disabled={disabled}
      {...props}
    >
      {leading}
      {children}
    </button>
  );
}
