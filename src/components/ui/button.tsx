import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-hand font-semibold border-2 border-ink rounded-[var(--r-box)] transition-transform active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none",
  {
    variants: {
      variant: {
        primary:
          "bg-ink text-paper shadow-[3px_3px_0_#9a9a9a] active:shadow-[1px_1px_0_#9a9a9a]",
        secondary:
          "bg-paper text-ink shadow-[3px_3px_0_var(--ink)] active:shadow-[1px_1px_0_var(--ink)]",
        ghost: "border-transparent bg-transparent hover:border-ink active:translate-x-0 active:translate-y-0",
        danger: "bg-paper text-danger border-danger",
      },
      size: {
        default: "min-h-[44px] px-[18px] py-[10px] text-base",
        lg: "min-h-[52px] px-[22px] py-[14px] text-[1.1875rem] rounded-[var(--r-box-2)]",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  block?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), block && "flex w-full", className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
