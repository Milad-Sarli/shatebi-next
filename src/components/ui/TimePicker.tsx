"use client";
import React, { useState, useRef } from "react";

interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
}

const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const ampm = ["ق.ظ", "ب.ظ"];

const toPersianNumber = (num: string) =>
  num.replace(/\d/g, (d) => String.fromCharCode(d.charCodeAt(0) + 1728));

function vibrate(ms = 10) {
  if (typeof window !== "undefined" && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

const TimePicker: React.FC<TimePickerProps> = ({ value = "10:00 قبل‌ازظهر", onChange, label }) => {
  // Modal state
  const [show, setShow] = useState(false);
  // Parse value (e.g. "10:00 قبل‌ازظهر")
  const [hour, setHour] = useState(() => {
    const [h] = value.split(":");
    return h.padStart(2, "0");
  });
  const [minute, setMinute] = useState(() => {
    const [, rest] = value.split(":");
    const [m] = rest ? rest.split(" ") : ["00"];
    return m.padStart(2, "0");
  });
  const [period, setPeriod] = useState(() => {
    const parts = value.split(" ");
    return parts[1] || "قبل‌ازظهر";
  });
  // For input display
  const [selected, setSelected] = useState(value);

  // Scroll to selected
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!show) return;
    // Scroll to selected only when modal opens
    const scrollTo = (ref: React.RefObject<HTMLDivElement>, idx: number) => {
      if (ref.current) {
        ref.current.scrollTo({
          top: (idx - 2) * 44,
          behavior: "smooth",
        });
      }
    };
    scrollTo(hourRef as React.RefObject<HTMLDivElement>, hours.indexOf(hour));
    scrollTo(minuteRef as React.RefObject<HTMLDivElement>, minutes.indexOf(minute));
    scrollTo(periodRef as React.RefObject<HTMLDivElement>, ampm.indexOf(period));
  }, [show, hour, minute, period]);

  // Render scrollable column with per-item highlight
  const renderColumn = (items: string[], selected: string, setSelected: (v: string) => void, ref: React.RefObject<HTMLDivElement>, persianize = false, colType: 'hour' | 'minute' | 'ampm' = 'hour') => (
    <div
      ref={ref}
      className="flex flex-col items-center overflow-y-scroll custom-scrollbar-hide h-[220px] w-20 snap-y snap-mandatory py-2 relative z-10 rtl"
      tabIndex={0}
      dir="rtl"
    >
      {items.map((item) => (
        <div
          key={item}
          className={`snap-center cursor-pointer transition-all duration-200 flex items-center justify-center h-11 w-16 mb-1 relative
            ${selected === item ? "font-extrabold text-2xl" : "font-medium text-lg text-zinc-400 opacity-60"}`}
          style={{
            fontWeight: selected === item ? 800 : 400,
            fontSize: selected === item ? 26 : 18,
            textAlign: 'center',
            letterSpacing: selected === item ? '-1px' : '0',
            zIndex: selected === item ? 2 : 1,
          }}
          onClick={() => {
            setSelected(item);
            vibrate(10);
          }}
        >
          {selected === item && (
            <span
              className="absolute inset-0 rounded-2xl bg-yellow-400/90 -z-10 flex items-center justify-center"
              style={{ boxShadow: '0 2px 12px 0 rgba(255, 193, 7, 0.15)' }}
            ></span>
          )}
          <span
            className={
              colType === 'ampm'
                ? 'px-2 py-1 whitespace-nowrap text-base'
                : ''
            }
            style={{
              color: selected === item ? '#000' : undefined,
              fontWeight: selected === item ? 800 : 400,
              fontSize: selected === item ? 24 : 18,
              position: 'relative',
              zIndex: 2,
            }}
          >
            {persianize ? toPersianNumber(item) : item}
          </span>
        </div>
      ))}
    </div>
  );

  // Persian input placeholder
  const persianPlaceholder = "--:--";

  // Persian label
  const persianLabel = label ? label : "انتخاب زمان";

  // Persian Save/Cancel
  const persianSave = "ذخیره";
  const persianCancel = "انصراف";

  // Persianize current selection for modal preview
  const persianModalValue = `${toPersianNumber(hour)}:${toPersianNumber(minute)} ${period}`;

  // Modal
  const modal = show && (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50" dir="rtl">
      <style>{`
        .custom-scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .rtl { direction: rtl; }
      `}</style>
      <div className="rounded-3xl shadow-2xl bg-zinc-900/95 px-8 pt-6 pb-8 min-w-[360px] relative animate-fadeInUp border border-yellow-400/40" style={{boxShadow: '0 12px 36px 0 rgba(0,0,0,0.30)'}}>
        <div className="flex justify-between items-center mb-4 px-1">
          <button
            className="text-yellow-400 font-bold hover:underline transition text-lg px-2 py-1 rounded-lg hover:bg-yellow-400/10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            onClick={() => { setShow(false); }}
            type="button"
          >
            {persianCancel}
          </button>
          <button
            className="text-yellow-400 font-bold hover:underline transition text-lg px-2 py-1 rounded-lg hover:bg-yellow-400/10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            onClick={() => {
              const newVal = `${hour}:${minute} ${period}`;
              setSelected(newVal);
              setShow(false);
              if (onChange) onChange(newVal);
            }}
            type="button"
          >
            {persianSave}
          </button>
        </div>
        <div className="text-center text-zinc-200 mb-2 font-extrabold text-xl tracking-tight drop-shadow">{persianLabel}</div>
        {/* Show current selection in modal */}
        <div className="mb-4 text-center text-lg font-bold text-zinc-900 dark:text-zinc-100 bg-yellow-100/80 dark:bg-yellow-400/10 rounded-xl py-2 border border-yellow-400/30 shadow-sm">
          {persianModalValue}
        </div>
        <div className="flex flex-row-reverse items-center justify-center gap-7 bg-zinc-800/90 rounded-2xl p-7 relative shadow-inner border border-yellow-400/10" dir="rtl">
          {renderColumn(hours, hour, setHour, hourRef as React.RefObject<HTMLDivElement>, true, 'hour')}
          <span className="text-yellow-400 text-3xl font-extrabold mx-1 select-none drop-shadow">:</span>
          {renderColumn(minutes, minute, setMinute, minuteRef as React.RefObject<HTMLDivElement>, true, 'minute')}
          {renderColumn(ampm, period, setPeriod, periodRef as React.RefObject<HTMLDivElement>, false, 'ampm')}
        </div>
      </div>
    </div>
  );

  // Persianize input value
  const persianInputValue = selected
    ? `${toPersianNumber(selected.split(":")[0])}:${toPersianNumber(selected.split(":")[1].split(" ")[0])} ${selected.split(" ")[1]}`
    : persianPlaceholder;

  return (
    <div className="flex flex-col gap-2 w-full max-w-xs mx-auto" dir="rtl">
      {label && <label className="mb-1 font-bold text-zinc-700 dark:text-zinc-200 text-right">{persianLabel}</label>}
      <button
        type="button"
        className="w-full text-right px-4 py-3 rounded-xl border-2 border-yellow-400/60 bg-zinc-900 text-yellow-400 font-bold text-lg shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-200"
        onClick={() => setShow(true)}
      >
        {persianInputValue}
      </button>
      {modal}
    </div>
  );
};

export default TimePicker;