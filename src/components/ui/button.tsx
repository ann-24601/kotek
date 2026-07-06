import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-hand font-semibold rounded-[10px] transition disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none",
  {
    variants: {
      variant: {
        // primary — czarny, równy kształt, subtelny cień (wg Figmy)
        primary:
          "bg-ink text-paper shadow-[0_3px_12px_rgba(27,26,26,0.16)] active:translate-y-[1px] active:shadow-[0_1px_6px_rgba(27,26,26,0.16)]",
        // secondary — białe z przerywaną ramką 1.5
        secondary:
          "bg-paper text-ink border-[1.5px] border-dashed border-ink active:translate-y-[1px]",
        ghost:
          "border-2 border-transparent bg-transparent text-ink hover:opacity-70 active:translate-y-[1px]",
        danger: "bg-paper text-ink border-[1.5px] border-solid border-ink active:translate-y-[1px]",
      },
      size: {
        default: "min-h-[44px] px-[18px] py-[10px] text-base",
        lg: "min-h-[52px] px-[22px] py-[14px] text-[1.1875rem] rounded-[12px]",
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
