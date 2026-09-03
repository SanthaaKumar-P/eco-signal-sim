import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-mono text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default: "border border-line bg-ink2/70 text-muted-foreground hover:bg-frost hover:text-foreground",
        primary: "border border-green/40 bg-green/15 text-green hover:bg-green/25",
        active: "border border-mint/40 bg-mint/10 text-mint hover:bg-mint/20",
        info: "border border-cyan/40 bg-cyan/10 text-cyan hover:bg-cyan/20",
        warning: "border border-amber/40 bg-amber/10 text-amber hover:bg-amber/20",
        ghost: "border border-transparent text-muted-foreground hover:bg-ink2/70 hover:text-foreground",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-9 px-3.5",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "sm" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  ),
);

Button.displayName = "Button";
