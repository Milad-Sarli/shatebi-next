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

// Type definitions based on backend API response
interface StudentScore {
  student_id: number;
  fullname: string;
  score: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    labels: string[];
    series: {
      hefz: (number | null)[];
      rokhani: (number | null)[];
    };
    under80_students: {
      hefz: StudentScore[][];
      rokhani: StudentScore[][];
    };
  };
  meta: {
    tenant_id: string;
    days: string;
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

// Hook to get auth token (client-side only)
const useAuthToken = () => {
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          setToken(parsed?.state?.accessToken || null);
        }
      } catch (error) {
        console.error('Error parsing auth storage:', error);
      }
    }
  }, []);
  
  return token;
};

// Fetch chart data from backend API
const fetchChartData = async (days: number, tenantId?: number, accessToken?: string | null): Promise<ApiResponse> => {
  const params = new URLSearchParams();
  params.append('days', days.toString());
  if (tenantId) {
    params.append('tenant_id', tenantId.toString());
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/average-scores-chart?${params}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// رنگ‌های مطابق با تصویر - فقط دو درس
const seriesColors = {
  hefz: "#2563eb", // Blue
  rokhani: "#f59e0b", // Amber
};

// نام فارسی هر درس - فقط دو درس اصلی
const seriesNames = {
  hefz: "حفظ",
  rokhani: "روخوانی",
};

const seriesKeys = ["hefz", "rokhani"] as const;

// Skeleton component برای نمودار
const ChartSkeleton = () => {
  // Static heights to avoid hydration mismatch
  const staticHeights = [
    75, 65, 45, 35, 25, 40, 70, 55, 50, 60, 
    45, 30, 65, 50, 35, 55, 40, 25, 60, 45
  ];

  return (
    <div className="h-[400px] w-full animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="flex gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
      <div className="h-[350px] bg-gray-200 dark:bg-gray-800 rounded-lg flex items-end justify-around p-4">
        {staticHeights.slice(0, 15).map((height, i) => (
          <div
            key={i}
            className="bg-gray-300 dark:bg-gray-700 rounded-t"
            style={{ height: `${height}%`, width: '4px' }}
          />
        ))}
      </div>
    </div>
  );
};

interface AverageScoresChartProps {
  tenantId?: number;
  className?: string;
}

export default function AverageScoresChart({ tenantId, className }: AverageScoresChartProps) {
  const screenSize = useScreenSize();
  const accessToken = useAuthToken();
  const [apiData, setApiData] = React.useState<ApiResponse['data'] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate days based on screen size
  const getDaysCount = (screenSize: 'mobile' | 'tablet' | 'desktop') => {
    return screenSize === 'mobile' ? 7 : screenSize === 'tablet' ? 14 : 30;
  };

  // بارگذاری داده از API
  React.useEffect(() => {
    if (!mounted) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const days = getDaysCount(screenSize);
        const response = await fetchChartData(days, tenantId, accessToken);
        
        if (response.success) {
          setApiData(response.data);
        } else {
          setError('خطا در دریافت داده‌ها');
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError('خطا در برقراری ارتباط با سرور');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [screenSize, tenantId, accessToken, mounted]);
  
  // مدیریت فعال/غیرفعال بودن هر سری - هر دو درس فعال
  const [activeSeries, setActiveSeries] = React.useState<Record<string, boolean>>({
    hefz: true,
    rokhani: true,
  });

  // مدیریت مودال و داده‌های نمرات منفی
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalData, setModalData] = React.useState<{ 
    date: string; 
    lesson: string; 
    students: StudentScore[];
  } | null>(null);

  // Process data for chart
  const processedData = React.useMemo(() => {
    if (!apiData) return { chartSeries: [], xLabels: [] };

    const chartSeries = seriesKeys
      .filter((key) => activeSeries[key])
      .map((key) => ({
        data: apiData.series[key].map(val => val === null ? 0 : val), // Replace null with 0 for chart
        label: seriesNames[key],
        color: seriesColors[key],
        id: key,
      }));

    // Process labels to show only day/month
    const xLabels = apiData.labels.map((label) => {
      // Extract day and month from Persian date like "21 خرداد 1404"
      const parts = label.split(' ');
      if (parts.length >= 2) {
        return `${parts[0]} ${parts[1]}`;
      }
      return label;
    });

    return { chartSeries, xLabels };
  }, [apiData, activeSeries]);

  // هندل کلیک روی نقطه نمودار - بهبود یافته
  const handleChartContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!apiData || !processedData.xLabels.length) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Chart dimensions and margins
    const chartWidth = rect.width - (screenSize === 'mobile' ? 40 : 80); // Account for padding
    const chartHeight = rect.height - (screenSize === 'mobile' ? 60 : 80); // Account for padding and margins
    const leftMargin = screenSize === 'mobile' ? 20 : 40;
    const topMargin = 20;
    
    // Calculate relative position within chart area
    const relativeX = x - leftMargin;
    const relativeY = y - topMargin;
    
    // Check if click is within chart bounds
    if (relativeX < 0 || relativeX > chartWidth || relativeY < 0 || relativeY > chartHeight) {
      console.log('Click outside chart area');
      return;
    }
    
    // Calculate which data point was clicked
    const dataPointWidth = chartWidth / (processedData.xLabels.length - 1);
    const clickedIndex = Math.round(relativeX / dataPointWidth);
    
    console.log('Chart clicked:', { x, y, relativeX, relativeY, clickedIndex, totalPoints: processedData.xLabels.length });
    
    // Ensure index is valid
    if (clickedIndex < 0 || clickedIndex >= processedData.xLabels.length) {
      console.log('Invalid index:', clickedIndex);
      return;
    }
    
    // Determine which series has data at this point
    const activeSeriesKeys = seriesKeys.filter(key => activeSeries[key]);
    let selectedSeries = activeSeriesKeys[0]; // Default to first active series
    
    // Check if we have data for this point in any series
    for (const seriesKey of activeSeriesKeys) {
      const seriesData = apiData.series[seriesKey];
      if (seriesData[clickedIndex] !== null && seriesData[clickedIndex] !== undefined) {
        selectedSeries = seriesKey;
        break;
      }
    }
    
    if (!selectedSeries) {
      console.log('No data found for clicked point');
      return;
    }
    
    // Get students data for this point
    const students = apiData.under80_students[selectedSeries][clickedIndex] || [];
    
    console.log('Opening modal for:', {
      date: apiData.labels[clickedIndex],
      lesson: seriesNames[selectedSeries],
      studentsCount: students.length
    });
    
    setModalData({
      date: apiData.labels[clickedIndex],
      lesson: seriesNames[selectedSeries],
      students: students,
    });
    setModalOpen(true);
  };

  // Keep the original handler as fallback
  const handlePointClick = (event: React.MouseEvent<SVGElement>, params: { seriesId: string | number; dataIndex?: number }) => {
    console.log('MUI Chart point clicked:', params);
    
    if (params && params.seriesId && params.dataIndex !== undefined && apiData) {
      const { seriesId, dataIndex } = params;
      const lesson = String(seriesId) as keyof typeof seriesNames;
      const students = apiData.under80_students[lesson][dataIndex] || [];
      
      console.log('MUI Students data:', students);
      
      setModalData({
        date: apiData.labels[dataIndex],
        lesson: seriesNames[lesson],
        students: students,
      });
      setModalOpen(true);
    }
  };

  // تغییر وضعیت فعال/غیرفعال سری
  const toggleSeries = (key: string) => {
    setActiveSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Enhanced click detection for chart marks - Remove this as we're using coordinate-based detection
  // React.useEffect(() => {
  //   if (!apiData || !mounted) return;

  //   const timer = setTimeout(() => {
  //     // Find all chart marks and add click listeners
  //     const marks = document.querySelectorAll('.MuiMarkElement-root');
      
  //     marks.forEach((mark, index) => {
  //       const handleMarkClick = (e: Event) => {
  //         e.stopPropagation();
  //         console.log('Mark clicked via fallback:', index);
          
  //         // Calculate which series and data point this mark belongs to
  //         const totalPoints = processedData.xLabels.length;
  //         const activeSeriesCount = Object.values(activeSeries).filter(Boolean).length;
          
  //         if (activeSeriesCount > 0) {
  //           const seriesIndex = Math.floor(index / totalPoints);
  //           const dataIndex = index % totalPoints;
  //           const seriesKey = seriesKeys.filter(key => activeSeries[key])[seriesIndex];
            
  //           if (seriesKey && dataIndex < apiData.labels.length) {
  //             const students = apiData.under80_students[seriesKey][dataIndex] || [];
              
  //             setModalData({
  //               date: apiData.labels[dataIndex],
  //               lesson: seriesNames[seriesKey],
  //               students: students,
  //             });
  //             setModalOpen(true);
  //           }
  //         }
  //       };
        
  //       mark.addEventListener('click', handleMarkClick);
  //       mark.addEventListener('touchend', handleMarkClick);
        
  //       // Store the cleanup function
  //       (mark as Element & { _cleanup?: () => void })._cleanup = () => {
  //         mark.removeEventListener('click', handleMarkClick);
  //         mark.removeEventListener('touchend', handleMarkClick);
  //       };
  //     });
  //   }, 100); // Small delay to ensure chart is rendered

  //   return () => {
  //     clearTimeout(timer);
  //     // Cleanup event listeners
  //     const marks = document.querySelectorAll('.MuiMarkElement-root');
  //     marks.forEach((mark) => {
  //       const markWithCleanup = mark as Element & { _cleanup?: () => void };
  //       if (markWithCleanup._cleanup) {
  //         markWithCleanup._cleanup();
  //       }
  //     });
  //   };
  // }, [apiData, mounted, activeSeries, processedData.xLabels.length]);

  // Prevent SSR issues
  if (!mounted) {
    return (
      <div className={className}>
        <Card className="p-6 bg-white dark:bg-zinc-900 border-0 shadow-lg">
          <ChartSkeleton />
        </Card>
      </div>
    );
  }

  // نمایش skeleton در حالت loading
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={className}
      >
        <Card className="p-6 bg-white dark:bg-zinc-900 border-0 shadow-lg">
          <ChartSkeleton />
        </Card>
      </motion.div>
    );
  }

  // نمایش خطا
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={className}
      >
        <Card className="p-6 bg-white dark:bg-zinc-900 border-0 shadow-lg">
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-2">⚠️</div>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                size="sm"
              >
                تلاش مجدد
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // اگر داده‌ای وجود نداشته باشد
  if (!apiData || !apiData.labels || apiData.labels.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={className}
      >
        <Card className="p-6 bg-white dark:bg-zinc-900 border-0 shadow-lg">
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">📊</div>
              <p className="text-gray-600 dark:text-gray-400">
                داده‌ای برای نمایش وجود ندارد
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className="p-6 bg-white dark:bg-zinc-900 border-0 shadow-lg">
        <div className="flex flex-col gap-4 mb-6">
          {/* Title and description */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
              نمودار میانگین نمرات {screenSize === 'mobile' ? 'یک هفته' : screenSize === 'tablet' ? 'دو هفته' : 'یک ماه'} اخیر
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              مقایسه عملکرد روزانه در دو درس اصلی
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

        {/* Gradient definitions */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            {/* Blue gradient for hefz */}
            <linearGradient id="series1Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
            </linearGradient>
            
            {/* Amber gradient for rokhani */}
            <linearGradient id="series2Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>

        {/* Chart */}
        <div 
          className="h-[300px] sm:h-[400px] w-full bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1 sm:p-2 relative cursor-pointer"
          onClick={handleChartContainerClick}
        >
          <LineChart
            xAxis={[{ 
              data: processedData.xLabels, 
              scaleType: "point",
              tickLabelStyle: {
                fontSize: screenSize === 'mobile' ? 10 : 12,
                fill: '#6b7280'
              }
            }]}
            yAxis={[{
              min: 0,
              max: 100,
              tickLabelStyle: {
                fontSize: screenSize === 'mobile' ? 10 : 12,
                fill: '#6b7280'
              }
            }]}
            series={processedData.chartSeries.map((series) => ({
              ...series,
              showMark: true,
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
                '&[data-series="rokhani"]': { 
                  fill: 'url(#series2Gradient)',
                },
              },
              '& .MuiMarkElement-root': {
                strokeWidth: screenSize === 'mobile' ? 2 : 3,
                r: screenSize === 'mobile' ? 5 : 6, // Larger touch targets
                cursor: 'pointer',
                '&:hover': {
                  r: screenSize === 'mobile' ? 7 : 9,
                  transform: 'scale(1.4)',
                },
                // Better click detection
                pointerEvents: 'all',
                // Add touch-friendly styling
                touchAction: 'manipulation',
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
              // Improve overall chart interaction
              '& .MuiResponsiveChartContainer-root': {
                '& svg': {
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                },
              },
            }}
          />
        </div>

        {/* Info text */}
        <div className="mt-3 sm:mt-4 text-xs text-zinc-500 dark:text-zinc-400 text-center sm:text-right">
          💡 برای مشاهده جزئیات دانش‌آموزان زیر 80، روی هر نقطه از نمودار {screenSize === 'mobile' ? 'ضربه بزنید' : 'کلیک کنید'}
          <br />
          <span className="text-xs opacity-75 mt-1 inline-block">
            {screenSize === 'mobile' ? '(می‌توانید روی هر قسمت از نمودار لمس کنید)' : '(کلیک در هر نقطه از نمودار کار می‌کند)'}
          </span>
        </div>
      </Card>

      {/* Modal for students under 80 */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-w-[95vw] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold leading-tight">
              دانش‌آموزان زیر 80 - {modalData?.lesson} در تاریخ {modalData?.date}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4 mt-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
            {modalData?.students && modalData.students.length > 0 ? (
              modalData.students.map((student, idx) => (
                <motion.div
                  key={`${student.student_id}-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base leading-tight">
                      {student.fullname}
                    </span>
                    <Badge 
                      variant={student.score < 60 ? "destructive" : "secondary"} 
                      className="text-xs shrink-0"
                    >
                      {student.score}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                    شناسه دانش‌آموز: {student.student_id}
                  </p>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8 text-zinc-500 dark:text-zinc-400">
                <div className="text-2xl sm:text-3xl mb-2">🎉</div>
                <p className="text-sm sm:text-base">دانش‌آموزی زیر 80 وجود ندارد</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-4 sm:mt-6 pt-4 border-t">
            <Button 
              onClick={() => setModalOpen(false)} 
              variant="outline"
              className="w-full sm:w-auto"
            >
              بستن
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 