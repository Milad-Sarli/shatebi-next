"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  onFileChange: (file: File | null) => void;
}

export function FileInput({ label, onFileChange, id, ...props }: FileInputProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onFileChange(file);
  };

  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      {label && <Label htmlFor={id}>{label}</Label>}
      <Input
        id={id}
        type="file"
        onChange={handleChange}
        {...props}
        className="border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
      />
    </div>
  );
} 