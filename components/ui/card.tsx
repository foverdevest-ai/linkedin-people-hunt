import type { HTMLAttributes } from "react";
import { cn } from "@/components/ui/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
};

export function Card({ className, padded = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border-glass)] bg-[linear-gradient(130deg,rgba(255,255,255,0.72),rgba(255,255,255,0.42))] shadow-[var(--ds-shadow-glass)] backdrop-blur-xl transition-[transform,box-shadow,border-color] duration-300 [transition-timing-function:var(--ds-ease-smooth)] hover:shadow-[0_24px_68px_rgba(25,43,74,0.18)]",
        padded && "p-5 md:p-6",
        className
      )}
      {...props}
    />
  );
}
