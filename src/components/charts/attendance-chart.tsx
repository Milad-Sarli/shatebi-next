"use client"

import * as React from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const attendanceData = [
  { name: "فروردین", حضور: 85, غیاب: 15 },
  { name: "اردیبهشت", حضور: 90, غیاب: 10 },
  { name: "خرداد", حضور: 88, غیاب: 12 },
  { name: "تیر", حضور: 92, غیاب: 8 },
  { name: "مرداد", حضور: 87, غیاب: 13 },
  { name: "شهریور", حضور: 95, غیاب: 5 },
]

interface AttendanceChartProps {
  height?: number | string
}

export function AttendanceChart({ height = 300 }: AttendanceChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={attendanceData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="حضور" stackId="1" stroke="#22c55e" fill="#22c55e" />
          <Area type="monotone" dataKey="غیاب" stackId="1" stroke="#ef4444" fill="#ef4444" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
} 