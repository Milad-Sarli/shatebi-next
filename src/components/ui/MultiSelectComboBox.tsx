import React, { useState, useRef, useEffect } from "react";
import { X, Search } from "lucide-react";

interface Option {
  label: string;
  value: string | number;
}

interface MultiSelectComboBoxProps {
  options: Option[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export const MultiSelectComboBox: React.FC<MultiSelectComboBoxProps> = ({
  options,
  value,
  onChange,
  placeholder = "انتخاب کنید...",
  label,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\u0600-\u06FF]/g, (c) => c)
      .replace(/\s+/g, " ");
  };

  const filteredOptions = options.filter(
    (opt) =>
      normalizeText(opt.label).includes(normalizeText(inputValue)) &&
      !value.includes(opt.value)
  );

  const handleSelect = (val: string | number) => {
    onChange([...value, val]);
    setInputValue("");
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleRemove = (val: string | number) => {
    onChange(value.filter((v) => v !== val));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredOptions.length > 0) {
      handleSelect(filteredOptions[0].value);
    }
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="w-full relative" ref={ref} dir="rtl">
      {label && (
        <label className="block mb-1 text-sm font-medium text-right">
          {label}
        </label>
      )}
      <div
        className={`flex flex-wrap items-center gap-1 border rounded-md px-3 py-2 bg-white dark:bg-zinc-900 focus-within:ring-2 focus-within:ring-primary transition-all min-h-[44px] relative ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
        onClick={() => !disabled && setIsOpen(true)}
        style={{ direction: "rtl" }}
      >
        <Search className="w-4 h-4 text-zinc-400 absolute right-3" />
        {value.length > 0 &&
          value.map((val, index) => {
            const opt = options.find((o) => o.value === val);
            if (!opt) return null;
            return (
              <span
                key={`${val}-${index}`}
                className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1 text-xs text-zinc-700 dark:text-zinc-200 ml-1 mb-1"
                style={{ direction: "rtl" }}
              >
                {opt.label}
                <button
                  type="button"
                  className="mr-1 text-zinc-400 hover:text-red-500 focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(val);
                  }}
                  tabIndex={-1}
                  aria-label="حذف"
                >
                  <X size={14} />
                </button>
              </span>
            );
          })}
        <input
          ref={inputRef}
          className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm py-1 pr-8 pl-2 text-right"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : "جستجو کنید..."}
          disabled={disabled}
          style={{ direction: "rtl" }}
        />
      </div>
      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-900 border rounded-md shadow-lg max-h-56 overflow-auto left-0 right-0"
          style={{ direction: "rtl" }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                className="px-4 py-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm transition-colors text-right"
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 text-center">
              نتیجه‌ای یافت نشد
            </div>
          )}
        </div>
      )}
    </div>
  );
};
