"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/components/ui/cn";

type TabsProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  className?: string;
};

export function Tabs<T extends string>({ value, onChange, options, className }: TabsProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex rounded-[var(--ds-radius-pill)] border border-[var(--ds-color-border-soft)] bg-white/80 p-1 transition-[box-shadow,border-color] duration-200 [transition-timing-function:var(--ds-ease-soft)]",
        className
      )}
    >
      {options.map((option) => (
        <TabsTrigger
          key={option.value}
          active={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </TabsTrigger>
      ))}
    </div>
  );
}

type TabsTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

function TabsTrigger({ className, active = false, ...props }: TabsTriggerProps) {
  return (
    <button
      className={cn(
        "rounded-[var(--ds-radius-pill)] px-4 py-1.5 text-sm font-semibold transition-[background-color,color,transform] duration-200 [transition-timing-function:var(--ds-ease-smooth)]",
        active
          ? "bg-[var(--ds-color-brand-secondary)] text-[var(--ds-color-text-inverse)]"
          : "text-slate-500 hover:text-slate-700",
        className
      )}
      type="button"
      {...props}
    />
  );
}
