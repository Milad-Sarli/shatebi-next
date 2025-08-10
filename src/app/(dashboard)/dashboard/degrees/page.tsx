"use client";

import * as React from "react";
import Link from "next/link";
import { getMonth, getYear, getDate } from 'date-fns-jalali';
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,  
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import {
  Table, 
  TableBody,
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/page-transition";
import { useAuth } from "@/lib/context/auth.context";
import { Degree, DegreeService } from "@/lib/services/degree.service";

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

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function DegreesPage() {
  const { accessToken } = useAuth();
  const [degrees, setDegrees] = React.useState<Degree[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedMonth, setSelectedMonth] = React.useState<number | undefined>();
  const [selectedYear, setSelectedYear] = React.useState<number | undefined>();
  const [isCreating, setIsCreating] = React.useState(false);
  
  const [filters, setFilters] = React.useState({ page: 1, search: "" });
  const [pagination, setPagination] = React.useState({ current_page: 1, last_page: 1 });
  const [searchInput, setSearchInput] = React.useState("");
  const debouncedSearch = useDebounce(searchInput, 500);

  const fetchDegrees = React.useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await DegreeService.getAllDegrees(accessToken, filters.page, filters.search);
      setDegrees(response.data || []);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
      });
    } catch (error) {
      toast.error("خطا در دریافت لیست نمرات");
      console.error(error);
      setDegrees([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters]);

  React.useEffect(() => {
    fetchDegrees();
  }, [fetchDegrees]);

  React.useEffect(() => {
    setFilters(prev => ({ ...prev, page: 1, search: debouncedSearch }));
  }, [debouncedSearch]);

  const handleCreateDegrees = async () => {
    if (!accessToken || selectedMonth === undefined || selectedYear === undefined) return;

    const now = new Date();
    const currentMonth = getMonth(now) + 1;
    const currentYear = getYear(now);
    const currentDay = getDate(now);

    if (selectedYear === currentYear && selectedMonth === currentMonth && currentDay < 30) {
      toast.error("شما نمی توانید برای ماه جاری که هنوز به پایان نرسیده است، درجه بندی را انجام دهید.");
      return;
    }

    try {
      setIsCreating(true);
      await DegreeService.createDegrees(selectedMonth, selectedYear, accessToken);
      toast.success("درجه بندی با موفقیت انجام شد");
      fetchDegrees();
    } catch (error) {
      toast.error("خطا در ایجاد درجه بندی");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const totalPages = pagination.last_page;
    const currentPage = pagination.current_page;
    const pageLimit = 5;
    let startPage = Math.max(1, currentPage - Math.floor(pageLimit / 2));
    let endPage = startPage + pageLimit - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - pageLimit + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }
    return buttons;
  };

  return (
    <PageTransition>
      <Card>
        <CardHeader>
          <CardTitle>مدیریت نمرات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Select dir="rtl" onValueChange={(value) => setSelectedMonth(parseInt(value))}>
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
              <Select dir="rtl" onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="انتخاب سال" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 6 }, (_, i) => {
                    const year = getYear(new Date()) - i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleCreateDegrees} 
                disabled={selectedMonth === undefined || selectedYear === undefined || isCreating}
              >
                {isCreating ? 'در حال ایجاد...' : 'ایجاد درجه بندی ماه'}
              </Button>
            </div>
            <div className="w-full sm:w-auto">
              <Input
                dir="rtl"
                type="text"
                placeholder="جستجوی نمرات..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full sm:w-[250px]"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-center py-8">در حال بارگذاری...</p>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Table className="min-w-full">
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-right">شناسه</TableHead>
                      <TableHead className="text-right">سال</TableHead>
                      <TableHead className="text-right">ماه</TableHead>
                      <TableHead className="text-right">
                        تعداد دانش‌آموزان
                      </TableHead> 
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {degrees.length > 0 ? (
                      degrees.map((degree, index) => (
                        <TableRow
                          key={degree.id}
                          className={index % 2 === 0 ? "bg-muted/20" : ""}
                        >
                          <TableCell>{degree.id}</TableCell>
                          <TableCell>{degree.year}</TableCell>
                          <TableCell>{degree.month}</TableCell>
                          <TableCell>{degree.items?.length || 0}</TableCell>
                          <TableCell>
                            <Link href={`/dashboard/degrees/${degree.id}`}>
                              <Button
                                className="cursor-pointer"
                                variant="ghost"
                                size="sm"
                              >
                                مشاهده جزئیات
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          {searchInput
                            ? `نتیجه‌ای برای "${searchInput}" یافت نشد`
                            : "هیچ درجه‌بندی یافت نشد"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {pagination.last_page > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(1, pagination.current_page - 1))}
                      disabled={pagination.current_page === 1}
                    >
                      قبلی
                    </Button>
                    
                    {renderPaginationButtons()}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.min(pagination.last_page, pagination.current_page + 1))}
                      disabled={pagination.current_page === pagination.last_page}
                    >
                      بعدی
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}