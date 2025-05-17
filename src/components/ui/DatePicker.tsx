"use client"

import * as React from "react"
import DatePicker, { DateObject } from "react-multi-date-picker"
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"
import "react-multi-date-picker/styles/backgrounds/bg-dark.css"
import { Calendar as CalendarIcon } from "lucide-react"

// Add custom styles to make the calendar more visible in dark mode
const calendarStyles = `
  .rmdp-wrapper {
    background-color: #333 !important;
    color: white !important;
  }
  .rmdp-input {
    background-color: rgb(39 39 42) !important;
    color: white !important;
    width: 100% !important;
    min-width: 0 !important;
    border: 1px solid rgb(39 39 42) !important;
    padding: .99rem 0.75rem !important;
  }
  @media (min-width: 640px) {
    .rmdp-input {
      min-width: 400px !important;
    }
  }
  .rmdp-day {
    color: white !important;
  }
  .rmdp-day.rmdp-selected span {
    background-color: #6366f1 !important;
  }
  .rmdp-week-day {
    color: #aaa !important;
  }
  .rmdp-header-values {
    color: white !important;
  }
  .rmdp-arrow {
    border-color: white !important;
  }
  /* Month/year dropdown fix */
  .rmdp-month-picker, .rmdp-year-picker {
    max-height: 220px !important;
    overflow-y: auto !important;
    background: #333 !important;
    color: #fff !important;
    border-radius: 0.5rem !important;
    box-shadow: 0 4px 24px 0 rgba(0,0,0,0.15);
  }
  .rmdp-month-picker span, .rmdp-year-picker span {
    color: #fff !important;
  }
  .rmdp-month-picker span.rmdp-selected, .rmdp-year-picker span.rmdp-selected {
    background: #6366f1 !important;
    color: #fff !important;
  }
  /* Light mode support */
  :root:not(.dark) .rmdp-wrapper {
    background-color: #fff !important;
    color: #222 !important;
  }
  :root:not(.dark) .rmdp-input {
    background-color: #fff !important;
    color: #222 !important;
    border: 1px solid #e5e7eb !important;
  }
  :root:not(.dark) .rmdp-day {
    color: #222 !important;
  }
  :root:not(.dark) .rmdp-header-values {
    color: #222 !important;
  }
  :root:not(.dark) .rmdp-arrow {
    border-color: #222 !important;
  }
  :root:not(.dark) .rmdp-month-picker, :root:not(.dark) .rmdp-year-picker {
    background: #fff !important;
    color: #222 !important;
  }
  :root:not(.dark) .rmdp-month-picker span, :root:not(.dark) .rmdp-year-picker span {
    color: #222 !important;
  }
  :root:not(.dark) .rmdp-month-picker span.rmdp-selected, :root:not(.dark) .rmdp-year-picker span.rmdp-selected {
    background: #6366f1 !important;
    color: #fff !important;
  }
  /* Improve day highlights */
  .rmdp-day.rmdp-today span {
    background-color: #555 !important;
  }
  /* Fix spacing */
  .rmdp-day span {
    font-size: 14px !important;
  }
`;

export default function CustomDatePicker({ onChange, className = "" }: { onChange: (date: DateObject) => void; className?: string }) {
  const [date, setDate] = React.useState<DateObject | null>(null)
  const [open, setOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const calendarRef = React.useRef<HTMLDivElement>(null)

  // Format date to Persian string
  const getDisplayValue = () => {
    if (!date) return ""
    return date.format("YYYY/MM/DD")
  }

  // Close calendar on outside click
  React.useEffect(() => {
    function handleClickOutside(event: PointerEvent) {
      setTimeout(() => {
        if (
          calendarRef.current &&
          !calendarRef.current.contains(event.target as Node) &&
          inputRef.current &&
          !inputRef.current.contains(event.target as Node)
        ) {
          setOpen(false);
        }
      }, 10); // Delay to allow calendar click to process
    }
    if (open) {
      document.addEventListener("pointerdown", handleClickOutside);
    } else {
      document.removeEventListener("pointerdown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [open]);

  return (
    <>
      <style>{calendarStyles}</style>
      <div className={`relative w-full ${className}`} dir="rtl">
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={getDisplayValue()}
          onClick={() => setOpen(true)}
          placeholder="انتخاب تاریخ"
          className="w-full pr-10 pl-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition cursor-pointer text-right"
          aria-label="انتخاب تاریخ"
        />
        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={20} />
        {open && (
          <div ref={calendarRef} className="absolute z-50 mt-2 right-0 w-max min-w-[260px] shadow-lg rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
            <DatePicker
              value={date}
              onChange={(d: DateObject) => {
                setDate(d)
                setOpen(false)
                if (d) {
                  onChange(d)
                }
              }}
              calendar={persian}
              locale={persian_fa}
              className="!bg-transparent"
              style={{ boxShadow: "none", background: "transparent" }}
            />
          </div>
        )}
      </div>
    </>
  )
}
