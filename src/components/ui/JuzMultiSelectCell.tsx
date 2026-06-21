"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface JuzMultiSelectCellProps {
  value: number[];
  onChange: (next: number[]) => void;
  max?: number;
}

export const JuzMultiSelectCell: React.FC<JuzMultiSelectCellProps> = ({
  value,
  onChange,
  max = 30,
}) => {
  const [open, setOpen] = React.useState(false);
  const sorted = React.useMemo(
    () => [...value].sort((a, b) => a - b),
    [value]
  );

  const toggle = (n: number) => {
    if (value.includes(n)) {
      onChange(value.filter((v) => v !== n));
    } else {
      onChange([...value, n]);
    }
  };

  const hasValue = sorted.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full h-9 px-2 rounded-md border text-xs flex items-center justify-center gap-1 text-center transition-colors",
            "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
            hasValue
              ? "border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300"
              : "border-zinc-200 dark:border-zinc-700 text-zinc-400"
          )}
        >
          {hasValue ? (
            <span className="flex flex-wrap items-center justify-center gap-1 leading-none">
              {sorted.map((n) => (
                <span
                  key={n}
                  className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-[11px] font-semibold"
                >
                  {n}
                </span>
              ))}
            </span>
          ) : (
            <span className="text-zinc-400">-</span>
          )}
          <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={4}
        className="w-64 p-2 max-h-72 overflow-auto"
      >
        <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-2 px-1 text-right">
          انتخاب جزء (ها)
        </div>
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
            const checked = value.includes(n);
            return (
              <label
                key={n}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer text-xs transition-colors",
                  "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                  checked && "bg-emerald-50 dark:bg-emerald-900/30"
                )}
                dir="rtl"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(n)}
                  className="h-3.5 w-3.5"
                />
                <span className="text-zinc-700 dark:text-zinc-200 flex-1 text-right">
                  جزء {n}
                </span>
                {checked && (
                  <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                )}
              </label>
            );
          })}
        </div>
        {hasValue && (
          <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">
              {sorted.length} جزء انتخاب شده
            </span>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[11px] text-red-600 dark:text-red-400 hover:underline"
            >
              پاک کردن
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
