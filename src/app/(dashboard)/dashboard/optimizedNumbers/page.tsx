"use client";

import * as React from "react";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/context/auth.context";
import DatePicker, { DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { optimizedNumberService, OptimizedNumber } from "@/lib/services/number.service";
import { MasterService, Master } from "@/lib/services/master.service";
import { useRouter } from "next/navigation";
import { parseISO } from "date-fns";
import { format as formatJalali } from "date-fns-jalali";
const surahNames = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "ابراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الإنفطار", "المطففين", "الإنشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس"
];
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
interface Filters {
  page: number;
  per_page: number;
  search: string;
  teacher: string;
  student: string;
  scoreRange: string;
  dateRange: string;
  startDate: DateObject | null;
  endDate: DateObject | null;
  negative_scores: boolean;
}

export default function OptimizedNumbersPage() {
  const { accessToken, user } = useAuth();
  const [masters, setMasters] = React.useState<Master[]>([]);
  const [, setAllNumbers] = React.useState<OptimizedNumber[]>([]);
  const [filteredNumbers, setFilteredNumbers] = React.useState<OptimizedNumber[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<Filters>({
    page: 1,
    per_page: 5,
    search: "",
    teacher: "all",
    student: "all",
    scoreRange: "all",
    dateRange: "all",
    startDate: null,
    endDate: null,
    negative_scores: false,
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
  const router = useRouter();
  // Fetch all numbers from API
  const fetchNumbers = React.useCallback(async () => {
    if (!accessToken) return;
    try {
        setLoading(true);
        const startJalali = filters.startDate
          ? filters.startDate.format("YYYY/MM/DD")
          : null;
        const endJalali = filters.endDate
          ? filters.endDate.format("YYYY/MM/DD")
          : null;

        const response = await optimizedNumberService.getAll(
          accessToken,
          filters.page,
          filters.per_page,
          filters.search,
          filters.teacher,
          filters.student,
          filters.scoreRange,
          startJalali,
          endJalali,
          filters.negative_scores
        );

        if (response && response.data) {
            setAllNumbers(response.data || []);
            setFilteredNumbers(response.data || []);
            setPagination({
                current_page: response.current_page,
                last_page: response.last_page,
                total: response.total,
                from: response.from,
                to: response.to,
                links: response.links || [],
            });
        } else {
            setAllNumbers([]);
            setFilteredNumbers([]);
            setPagination({
                current_page: 1,
                last_page: 1,
                total: 0,
                from: 0,
                to: 0,
                links: [],
            });
        }
    } catch (error) {
      console.error("Failed to fetch numbers:", error);
      toast.error("Failed to fetch numbers.");
      setAllNumbers([]);
      setFilteredNumbers([]);
      setPagination({
          current_page: 1,
          last_page: 1,
          total: 0,
          from: 0,
          to: 0,
          links: [],
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters]);

  // Update search filter when debounced search changes
  React.useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  React.useEffect(() => {
    fetchNumbers();
  }, [filters, fetchNumbers]);

  React.useEffect(() => {
    const fetchMasters = async () => {
      if (!accessToken) return;
      try {
        const response = await MasterService.getAllMasters(accessToken);
        setMasters(response || []);
      } catch (error) {
        console.error("Failed to fetch masters:", error);
        toast.error("Failed to fetch masters.");
      }
    };
    fetchMasters();
  }, [accessToken]);

  const autoFilterInitialized = React.useRef(false);
  React.useEffect(() => {
    if (!accessToken || !user || masters.length === 0) return;
    if (autoFilterInitialized.current) return;
    if (filters.teacher !== "all") return;

    const foundMaster = masters.find((m) => m.user_id === user.id)
      || masters.find((m) => m.mellicode === user.username)
      || masters.find((m) => m.fullname === user.name)
      || masters.find((m) => m.mellicode?.toString() === user.username?.toString())
      || masters.find((m) => m.user_id?.toString() === user.id?.toString());

    if (foundMaster) {
      autoFilterInitialized.current = true;
      setFilters(prev => ({ ...prev, teacher: foundMaster.id.toString(), page: 1 }));
    }
  }, [accessToken, user, masters, filters.teacher]);

  const handlePageChange = React.useCallback((page: number) => {
    setFilters(prev => ({
      ...prev,
      page,
    }));
  }, []);

  const handleDeleteNumber = async (id: number) => {
    setNumberToDelete(id);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!accessToken || !numberToDelete) {
      return;
    }

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

  // const handleEditNumber = (numberItem: OptimizedNumber) => {
  //   setNumberToEdit(numberItem);
  // };

  return (
    <PageTransition>
      <div className="flex flex-col gap-3 sm:gap-6 w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-md border border-zinc-100 dark:border-zinc-800">
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

        <Card className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">
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
               <div className="flex flex-wrap gap-2">
            <DatePicker
              inputClass="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 px-3 py-2"
              style={{ width: '100%' }}
              calendar={persian}
              locale={persian_fa}
              value={filters.startDate}
              onChange={(date: DateObject) =>
                setFilters((prev) => ({ ...prev, startDate: date }))
              }
              placeholder="تاریخ شروع"
            />
            <DatePicker
              inputClass="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 px-3 py-2"
              style={{ width: '100%' }}
              calendar={persian}
              locale={persian_fa}
              value={filters.endDate}
              onChange={(date: DateObject) =>
                setFilters((prev) => ({ ...prev, endDate: date }))
              }
              placeholder="تاریخ پایان"
            />
            <Select
              value={filters.teacher ?? "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, teacher: value, page: 1 }))
              }
            >
              <SelectTrigger dir="rtl" className="w-[180px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 px-3 py-2">
                <SelectValue placeholder="همه استادان" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem dir="rtl" value="all">همه استادان</SelectItem>
                {masters.map((master) => (
                  <SelectItem dir="rtl" key={master.id} value={master.id.toString()}>
                    {master.fullname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-fit flex items-center">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="negative_scores"
                  checked={filters.negative_scores}
                  onCheckedChange={(checked) =>
                    setFilters((prev) => ({ ...prev, negative_scores: Boolean(checked) }))
                  }
                  className="h-4 w-4"
                />
                <Label
                  htmlFor="negative_scores"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  نمرات منفی
                </Label>
              </div>
            </div>
          {
              (filters.search !== "" ||
                filters.teacher !== "all" ||
                filters.startDate !== null ||
                filters.endDate !== null ||
                filters.negative_scores !== false) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({
                      page: 1,
                      per_page: 5,
                      search: "",
                      teacher: "all",
                      student: "all",
                      scoreRange: "all",
                      dateRange: "all",
                      startDate: null,
                      endDate: null,
                      negative_scores: false,
                    });
                  }}
                  className="whitespace-nowrap"
                >
                  <Trash2 className="ml-2 h-4 w-4 cursor-pointer text-red-500" />
                  پاک کردن فیلترها
                </Button>
              )
            }
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
                      ثبت شده در
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  <AnimatePresence>
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
                      (filteredNumbers || []).map((numberItem, index) => (
                          <motion.tr
                            key={numberItem.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className={`${numberItem.number >= 70 && numberItem.number <= 79 || (numberItem.hefz >= 55 && numberItem.hefz <= 59) ? 'bg-red-100 dark:bg-red-900' : ''}`}
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
                                  ) : numberItem.lesson_area.start_joze && numberItem.lesson_area.end_joze ? (
                                    <Badge
                                      variant="outline"
                                      className="border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                                    >
                                      جزء {numberItem.lesson_area.start_joze} تا {numberItem.lesson_area.end_joze}
                                    </Badge>
                                  ) : numberItem.lesson_area.start_surah && numberItem.lesson_area.end_surah ? (
                                    <Badge
                                      variant="outline"
                                      className="border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                                    >
                                      سوره: {surahNames[numberItem.lesson_area.start_surah - 1]}
                                      {numberItem.lesson_area.start_verse ? ` آیه ${numberItem.lesson_area.start_verse}` : null}
                                      {numberItem.lesson_area.end_surah && numberItem.lesson_area.end_surah !== numberItem.lesson_area.start_surah && (
                                          <span> تا سوره: {surahNames[numberItem.lesson_area.end_surah - 1]}</span>
                                      )}
                                      {numberItem.lesson_area.end_verse ? ` آیه ${numberItem.lesson_area.end_verse}` : null}
                                    </Badge>
                                  ) : (
                                    <span className="text-zinc-500 dark:text-zinc-400"> ثبت نشده یا عدم تحویل </span>
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
                            <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                              {numberItem.created_at ? formatJalali(parseISO(numberItem.created_at), 'yyyy/MM/dd') : 'نامشخص'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">

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
              <AnimatePresence>
                {loading ? (
                  <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    در حال بارگذاری...
                  </div>
                ) : filteredNumbers.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    نمره‌ای یافت نشد
                  </div>
                ) : (
                      (filteredNumbers || [])
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
                          className={cn(
                            "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden",
                            (numberItem.number <= 79 || (numberItem.hefz >= 55 && numberItem.hefz <= 59))
                              && "bg-red-100 dark:bg-red-900"
                          )}
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
                            <p>
                              محدوده درسی:
                              {numberItem.lesson_area ? (
                                <span className="mr-2">
                                  {numberItem.lesson_area.start_joze && (
                                    <Badge
                                      variant="outline"
                                      className="mr-2 border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                                    >
                                      جزء: {numberItem.lesson_area.start_joze}
                                      {numberItem.lesson_area.end_joze && ` تا ${numberItem.lesson_area.end_joze}`}
                                    </Badge>
                                  )}
                                  {numberItem.lesson_area.start_surah && (
                                    <Badge
                                      variant="outline"
                                      className="mr-2 border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                                    >
                                      سوره: {surahNames[numberItem.lesson_area.start_surah - 1]}
                                      {numberItem.lesson_area.start_verse && ` آیه: ${numberItem.lesson_area.start_verse}`}
                                      {numberItem.lesson_area.end_surah && numberItem.lesson_area.end_surah !== numberItem.lesson_area.start_surah && (
                                          ` تا سوره: ${surahNames[numberItem.lesson_area.end_surah - 1]}`
                                      )}
                                      {numberItem.lesson_area.end_verse && ` آیه: ${numberItem.lesson_area.end_verse}`}
                                    </Badge>
                                  )}
                                  {numberItem.lesson_area.start_page && (
                                    <Badge
                                      variant="outline"
                                      className="mr-2 border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                                    >
                                      صفحه: {numberItem.lesson_area.start_page}
                                      {numberItem.lesson_area.end_page && ` تا ${numberItem.lesson_area.end_page}`}
                                    </Badge>
                                  )}
                                  {!numberItem.lesson_area.start_joze && !numberItem.lesson_area.start_surah && !numberItem.lesson_area.start_page && (
                                    <span className="text-zinc-500 dark:text-zinc-400">نامشخص</span>
                                  )}
                                </span>
                              ) : (
                                <span className="mr-2 text-zinc-500 dark:text-zinc-400">نامشخص</span>
                              )}
                            </p>
                            <p>
                              ثبت شده در: {numberItem.created_at ? formatJalali(parseISO(numberItem.created_at), 'yyyy/MM/dd') : 'نامشخص'}
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
            {!loading && filteredNumbers.length > 0 && pagination && pagination.links && (
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
                onClick={() => {
                  confirmDelete();
                }}
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