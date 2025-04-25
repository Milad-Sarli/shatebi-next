"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}

export function OTPInput({
  value,
  onChange,
  maxLength = 6,
  disabled = false,
  className,
}: OTPInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, maxLength);
  }, [maxLength]);

  const handleChange = (index: number, inputValue: string) => {
    // Only allow numeric input
    if (!/^\d*$/.test(inputValue)) {
      return;
    }

    const newValue = value.split("");
    newValue[index] = inputValue;
    const combinedValue = newValue.join("");

    onChange(combinedValue);

    if (inputValue !== "" && index < maxLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && value[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, maxLength);
    onChange(pastedData);
  };

  const setRef = React.useCallback((index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el;
  }, []);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {Array.from({ length: maxLength }).map((_, index) => (
        <input
          key={index}
          ref={setRef(index)}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          autoComplete="off"
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-10 h-12 text-center text-lg border-2 rounded-lg focus:border-primary focus:outline-none disabled:opacity-50"
        />
      ))}
    </div>
  );
} 