"use client";

import * as React from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/auth.context";
import { Degree, DegreeService } from "@/lib/services/degree.service";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/page-transition";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge"; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { getMonth, getYear, getDate } from 'date-fns-jalali';

const persianMonths = [
  { value: 1, label: "فروردین" },
  { value: 2, label: "اردیبهشت" },
  { value: 3, label: "خرداد" },
  { value: 4, label: "تیر" },
  { value: 5, label: "مرداد" },
  { value: 6, label: "شهریور" },
  { value: 7, label: "مهر" },
  { value: 8, label: "آبان" },
  { value: 9, label: "آذر" },
  { value: 10, label: "دی" },
  { value: 11, label: "بهمن" },
  { value: 12, label: "اسفند" },
];

export default function DegreesPage() {
  const { accessToken } = useAuth();
  const [degrees, setDegrees] = React.useState<Degree[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedMonth, setSelectedMonth] = React.useState<number | undefined>(
    undefined
  );

  const fetchDegrees = React.useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const response = await DegreeService.getAllDegrees(accessToken);
      setDegrees(response);
    } catch (error) {
      toast.error("خطا در دریافت لیست نمرات");
      console.error(error);
      setDegrees([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    fetchDegrees();
  }, [fetchDegrees]);

  const handleCreateDegrees = async () => {
    if (!accessToken || selectedMonth === undefined) return;

    const now = new Date();
    const currentMonth = getMonth(now) + 1; // date-fns-jalali months are 0-indexed
    const currentDay = getDate(now);

    if (selectedMonth === currentMonth && currentDay < 30) {
      toast.error("شما نمی توانید برای ماه جاری که هنوز به پایان نرسیده است، درجه بندی را انجام دهید.");
      return;
    }

    const year = getYear(now);

    try {
      await DegreeService.createDegrees(selectedMonth, year, accessToken);
      toast.success("درجه بندی با موفقیت انجام شد");
      fetchDegrees();
    } catch (error) {
      toast.error("خطا در ایجاد درجه بندی");
      console.error(error);
    }
  };

  return (
    <PageTransition>
      <Card>
        <CardHeader>
          <CardTitle>مدیریت نمرات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Select onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="انتخاب ماه" />
                </SelectTrigger>
                <SelectContent>
                  {persianMonths.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreateDegrees} disabled={selectedMonth === undefined}>
                ایجاد درجه بندی ماه
              </Button>
            </div>
          </div>

          {loading ? (
            <p>در حال بارگذاری...</p>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              >
                {degrees.map((degree) => (
                  <Link href={`/dashboard/degrees/${degree.id}`} key={degree.id}>
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <CardTitle className="text-lg font-semibold">{degree.name}</CardTitle>
                      <Badge variant="outline" className="mt-2">{`${degree.year}/${degree.month}`}</Badge>
                    </Card>
                  </Link>
                ))} 
              </motion.div>
            </AnimatePresence> 
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}