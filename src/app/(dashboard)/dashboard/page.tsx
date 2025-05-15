"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, Building2, Download, TrendingUp } from "lucide-react";
import { AttendanceChart } from "@/components/charts/attendance-chart";
import { PageTransition } from "@/components/ui/page-transition";

const stats = [
  {
    title: "تعداد کل قرآن آموزان",
    value: "345",
    change: "+20.1%",
    changeLabel: "نسبت به ماه گذشته",
    icon: GraduationCap,
    color: "bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500",
  },
  {
    title: "تعداد کل کاربران",
    value: "42",
    change: "+12%",
    changeLabel: "نسبت به ماه گذشته",
    icon: Users,
    color: "bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500",
  },
  {
    title: "تعداد مراکز",
    value: "3",
    change: "+1",
    changeLabel: "مرکز جدید در این ماه",
    icon: Building2,
    color: "bg-gradient-to-br from-sky-500 to-sky-600 dark:from-sky-400 dark:to-sky-500",
  },
];

const AnimatedCard = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="h-full"
  >
    {children}
  </motion.div>
);

const AnimatedStatCard = ({ stat, index }: { stat: typeof stats[0]; index: number }) => (
  <AnimatedCard delay={index * 0.1}>
    <Card className="h-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{stat.title}</CardTitle>
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          className={`p-2 rounded-xl ${stat.color}`}
        >
          <stat.icon className="h-4 w-4 text-white" />
        </motion.div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="text-2xl font-bold text-zinc-900 dark:text-zinc-100"
          >
            {stat.value}
          </motion.div>
          <div className="flex items-center text-xs">
            <TrendingUp className="mr-1 h-3 w-3 text-emerald-500 dark:text-emerald-400" />
            <span className="font-medium text-emerald-500 dark:text-emerald-400">{stat.change}</span>
            <span className="text-zinc-500 dark:text-zinc-400 ml-1">{stat.changeLabel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </AnimatedCard>
);

export default function DashboardPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <AnimatedStatCard key={stat.title} stat={stat} index={index} />
          ))}
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">نمودار حضور و غیاب</CardTitle>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 transition-colors"
              >
                <Download className="h-4 w-4" />
              </motion.button>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <div className="min-w-[500px]">
                  <AttendanceChart height={300} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">کلاس‌های امروز</CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <motion.div
                  whileHover={{ x: 5, backgroundColor: "rgba(244, 244, 245, 0.1)" }}
                  className="flex items-center p-3 rounded-xl transition-colors"
                >
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100">
                      کلاس حفظ جزء 30
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      ساعت 16:00 - استاد محمدی
                    </p>
                  </div>
                  <div className="ml-auto h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400"></div>
                </motion.div>
                <motion.div
                  whileHover={{ x: 5, backgroundColor: "rgba(244, 244, 245, 0.1)" }}
                  className="flex items-center p-3 rounded-xl transition-colors"
                >
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100">
                      کلاس روخوانی و روانخوانی
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      ساعت 18:00 - استاد احمدی
                    </p>
                  </div>
                  <div className="ml-auto h-2 w-2 rounded-full bg-indigo-500 dark:bg-indigo-400"></div>
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
} 