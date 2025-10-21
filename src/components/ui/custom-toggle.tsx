"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CustomToggleProps extends React.HTMLAttributes<HTMLDivElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

const CustomToggle = React.forwardRef<HTMLDivElement, CustomToggleProps>(
  ({ checked, onCheckedChange, disabled = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors",
          checked ? "bg-green-500" : "bg-zinc-200 dark:bg-zinc-700",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        onClick={() => !disabled && onCheckedChange(!checked)}
        {...props}
      >
        <span
          className={cn(
            "absolute h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-6 rtl:-translate-x-6" : "translate-x-1 rtl:-translate-x-1"
          )}
        />
      </div>
    );
  }
);

CustomToggle.displayName = "CustomToggle";

export { CustomToggle };