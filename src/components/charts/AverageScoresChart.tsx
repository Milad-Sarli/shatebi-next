"use client";

import * as React from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Type definitions
interface ChartDataPoint {
  date: string;
  hefz: number;
  maqabel: number;
  rokhani: number;
  negatives: {
    hefz: Array<{ student: string; score: number; detail: string }>;
    maqabel: Array<{ student: string; score: number; detail: string }>;
    rokhani: Array<{ student: string; score: number; detail: string }>;
  };
}

// تشخیص اندازه صفحه
const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return screenSize;
};

// داده فیک بر اساس اندازه صفحه
const generateFakeData = (screenSize: 'mobile' | 'tablet' | 'desktop'): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const today = new Date();
  
  // تعداد روزها بر اساس اندازه صفحه
  const daysCount = screenSize === 'mobile' ? 6 : screenSize === 'tablet' ? 13 : 29;
  
  for (let i = daysCount; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const persianDate = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
    
    data.push({
      date: persianDate,
      hefz: Math.floor(Math.random() * 20) + 30, // 75-95
      maqabel: Math.floor(Math.random() * 25) + 50, // 70-95
      rokhani: Math.floor(Math.random() * 15) + 80, // 80-95
      negatives: {
        hefz: Math.random() > 0.7 ? [
          { student: "علی رضایی", score: -2, detail: "غیبت غیرموجه" },
          { student: "محمد احمدی", score: -1, detail: "عدم آمادگی" }
        ] : [],
        maqabel: Math.random() > 0.8 ? [
          { student: "سارا محمدی", score: -1, detail: "تاخیر در کلاس" }
        ] : [],
        rokhani: Math.random() > 0.75 ? [
          { student: "مریم احمدی", score: -1, detail: "اشتباه در خواندن" },
          { student: "حسین کریمی", score: -2, detail: "عدم تمرکز" }
        ] : []
      }
    });
  }
  
  return data;
};

// رنگ‌های مطابق با تصویر
const seriesColors = {
  hefz: "#2563eb", // Blue like in the image
  maqabel: "#10b981", // Teal/green like in the image
  rokhani: "#f59e0b", // Amber for third series
};

// نام فارسی هر درس
const seriesNames = {
  hefz: "حفظ",
  maqabel: "ماقبل", 
  rokhani: "روخوانی",
};

const seriesKeys = ["hefz", "maqabel", "rokhani"] as const;

// Skeleton component برای نمودار
const ChartSkeleton = () => (
  <div className="h-[400px] w-full animate-pulse">
    <div className="flex justify-between items-center mb-4">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-12"></div>
          </div>
        ))}
      </div>
    </div>
    <div className="h-[350px] bg-gray-200 dark:bg-gray-800 rounded-lg flex items-end justify-around p-4">
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-300 dark:bg-gray-700 rounded-t"
          style={{ height: `${Math.random() * 60 + 20}%`, width: '4px' }}
        />
      ))}
    </div>
  </div>
);

export default function AverageScoresChart() {
  const screenSize = useScreenSize();
  const [data, setData] = React.useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = React.useState(true);

  // بارگذاری داده بر اساس اندازه صفحه
  React.useEffect(() => {
    setLoading(true);
    // شبیه‌سازی تاخیر API
    const timer = setTimeout(() => {
      setData(generateFakeData(screenSize));
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [screenSize]);
  
  // مدیریت فعال/غیرفعال بودن هر سری
  const [activeSeries, setActiveSeries] = React.useState<Record<string, boolean>>({
    hefz: true,
    maqabel: true,
    rokhani: false, // Start with only 2 series like the image
  });

  // مدیریت مودال و داده‌های نمرات منفی
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalData, setModalData] = React.useState<{ 
    date: string; 
    lesson: string; 
    negatives: Array<{ student: string; score: number; detail: string }> 
  } | null>(null);

  // داده‌های نمودار بر اساس سری فعال
  const chartSeries = seriesKeys
    .filter((key) => activeSeries[key])
    .map((key) => ({
      data: data.map((d) => d[key]),
      label: seriesNames[key],
      color: seriesColors[key],
      id: key,
    }));

  // محور X (تاریخ‌ها) - فقط روز و ماه نمایش داده می‌شود
  const xLabels = data.map((d) => {
    const parts = d.date.split('/');
    return `${parts[2]}/${parts[1]}`;
  });

  // هندل کلیک روی نقطه نمودار
  const handlePointClick = (event: React.MouseEvent<SVGElement>, params: { seriesId: string | number; dataIndex?: number }) => {
    if (params && params.seriesId && params.dataIndex !== undefined) {
      const { seriesId, dataIndex } = params;
      const lesson = String(seriesId) as keyof typeof seriesNames;
      const dayData = data[dataIndex];
      const negatives = dayData.negatives[lesson];
      
      setModalData({
        date: dayData.date,
        lesson: seriesNames[lesson],
        negatives: negatives || [],
      });
      setModalOpen(true);
    }
  };

  // هندل کلیک روی درس - حذف شده
  // const handleLessonClick = (lesson: keyof typeof seriesNames) => {
  //   // نمایش نمرات منفی آخرین روز با داده
  //   const latestDataWithNegatives = data.slice().reverse().find(d => d.negatives[lesson].length > 0);
    
  //   if (latestDataWithNegatives) {
  //     setModalData({
  //       date: latestDataWithNegatives.date,
  //       lesson: seriesNames[lesson],
  //       negatives: latestDataWithNegatives.negatives[lesson],
  //     });
  //     setModalOpen(true);
  //   }
  // };

  // تغییر وضعیت فعال/غیرفعال سری
  const toggleSeries = (key: string) => {
    setActiveSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // نمایش skeleton در حالت loading
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6 bg-white dark:bg-zinc-900 border-0 shadow-lg">
          <ChartSkeleton />
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6 bg-white dark:bg-zinc-900 border-0 shadow-lg">
        <div className="flex flex-col gap-4 mb-6">
          {/* Title and description */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
              نمودار میانگین نمرات {screenSize === 'mobile' ? 'یک هفته' : screenSize === 'tablet' ? 'دو هفته' : 'یک ماه'} اخیر
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              مقایسه عملکرد روزانه در سه درس مختلف
            </p>
          </div>
          
          {/* Toggle buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-end">
            {seriesKeys.map((key) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={activeSeries[key]}
                  onCheckedChange={() => toggleSeries(key)}
                />
                <label
                  htmlFor={key}
                  className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-gray-700 dark:text-gray-300"
                >
                  {seriesNames[key]}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Gradient definitions matching the image style */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            {/* Blue gradient for series1 */}
            <linearGradient id="series1Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
            </linearGradient>
            
            {/* Teal gradient for series2 */}
            <linearGradient id="series2Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
            </linearGradient>
            
            {/* Amber gradient for series3 */}
            <linearGradient id="series3Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>

        {/* Chart */}
        <div className="h-[300px] sm:h-[400px] w-full bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1 sm:p-2">
          <LineChart
            xAxis={[{ 
              data: xLabels, 
              scaleType: "point",
              tickLabelStyle: {
                fontSize: screenSize === 'mobile' ? 10 : 12,
                fill: '#6b7280'
              }
            }]}
            yAxis={[{
              min: 0,
              max: 120,
              tickLabelStyle: {
                fontSize: screenSize === 'mobile' ? 10 : 12,
                fill: '#6b7280'
              }
            }]}
            series={chartSeries.map((series) => ({
              ...series,
              showMark: true, // نمایش نقاط برای کلیک
              area: true,
              curve: 'natural',
              color: series.color,
            }))}
            height={screenSize === 'mobile' ? 280 : 380}
            onMarkClick={handlePointClick}
            grid={{ 
              horizontal: true, 
              vertical: true,
            }}
            margin={{ 
              left: screenSize === 'mobile' ? -30 : -30, 
              right: screenSize === 'mobile' ? 5 : 10, 
              top: 20, 
              bottom: screenSize === 'mobile' ? 30 : 40 
            }}
            sx={{
              '& .MuiChartsGrid-line': {
                stroke: '#e5e7eb',
                strokeWidth: 1,
              },
              '& .MuiLineElement-root': {
                strokeWidth: screenSize === 'mobile' ? 2 : 3,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
              },
              '& .MuiAreaElement-root': {
                '&[data-series="hefz"]': {
                  fill: 'url(#series1Gradient)',
                },
                '&[data-series="maqabel"]': {
                  fill: 'url(#series2Gradient)',
                },
                '&[data-series="rokhani"]': {
                  fill: 'url(#series3Gradient)',
                },
              },
              '& .MuiMarkElement-root': {
                strokeWidth: screenSize === 'mobile' ? 1 : 2,
                r: screenSize === 'mobile' ? 3 : 4,
                cursor: 'pointer',
                '&:hover': {
                  r: screenSize === 'mobile' ? 4 : 6,
                  transform: 'scale(1.2)',
                }
              },
              '& .MuiChartsAxis-tickLabel': {
                fontSize: screenSize === 'mobile' ? '10px' : '12px',
                fill: '#6b7280',
              },
              '& .MuiChartsAxis-line': {
                stroke: '#d1d5db',
                strokeWidth: 1,
              },
              '& .MuiChartsAxis-tick': {
                stroke: '#d1d5db',
                strokeWidth: 1,
              },
            }}
          />
        </div>

        {/* Info text */}
        <div className="mt-3 sm:mt-4 text-xs text-zinc-500 dark:text-zinc-400 text-center sm:text-right">
          💡 برای مشاهده جزئیات نمرات منفی، روی نقاط نمودار کلیک کنید
        </div>
      </Card>

      {/* Modal for negative scores */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              نمرات منفی {modalData?.lesson} در تاریخ {modalData?.date}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {modalData?.negatives && modalData.negatives.length > 0 ? (
              modalData.negatives.map((neg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {neg.student}
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      {neg.score}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {neg.detail}
                  </p>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                نمره منفی ثبت نشده است
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-6">
            <Button onClick={() => setModalOpen(false)} variant="outline">
              بستن
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 