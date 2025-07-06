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

      </div>
    </PageTransition>
  );
} 