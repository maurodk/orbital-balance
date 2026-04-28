import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-orbital-gold/20 text-orbital-gold border border-orbital-gold/30",
        secondary: "bg-orbital-surface text-orbital-muted border border-orbital-gold/10",
        destructive: "bg-destructive/20 text-destructive border border-destructive/30",
        success: "bg-success/20 text-success border border-success/30",
        outline: "border border-orbital-gold/30 text-orbital-gold",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
