import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "relative inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-[7px] font-mono font-medium text-sm leading-tight rounded-[13px] text-ink bg-paper transition-transform active:scale-95 focus-visible:outline-none",
  {
    variants: {
      tone: { default: "", danger: "" },
      selected: { true: "", false: "" },
    },
    compoundVariants: [
      { tone: "default", selected: true, class: "bg-ink text-paper" },
      { tone: "danger", selected: true, class: "bg-danger text-paper" },
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
  // niewybrany → czysta, jednolita obwódka; wybrany → pełny „pill" (obwódka przezroczysta, by nie skakał rozmiar)
  const borderCls = selected
    ? "border-2 border-transparent"
    : tone === "danger"
      ? "border-2 border-danger"
      : "border-2 border-[#c9c9c4]";
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(chipVariants({ tone, selected }), borderCls, className)}
      {...props}
    >
      <span className="relative">{children}</span>
    </button>
  );
}
