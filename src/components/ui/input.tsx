import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-lg border border-input bg-orbital-deep px-3 py-2 text-sm text-orbital-white",
          "placeholder:text-orbital-muted",
          "focus-visible:outline-none focus-visible:border-orbital-gold focus-visible:ring-2 focus-visible:ring-orbital-gold/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors duration-150",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-orbital-white",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
