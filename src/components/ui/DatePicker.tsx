/* eslint-disable */
"use client"

import * as React from "react"
import DateObject from "react-date-object"
import Calendar from "react-multi-date-picker"
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"
import "react-multi-date-picker/styles/backgrounds/bg-dark.css"

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

export default function DatePicker({ onChange }: { onChange: (date: Date) => void }) {
  const [date, setDate] = React.useState<DateObject | null>(null)
  const [open, setOpen] = React.useState(false)

  // Custom render function that only renders the calendar and not the input
  const renderCalendar = () => {
    return (
      <Calendar
        value={date}
        onChange={(d: unknown) => {
          setDate(d as DateObject)
          setOpen(false)
          onChange(d as Date)
        }}
        placeholder="انتخاب تاریخ"
        calendar={persian}
        locale={persian_fa}
      />
    )
  }

  return (
    <>
      <style>{calendarStyles}</style>
          <div className="rounded-md w-full mx-auto">
              {/* Use directly the Calendar component */}
              {renderCalendar()}
          </div>
    </>
  )
}
