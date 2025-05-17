import React, { useState, useRef, useEffect } from "react";
import CustomJalaliDatePicker from "./CustomJalaliDatePicker";
import { parse } from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale/fa-IR";

const persianNumbers = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
const toPersianNumber = (n: number | string) => String(n).replace(/\d/g, d => persianNumbers[+d]);

interface CustomJalaliDatePickerInputProps {
  value?: string;
  onChange: (date: string) => void;
  colorTheme?: "blue" | "yellow" | "red" | "dark";
  placeholder?: string;
}

const CustomJalaliDatePickerInput: React.FC<CustomJalaliDatePickerInputProps> = ({ value, onChange, colorTheme = "blue", placeholder = "انتخاب تاریخ" }) => {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Format the input value as Jalali
  const getDisplayValue = () => {
    if (!value) return "";
    console.log('Display value:', value);
    return toPersianNumber(value);
  };

  const jalaliStringToDate = (str: string) => {
    if (!str) return undefined;
    const parsed = parse(str, "yyyy/MM/dd", new Date(), { locale: faIR });
    console.log('Parsed date:', parsed);
    return parsed;
  };

  // Close popup on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative w-full" dir="rtl">
      <input
        ref={inputRef}
        type="text"
        readOnly
        value={getDisplayValue()}
        onClick={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full pr-4 pl-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition cursor-pointer text-right"
        aria-label={placeholder}
      />
      {open && (
        <div ref={popupRef} className="absolute z-50 mt-2 right-0 w-max min-w-[320px] shadow-lg rounded-xl">
          <CustomJalaliDatePicker
            value={value ? jalaliStringToDate(value) : undefined}
            onChange={(dateStr) => {
              console.log('Received date string:', dateStr);
              onChange(dateStr);
              setOpen(false);
            }}
            colorTheme={colorTheme}
          />
        </div>
      )}
    </div>
  );
};

export default CustomJalaliDatePickerInput; 