import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "ink-edge ink-edge--chip [--edge:#c9c9c4] inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-[7px] font-mono font-medium text-sm leading-tight rounded-[var(--r-chip)] text-ink bg-paper transition-transform active:scale-95 focus-visible:outline-none",
  {
    variants: {
      tone: { default: "", danger: "" },
      selected: { true: "", false: "" },
    },
    compoundVariants: [
      { tone: "default", selected: true, class: "bg-ink text-paper [--edge:var(--ink)]" },
      { tone: "danger", selected: true, class: "bg-danger text-paper [--edge:var(--danger)]" },
    ],
    defaultVariants: { tone: "default", selected: false },
  },
);

export interface ToggleChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {
  selected?: boolean;
}

export function ToggleChip({
  className,
  tone,
  selected = false,
  children,
  ...props
}: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(chipVariants({ tone, selected }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
