"use client";

import * as React from "react";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Trash2,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/context/auth.context";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NumberForm } from "./number-form";
import { PageTransition } from "@/components/ui/page-transition";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  optimizedNumberService,
  OptimizedNumber,
  MasterTeacher,
} from "@/lib/services/number.service";
import { useRouter } from "next/navigation";

// Custom debounce hook
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

interface Student {
  id: number;
  Fname: string;
  Lname: string;
  Aks?: string;
  FatherName?: string;
}

interface Dars {
  id: number;
  title: string;
  is_one_grade: string;
  pages?: number;
  start_page?: number;
}

interface LessonArea {
  id: number;
  start_page?: string;
  end_page?: string;
  start_surah?: string;
  end_surah?: string;
  start_verse?: number;
  end_verse?: number;
  start_joze?: number;
  end_joze?: number;
}

interface Filters {
  page: number;
  per_page: number;
  search: string;
  teacher: string;
  student: string;
  scoreRange: string;
  dateRange: string;
}

export default function OptimizedNumbersPage() {
  const { accessToken } = useAuth();
  const [allNumbers, setAllNumbers] = React.useState<OptimizedNumber[]>([]);
  const [filteredNumbers, setFilteredNumbers] = React.useState<OptimizedNumber[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<Filters>({
    page: 1,
    per_page: 3, // کاهش تعداد آیتم‌ها در هر صفحه برای آزمایش pagination
    search: "",
    teacher: "all",
    student: "all",
    scoreRange: "all",
    dateRange: "all",
  });
  const [pagination, setPagination] = React.useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    from: 0,
    to: 0,
    links: [] as Array<{ url: string | null; label: string; active: boolean }>,
  });
  const [searchInput, setSearchInput] = React.useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const [numberToDelete, setNumberToDelete] = React.useState<number | null>(null);
  const [numberToEdit, setNumberToEdit] = React.useState<OptimizedNumber | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);

  const router = useRouter();

  // Get unique teachers and students for filter options
  const uniqueTeachers = React.useMemo(() => {
    const teachers = allNumbers
      .map(item => item.masterTeacher)
      .filter(Boolean)
      .reduce((acc, teacher) => {
        if (teacher && !acc.find(t => t.id === teacher.id)) {
          acc.push(teacher);
        }
        return acc;
      }, [] as MasterTeacher[]);
    return teachers;
  }, [allNumbers]);

  const uniqueStudents = React.useMemo(() => {
    const students = allNumbers
      .map(item => item.student)
      .filter(Boolean)
      .reduce((acc: Student[], student) => {
        if (student && !acc.find((s: Student) => s.id === student.id)) {
          acc.push(student);
        }
        return acc;
      }, [] as Student[]);
    return students;
  }, [allNumbers]);

  // Fetch all numbers from API
  const fetchNumbers = React.useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const response = await optimizedNumberService.getAll(
        accessToken,
        filters.page,
        filters.per_page,
        debouncedSearch,
        filters.teacher,
        filters.student,
        filters.scoreRange,
        filters.dateRange
      );
      console.log('API Response:', response);
      setAllNumbers(response.data);
      setFilteredNumbers(response.data); // API returns filtered and paginated data
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        total: response.total,
        from: response.from,
        to: response.to,
        links: response.links,
      });
    } catch (error) {
      toast.error("خطا در بارگذاری نمرات");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters, debouncedSearch]);

  // Client-side filtering function (now primarily triggers API fetch)
  const applyFilters = React.useCallback(() => {
    fetchNumbers();
  }, [fetchNumbers]);

  // Apply filters whenever dependencies change
  React.useEffect(() => {
    fetchNumbers();
  }, [fetchNumbers]);

  // Update search filter when debounced search changes
  React.useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  // Initial data fetch
  React.useEffect(() => {
    fetchNumbers();
  }, [fetchNumbers]);

  const handlePageChange = React.useCallback((page: number) => {
    setFilters(prev => ({
      ...prev,
      page,
    }));
  }, []);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters(prev => ({
      ...prev,
      teacher: "all",
      student: "all",
      scoreRange: "all",
      dateRange: "all",
      page: 1
    }));
    setSearchInput("");
  };

  const handleDeleteNumber = async (id: number) => {
    setNumberToDelete(id);
  };

  const confirmDelete = async () => {
    if (!accessToken || !numberToDelete) return;

    try {
      await optimizedNumberService.delete(numberToDelete, accessToken);
      toast.success("نمره با موفقیت حذف شد");
      fetchNumbers();
    } catch (error) {
      toast.error("خطا در حذف نمره");
      console.error(error);
    } finally {
      setNumberToDelete(null);
    }
  };

  const handleEditNumber = (numberItem: OptimizedNumber) => {
    setNumberToEdit(numberItem);
  };

  const activeFiltersCount = [filters.teacher, filters.student, filters.scoreRange, filters.dateRange].filter(f => f && f !== 'all').length;

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg bg-white dark:bg-zinc-900 p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            نمرات
          </h1>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              onClick={() => router.push("/dashboard/optimizedNumbers/add")}
            >
              <Plus className="ml-2 h-4 w-4" />
              افزودن نمره جدید
            </Button>
          </div>
        </div>

        <Card className="border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-zinc-900 dark:text-zinc-100">
                لیست نمرات
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="mb-4 space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
                <Input
                  placeholder="جستجو بر اساس نام دانش‌آموز، استاد، شماره نمره یا توضیحات..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pr-9 border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
                />
              </div>
            </div>

            {/* Desktop table view */}
            <div className="relative overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 hidden md:block">
              <table className="w-full text-right text-sm">
                <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      #
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      دانش‌آموز
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      استاد
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      درس
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      محدوده درسی
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      نمرات
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400"
                        >
                          در حال بارگذاری...
                        </td>
                      </tr>
                    ) : filteredNumbers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400"
                        >
                          نمره‌ای یافت نشد
                        </td>
                      </tr>
                    ) : (
                      filteredNumbers.map((numberItem, index) => (
                          <motion.tr
                            key={numberItem.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                              {pagination.from + index}
                            </td>
                            <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                              {numberItem.student?.Fname}{" "}
                              {numberItem.student?.Lname}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">
                              {numberItem.master_teacher?.fullname || 'نامشخص'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">
                              <Badge
                                variant="outline"
                                className="border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                              >
                                {numberItem.dars?.title || 'نامشخص'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                              {numberItem.lesson_area ? (
                                <div className="text-sm">
                                  {numberItem.lesson_area.start_page && numberItem.lesson_area.end_page ? (
                                    <Badge
                                      variant="outline"
                                      className="border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                                    >
                                      صفحه {numberItem.lesson_area.start_page} تا {numberItem.lesson_area.end_page}
                                    </Badge>
                                  ) : numberItem.lesson_area.start_surah && numberItem.lesson_area.end_surah ? (
                                    <Badge
                                      variant="outline"
                                      className="border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                                    >
                                      {numberItem.lesson_area.start_surah} تا {numberItem.lesson_area.end_surah}
                                    </Badge>
                                  ) : (
                                    <span className="text-zinc-500 dark:text-zinc-400">نامشخص</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-zinc-500 dark:text-zinc-400">نامشخص</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <Badge
                                  variant="outline"
                                  className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                >
                                  حفظ: {numberItem.hefz}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
                                >
                                  مشخصات: {numberItem.details}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                >
                                  تجوید: {numberItem.tajvid}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                >
                                  صوت: {numberItem.sout}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                                >
                                  نمره: {numberItem.number}
                                </Badge>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                onClick={() => handleEditNumber(numberItem)}
                              >
                                <Edit className="h-4 w-4 ml-1" />
                                ویرایش
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                onClick={() =>
                                  handleDeleteNumber(numberItem.id)
                                }
                              >
                                <Trash2 className="h-4 w-4 ml-1" />
                                حذف
                              </Button>
                            </td>
                          </motion.tr>
                        ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="space-y-4 md:hidden">
              <AnimatePresence mode="wait">
                {loading ? (
                  <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    در حال بارگذاری...
                  </div>
                ) : filteredNumbers.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    نمره‌ای یافت نشد
                  </div>
                ) : (
                  filteredNumbers
                    .slice(
                      (filters.page - 1) * filters.per_page,
                      filters.page * filters.per_page
                    )
                    .map((numberItem, index) => (
                      <motion.div
                        key={numberItem.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                              نمره #{numberItem.id}
                            </h3>
                          </div>
                          <div className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                            <p>
                              دانش‌آموز: {numberItem.student?.Fname}{" "}
                              {numberItem.student?.Lname}
                            </p>
                            <p>استاد: {numberItem.master_teacher?.fullname || 'نامشخص'}</p>
                            <p>درس: 
                              <Badge
                                variant="outline"
                                className="mr-2 border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                              >
                                {numberItem.dars?.title || 'نامشخص'}
                              </Badge>
                            </p>
                            <p>محدوده درسی: 
                              {numberItem.lesson_area ? (
                                <span className="mr-2">
                                  {numberItem.lesson_area.start_page && numberItem.lesson_area.end_page ? (
                                    <Badge
                                      variant="outline"
                                      className="border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                                    >
                                      صفحه {numberItem.lesson_area.start_page} تا {numberItem.lesson_area.end_page}
                                    </Badge>
                                  ) : numberItem.lesson_area.start_surah && numberItem.lesson_area.end_surah ? (
                                    <Badge
                                      variant="outline"
                                      className="border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                                    >
                                      {numberItem.lesson_area.start_surah} تا {numberItem.lesson_area.end_surah}
                                    </Badge>
                                  ) : (
                                    <span className="text-zinc-500 dark:text-zinc-400">نامشخص</span>
                                  )}
                                </span>
                              ) : (
                                <span className="mr-2 text-zinc-500 dark:text-zinc-400">نامشخص</span>
                              )}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge
                                variant="outline"
                                className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              >
                                حفظ: {numberItem.hefz}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
                              >
                                مشخصات: {numberItem.details}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                              >
                                تجوید: {numberItem.tajvid}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              >
                                صوت: {numberItem.sout}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                              >
                                نمره: {numberItem.number}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                              onClick={() => handleEditNumber(numberItem)}
                            >
                              <Edit className="h-4 w-4 ml-1" />
                              ویرایش
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              onClick={() => handleDeleteNumber(numberItem.id)}
                            >
                              <Trash2 className="h-4 w-4 ml-1" />
                              حذف
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                )}
              </AnimatePresence>
            </div>

            {/* Enhanced Pagination */}
            {!loading && filteredNumbers.length > 0 && (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="hidden sm:inline">نمایش {pagination.current_page} از {pagination.last_page} صفحه</span>
                    <span className="hidden sm:inline mx-2">|</span>
                    نمایش {(pagination.current_page - 1) * (filters.per_page || 10) + 1} تا {Math.min(pagination.current_page * (filters.per_page || 10), pagination.total)} از {pagination.total} نمره
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1 overflow-x-auto">
                  {/* Desktop pagination - show all buttons */}
                  <div className="hidden sm:flex items-center gap-1">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.last_page)}
                      disabled={pagination.current_page === pagination.last_page}
                      className="border-zinc-200 px-3 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      آخرین
                    </Button>
                    {pagination.links.map((link, index) => {
                      const pageNumber = link.url ? parseInt(new URL(link.url).searchParams.get('page') || '1') : null;
                      const isPrevious = link.label.includes("Previous") || link.label.includes("&laquo;");
                      const isNext = link.label.includes("Next") || link.label.includes("&raquo;");
                      const isEllipsis = link.label === '...';

                      if (isPrevious) {
                        return (
                          <Button
                            key={link.label + index}
                            variant="outline"
                            onClick={() => pageNumber && handlePageChange(pageNumber)}
                            disabled={!link.url}
                            className="border-zinc-200 px-3 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        );
                      }

                      if (isNext) {
                        return (
                          <Button
                            key={link.label + index}
                            variant="outline"
                            onClick={() => pageNumber && handlePageChange(pageNumber)}
                            disabled={!link.url}
                            className="border-zinc-200 px-3 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                        );
                      }

                      if (isEllipsis) {
                        return (
                          <Button
                            key={link.label + index}
                            variant="outline"
                            className="cursor-not-allowed opacity-50 px-3"
                            disabled
                          >
                            ...
                          </Button>
                        );
                      }

                      return (
                        <Button
                          key={link.label + index}
                          variant={link.active ? "default" : "outline"}
                          className={`px-3 ${link.active ? "bg-black text-white dark:bg-white dark:text-black" : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
                          onClick={() => pageNumber && handlePageChange(pageNumber)}
                        >
                          {link.label}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.current_page === 1}
                      className="border-zinc-200 px-3 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      اولین
                    </Button>
                  </div>

                  {/* Mobile pagination - simplified layout */}
                  <div className="flex sm:hidden items-center gap-1">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.last_page)}
                      disabled={pagination.current_page === pagination.last_page}
                      className="border-zinc-200 px-2 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      آخرین
                    </Button>
                    
                    {/* Previous button */}
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(Math.max(1, pagination.current_page - 1))}
                      disabled={pagination.current_page === 1}
                      className="border-zinc-200 px-2 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>

                    {/* Current page */}
                    <Button
                      variant="default"
                      className="bg-black text-white dark:bg-white dark:text-black px-2 text-xs"
                      disabled
                    >
                      {pagination.current_page}
                    </Button>

                    {/* Show page 2 if current page is 1 */}
                    {pagination.current_page === 1 && pagination.last_page > 1 && (
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(2)}
                        className="border-zinc-200 px-2 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        2
                      </Button>
                    )}

                    {/* Show last page if it's not current page and not page 2 */}
                    {pagination.last_page > 2 && pagination.current_page !== pagination.last_page && (
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(pagination.last_page)}
                        className="border-zinc-200 px-2 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        {pagination.last_page}
                      </Button>
                    )}

                    {/* Next button */}
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(Math.min(pagination.last_page, pagination.current_page + 1))}
                      disabled={pagination.current_page === pagination.last_page}
                      className="border-zinc-200 px-2 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.current_page === 1}
                      className="border-zinc-200 px-2 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      اولین
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={numberToEdit !== null}
          onOpenChange={(open: boolean) => !open && setNumberToEdit(null)}
        >
          <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">
                ویرایش نمره
              </DialogTitle>
            </DialogHeader>
            <NumberForm
              initialData={numberToEdit || undefined}
              numberId={numberToEdit?.id}
              onSuccess={() => {
                setNumberToEdit(null);
                fetchNumbers();
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={numberToDelete !== null}
          onOpenChange={(open: boolean) => !open && setNumberToDelete(null)}
        >
          <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">
                تایید حذف
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-zinc-600 dark:text-zinc-400">
                آیا از حذف این نمره اطمینان دارید؟
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setNumberToDelete(null)}
                className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                انصراف
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
              >
                حذف
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
