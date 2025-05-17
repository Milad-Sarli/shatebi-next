"use client"
import React, { useState, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale/fa-IR";

const persianNumbers = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
const toPersianNumber = (n: number | string) => String(n).replace(/\d/g, d => persianNumbers[+d]);

const weekDays = ["ش","ی","د","س","چ","پ","ج"];

const colorThemes: Record<string, { header: string; selected: string; range: string; today: string; }> = {
  blue: {
    header: "bg-blue-600 text-white",
    selected: "bg-cyan-400 text-white",
    range: "bg-cyan-100 text-cyan-700",
    today: "border-2 border-blue-500",
  },
  yellow: {
    header: "bg-yellow-400 text-yellow-900",
    selected: "bg-yellow-500 text-white",
    range: "bg-yellow-100 text-yellow-700",
    today: "border-2 border-yellow-500",
  },
  red: {
    header: "bg-red-500 text-white",
    selected: "bg-red-400 text-white",
    range: "bg-red-100 text-red-700",
    today: "border-2 border-red-500",
  },
  dark: {
    header: "bg-zinc-900 text-white",
    selected: "bg-cyan-400 text-white",
    range: "bg-zinc-800 text-cyan-200",
    today: "border-2 border-cyan-400",
  },
};

interface CustomJalaliDatePickerProps {
  value?: Date;
  onChange: (date: string) => void;
  colorTheme?: keyof typeof colorThemes;
}

const CustomJalaliDatePicker: React.FC<CustomJalaliDatePickerProps> = ({ value, onChange, colorTheme = "blue" }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(value || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);
  const theme = colorThemes[colorTheme];

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setCurrentMonth(value);
    }
  }, [value]);

  const renderHeader = () => (
    <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl ${theme.header}`}> 
      <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-2xl font-bold px-2 hover:scale-110 transition">&#60;</button>
      <div className="flex flex-col items-center">
        <span className="font-bold text-lg">{toPersianNumber(format(currentMonth, "yyyy MMMM", { locale: faIR }))}</span>
      </div>
      <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-2xl font-bold px-2 hover:scale-110 transition">&#62;</button>
    </div>
  );

  const renderDays = () => (
    <div className="grid grid-cols-7 gap-1 px-2 py-1">
      {weekDays.map((d, i) => (
        <div key={i} className="text-center font-bold text-zinc-400 select-none">{d}</div>
      ))}
    </div>
  );

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 6 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 6 });
    const today = new Date();
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d", { locale: faIR });
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isToday = isSameDay(day, today);
        days.push(
          <div
            className={`text-center cursor-pointer rounded-full w-10 h-10 flex items-center justify-center mx-auto my-1 transition-all
              ${isSelected ? theme.selected + " font-extrabold scale-110 shadow-lg" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}
              ${isToday && !isSelected ? theme.today : ""}
              ${!isSameMonth(day, monthStart) ? "opacity-30" : ""}
              hover:scale-110 hover:shadow-xl`}
            key={day.toString()}
            onClick={() => {
              onChange(format(day, "yyyy/MM/dd", { locale: faIR }));
              setSelectedDate(day);
            }}
          >
            {toPersianNumber(formattedDate)}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="rounded-xl shadow-2xl overflow-hidden w-[320px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700" dir="rtl">
      {renderHeader()}
      {renderDays()}
      <div className="pb-3 px-2">{renderCells()}</div>
    </div>
  );
};

export default CustomJalaliDatePicker;