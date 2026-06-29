"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { BookMarked, Users, BookOpen, Trophy, Info } from "lucide-react";
import {
  JuzService,
  JuzSummary,
  WeeklyCompletion,
  JuzDistributionItem,
} from "@/lib/services/juz.service";
import { PageTransition } from "@/components/ui/page-transition";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function StatCardSkeleton() {
  return (
    <Card className="flex flex-col justify-between px-4 py-4 sm:px-6 sm:py-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl sm:rounded-2xl shadow-md min-h-[100px] sm:min-h-[120px] animate-pulse">
      <div className="flex items-center justify-between w-full mb-1 sm:mb-2">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-20 sm:h-4 sm:w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="h-6 w-12 sm:h-8 sm:w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
    </Card>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  index,
  children,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  index: number;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Card className="flex flex-col justify-between px-4 py-4 sm:px-6 sm:py-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all min-h-[100px] sm:min-h-[120px]">
        <div className="flex items-center justify-between w-full mb-1 sm:mb-2">
          <div
            className="flex items-center justify-center rounded-lg sm:rounded-xl shadow w-10 h-10 sm:w-12 sm:h-12"
            style={{ background: color }}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 text-right leading-tight">
            {title}
          </div>
        </div>
        <div className="flex items-end justify-between w-full">
          <span className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
            {value}
          </span>
        </div>
        {children}
      </Card>
    </motion.div>
  );
}

function formatJalaliWeekRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sDay = s.toLocaleDateString("fa-IR", { day: "numeric" });
  const eDay = e.toLocaleDateString("fa-IR", { day: "numeric" });
  const month = s.toLocaleDateString("fa-IR", { month: "long" });
  return `از شنبه ${sDay} ${month} تا جمعه ${eDay} ${month}`;
}

export default function JuzDashboardPage() {
  const [summary, setSummary] = useState<JuzSummary | null>(null);
  const [weeklyCompletion, setWeeklyCompletion] =
    useState<WeeklyCompletion | null>(null);
  const [juzDistribution, setJuzDistribution] = useState<JuzDistributionItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, weeklyRes, distRes] = await Promise.all([
          JuzService.getSummary(),
          JuzService.getWeeklyCompletion(),
          JuzService.getJuzDistribution(),
        ]);
        if (summaryRes.status === "success") setSummary(summaryRes.data);
        if (weeklyRes.status === "success") setWeeklyCompletion(weeklyRes.data);
        if (distRes.status === "success") setJuzDistribution(distRes.data);
      } catch (err) {
        console.error("Failed to fetch Juz data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const [remainingModalOpen, setRemainingModalOpen] = useState(false);

  const stats = summary
    ? [
        {
          title: "کل قرآن آموزان",
          value: summary.total_students,
          icon: Users,
          color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        },
        {
          title: "فعالان این ماه",
          value: summary.active_students_this_month,
          icon: BookOpen,
          color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        },
        {
          title: "کل قرائت‌ها",
          value: `${summary.total_readings} جزء`,
          icon: BookMarked,
          color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        },
        {
          title: "تعداد ختم",
          value: summary.total_khatms,
          icon: Trophy,
          color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        },
      ]
    : [];

  const remaining = summary?.remaining_juz_for_next_khatm ?? [];
  const showRemainingButton = remaining.length > 5;

  const maxDistCount = Math.max(...juzDistribution.map((d) => d.count), 1);

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-emerald-100 p-1.5 sm:p-2">
            <BookMarked className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-zinc-800 dark:text-zinc-200">
              داشبورد جزء خوانی
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              مدیریت و نظارت بر برنامه جزء خوانی قرآن آموزان
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-4">
            {stats.map((stat, index) => (
              <StatCard key={stat.title} {...stat} index={index}>
                {stat.title === "تعداد ختم" && remaining.length > 0 && (
                  <div className="mt-2 border-t border-zinc-100 dark:border-zinc-800 pt-2">
                    {showRemainingButton ? (
                      <Dialog
                        open={remainingModalOpen}
                        onOpenChange={setRemainingModalOpen}
                      >
                        <DialogTrigger asChild>
                          <button className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors opacity-80 hover:opacity-100">
                            <Info className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            <span className="hidden xs:inline">
                              برای ختم بعدی چه اجزایی لازمه
                            </span>
                            <span className="xs:hidden">اجزای لازم</span>
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[16rem] sm:max-w-sm rounded-2xl p-4 sm:p-6 [&>button.absolute]:hidden">
                          <DialogHeader className="flex flex-row items-center justify-between gap-2">
                            <DialogTitle className="text-sm sm:text-base text-right">
                              اجزای مورد نیاز برای ختم بعدی
                            </DialogTitle>
                            <DialogClose className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                              <svg
                                className="h-3.5 w-3.5 text-zinc-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M18 6 6 18M6 6l12 12" />
                              </svg>
                            </DialogClose>
                          </DialogHeader>
                          <div
                            dir="rtl"
                            className="flex flex-wrap gap-1.5 sm:gap-2 justify-center py-2 sm:py-4"
                          >
                            {remaining.map((juz) => (
                              <span
                                key={juz}
                                className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[11px] sm:text-sm font-bold"
                              >
                                {juz}
                              </span>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {remaining.map((juz) => (
                          <span
                            key={juz}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold"
                          >
                            {juz}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </StatCard>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Juz Distribution */}
          <Card className="p-4 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md">
            <h3 className="text-base sm:text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-4 text-right">
              توزیع قرائت اجزاء
            </h3>
            {loading ? (
              <div className="space-y-2 animate-pulse">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {juzDistribution.map((item) => (
                  <div
                    key={item.juz_number}
                    className="flex items-center gap-2"
                  >
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 w-8 text-left shrink-0">
                      جزء {item.juz_number}
                    </span>
                    <div className="flex-1 h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(item.count / maxDistCount) * 100}%`,
                        }}
                        transition={{
                          duration: 0.8,
                          delay: item.juz_number * 0.02,
                        }}
                        className="h-full bg-gradient-to-l from-emerald-400 to-emerald-600 rounded-full"
                      />
                    </div>
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Weekly Completion */}
          <Card className="p-4 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md">
            <h3 className="text-base sm:text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-1 text-right">
              قرائت‌های این هفته
            </h3>
            {weeklyCompletion && (
              <p className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 mb-4 text-right">
                {formatJalaliWeekRange(weeklyCompletion.week_start, weeklyCompletion.week_end)}
              </p>
            )}
            {loading ? (
              <div className="space-y-2 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded"
                  />
                ))}
              </div>
            ) : weeklyCompletion && weeklyCompletion.items.length > 0 ? (
              <div className="space-y-1.5">
                {weeklyCompletion.items.map((item, index) => {
                  const maxCount = Math.max(
                    ...weeklyCompletion.items.map((d) => d.count),
                    1
                  );
                  return (
                    <div key={item.juz_number} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 w-8 text-left shrink-0">
                        جزء {item.juz_number}
                      </span>
                      <div className="flex-1 h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(item.count / maxCount) * 100}%`,
                          }}
                          transition={{ duration: 0.6, delay: index * 0.03 }}
                          className="h-full bg-gradient-to-l from-blue-400 to-blue-600 rounded-full"
                        />
                      </div>
                      <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 w-8 text-right">
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-zinc-400 text-xs text-center py-8">
                هیچ قرائتی برای این هفته ثبت نشده است
              </p>
            )}
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
