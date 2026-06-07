import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-[7px] font-mono font-medium text-sm leading-tight border border-[#c9c9c4] rounded-[var(--r-chip)] text-ink bg-paper transition-transform active:scale-95 focus-visible:outline-none",
  {
    variants: {
      tone: { default: "", danger: "" },
      selected: { true: "", false: "" },
    },
    compoundVariants: [
      { tone: "default", selected: true, class: "bg-ink text-paper border-ink" },
      { tone: "danger", selected: true, class: "bg-danger border-danger text-paper" },
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
