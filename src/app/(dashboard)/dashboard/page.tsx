"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { GraduationCap, Trophy, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/context/auth.context";
import { DashboardService } from "@/lib/services/dashboard.service";
import { PageTransition } from "@/components/ui/page-transition";
import AverageScoresChart from "@/components/charts/AverageScoresChart";

// Simple skeleton component for stat cards
function StatCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="w-full"
    >
      <Card className="flex flex-col justify-between px-3 py-3 sm:px-6 sm:py-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl sm:rounded-2xl shadow-md min-h-[80px] sm:min-h-[120px] animate-pulse">
        <div className="flex items-center justify-between w-full mb-1 sm:mb-2">
          <div
            className="flex items-center justify-center rounded-lg sm:rounded-xl shadow w-8 h-8 sm:w-12 sm:h-12"
            style={{
              background: "linear-gradient(90deg, #e0e7ef 25%, #f3f4f6 50%, #e0e7ef 75%)",
            }}
          >
            <div className="h-4 w-4 sm:h-6 sm:w-6 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <span className="h-3 w-16 sm:h-4 sm:w-20 rounded bg-zinc-200 dark:bg-zinc-800 block" />
        </div>
        <div className="flex items-end justify-between w-full">
          <span className="h-6 w-12 sm:h-8 sm:w-16 rounded bg-zinc-200 dark:bg-zinc-800 block" />
        </div>
      </Card>
    </motion.div>
  );
}

// Map icon string from API to Lucide icon component
const iconMap: Record<string, React.ElementType> = {
  school: GraduationCap,
  emoji_events: Trophy,
  remove_circle: AlertCircle,
};

const ModernStatCard = ({
  stat,
  index,
}: {
  stat: { title: string; value: string | number; icon: React.ElementType; color: string };
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.08 }}
    className="w-full"
  >
    <Card className="flex flex-col justify-between px-4 py-4 sm:px-6 sm:py-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all duration-150 min-h-[100px] sm:min-h-[120px]">
      <div className="flex items-center justify-between w-full mb-1 sm:mb-2">
        <div
          className="flex items-center justify-center rounded-lg sm:rounded-xl shadow w-10 h-10 sm:w-12 sm:h-12"
          style={{
            background: stat.color,
          }}
        >
          <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 text-right leading-tight">
          {stat.title}
        </div>
      </div>
      <div className="flex items-end justify-between w-full">
        <span className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">{stat.value}</span>
        {/* Optionally, you can add a small trend indicator or badge here */}
      </div>
    </Card>
  </motion.div>
);

export default function DashboardPage() {
  const { user } = useAuth();

  const [countyData, setCountyData] = React.useState<
    Array<{
      title: string;
      value: number;
      color: string;
      icon: string;
      key: string;
    }>
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    const { state } = JSON.parse(localStorage.getItem("auth-storage") || "{}");
    if (state && state.accessToken) {
      DashboardService.getCountyData(state.accessToken)
        .then((data: unknown) => {
          if (Array.isArray(data)) {
            setCountyData(data as Array<{
              title: string;
              value: number;
              color: string;
              icon: string;
              key: string;
            }>);
          } else {
            setCountyData([]);
          }
        })
        .catch(() => setCountyData([]))
        .finally(() => setLoading(false));
    } else {
      setCountyData([]);
      setLoading(false);
    }
  }, []);

  // Map API data to stat cards, using iconMap and color from API
  const stats = React.useMemo(() => {
    if (!Array.isArray(countyData)) return [];
    return countyData.map((item) => ({
      title: item.title,
      value: item.value,
      icon: iconMap[item.icon] || GraduationCap,
      color: item.color,
    }));
  }, [countyData]);

  // Number of skeletons to show while loading
  const skeletonCount = 4;

  return (
    <PageTransition>
      <div className="flex flex-col gap-3 sm:gap-6 w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 mb-1 sm:mb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="rounded-full bg-blue-100 p-1.5 sm:p-2">
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 font-semibold">نام دارالقرآن</div>
              <div className="text-base sm:text-lg font-bold text-zinc-800 dark:text-zinc-200 truncate">{user?.tenant?.title}</div>
            </div>
          </div>
          {/* Optionally, add a date picker or user avatar here for more modern look */}
        </div>
        {/* Stat Cards: Only for Admins */}
        {user?.app_roles?.some((role: unknown) => (role as { name: string }).name === 'admin') && (
          <>
            {/* Mobile View: Single Card with Vertical List */}
            <div className="sm:hidden">
              <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md">
                {loading ? (
                  <div className="flex flex-col gap-4 animate-pulse">
                    {Array.from({ length: skeletonCount }).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                        <div className="flex-1">
                          <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 mb-2" />
                          <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-800" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {stats.map((stat, index) => (
                      <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.08 }}
                        className="flex items-center gap-4"
                      >
                        <div
                          className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg shadow"
                          style={{ background: stat.color }}
                        >
                          <stat.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">{stat.title}</div>
                          <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">{stat.value}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Desktop View: Grid of Cards */}
            <div className="hidden sm:grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {loading
                ? Array.from({ length: skeletonCount }).map((_, idx) => (
                    <StatCardSkeleton key={idx} index={idx} />
                  ))
                : stats.map((stat, index) => (
                    <ModernStatCard key={stat.title} stat={stat} index={index} />
                  ))}
            </div>
            
            {/* Average Scores Chart */}
            <div className="mt-2 sm:mt-0">
              <AverageScoresChart />
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}