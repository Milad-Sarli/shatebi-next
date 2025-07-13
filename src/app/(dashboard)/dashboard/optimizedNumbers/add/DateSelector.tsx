import React from 'react';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';

interface DateSelectorProps {
  selectedDate: DateObject | null;
  onChange: (date: DateObject | null) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onChange }) => {
  return (
    <DatePicker
      value={selectedDate}
      onChange={onChange}
      calendar={persian}
      locale={persian_fa}
      calendarPosition="bottom-right"
      style={{ width: '100%' }}
      inputClass="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 px-3 py-2"
      placeholder="انتخاب تاریخ"
    />
  );
};

export default DateSelector; 