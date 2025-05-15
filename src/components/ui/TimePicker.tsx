"use client";
import * as React from "react";
import { LocalizationProvider, TimePicker as MuiTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, label }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MuiTimePicker
        label={label}
        value={value ? dayjs(value, "HH:mm") : null}
        onChange={(newValue) => {
          if (newValue) {
            onChange(dayjs(newValue).format("HH:mm"));
          } else {
            onChange("");
          }
        }}
        viewRenderers={{
          hours: renderTimeViewClock,
          minutes: renderTimeViewClock,
          seconds: renderTimeViewClock,
        }}
        ampm={false}
        slotProps={{ textField: { fullWidth: true } }}
      />
    </LocalizationProvider>
  );
};

export default TimePicker; 