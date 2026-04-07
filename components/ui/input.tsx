import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/components/ui/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(247,249,253,0.82))] px-4 py-3 text-[var(--ds-color-text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition-[border-color,box-shadow,background-color] duration-200 [transition-timing-function:var(--ds-ease-soft)] focus:border-blue-500/60 focus:[box-shadow:var(--ds-shadow-focus),inset_0_1px_0_rgba(255,255,255,0.8)]",
        className
      )}
      {...props}
    />
  );
});
