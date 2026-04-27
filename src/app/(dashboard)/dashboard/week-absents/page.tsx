'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { WeekAbsentService, WeekAbsent, WeekAbsentStudent, WeekAbsentFilters } from '@/lib/services/weekAbsent.service';
import { useAuth } from '@/lib/context/auth.context';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns-jalali';
import { useRouter } from 'next/navigation';
import { DateObject } from 'react-multi-date-picker';
import DateSelector from '../optimizedNumbers/add/DateSelector';
import { AnimatePresence, motion } from 'framer-motion';

interface AttendanceFormData {
  date: string;
  students: WeekAbsentStudent[];
}

type RecordTab = 'healthy' | 'problematic';

export default function WeekAbsentsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [attendanceRecords, setAttendanceRecords] = useState<WeekAbsent[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    links: [] as Array<{ url: string | null; label: string; active: boolean }>
  });
  const [perPage] = useState(10);
  const [activeTab, setActiveTab] = useState<RecordTab>('healthy');
  const [savingDateId, setSavingDateId] = useState<number | null>(null);
  const [quickEditDates, setQuickEditDates] = useState<Record<number, DateObject | null>>({});

  const [filters, setFilters] = useState<WeekAbsentFilters>({
    page: 1,
    search: '',
    date: '',
    sort_by: 'date',
    sort_order: 'desc'
  });
  const [selectedDate, setSelectedDate] = useState<DateObject | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WeekAbsent | null>(null);
  const [formData, setFormData] = useState<AttendanceFormData>({
    date: format(new Date(), 'yyyy/MM/dd'),
    students: []
  });

  const parseGregorianDate = (value?: string | null) => {
    if (!value) return null;
    const parsedDate = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const getDisplayDate = (value?: string | null) => {
    const parsedDate = parseGregorianDate(value);
    if (!parsedDate) return '-';

    try {
      return format(parsedDate, 'yyyy/MM/dd');
    } catch {
      return value ?? '-';
    }
  };

  const isProblematicDate = useCallback((record: WeekAbsent) => {
    const recordDate = parseGregorianDate(record.date);
    if (!recordDate) return true;

    const today = new Date();
    const maxAllowedDate = new Date(today);
    maxAllowedDate.setDate(today.getDate() + 14);

    const year = recordDate.getFullYear();
    if (year < 2020 || year > 2035) return true;
    if (recordDate > maxAllowedDate) return true;

    return false;
  }, []);

  const loadAttendanceRecords = useCallback(async (page = 1, limit = 10, currentFilters: WeekAbsentFilters) => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await WeekAbsentService.getAll(accessToken, {
        ...currentFilters,
        page,
        per_page: limit
      });

      if (response.status === 'success') {
        setAttendanceRecords(response.data.data);
        setPagination({
          current_page: response.data.current_page,
          last_page: Math.ceil(response.data.total / response.data.per_page),
          total: response.data.total,
          links: []
        });
      }
    } catch (error) {
      console.error('Error loading attendance records:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری رکوردهای حضور و غیاب',
        type: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken, toast]);

  const handleUpdate = async () => {
    if (!accessToken || !selectedRecord?.id) return;

    try {
      const response = await WeekAbsentService.update(selectedRecord.id, formData, accessToken);
      if (response.status === 'success') {
        toast({
          title: 'موفقیت',
          description: 'حضور و غیاب با موفقیت بروزرسانی شد'
        });
        setIsEditDialogOpen(false);
        loadAttendanceRecords(filters.page ?? 1, perPage, filters);
      }
    } catch {
      toast({
        title: 'خطا',
        description: 'خطا در بروزرسانی حضور و غیاب',
        type: 'destructive'
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!accessToken) return;
    if (!confirm('آیا از حذف این رکورد اطمینان دارید؟')) return;

    try {
      const response = await WeekAbsentService.delete(id, accessToken);
      if (response.status === 'success') {
        toast({
          title: 'موفقیت',
          description: 'رکورد با موفقیت حذف شد'
        });
        loadAttendanceRecords(filters.page ?? 1, perPage, filters);
      }
    } catch {
      toast({
        title: 'خطا',
        description: 'خطا در حذف رکورد',
        type: 'destructive'
      });
    }
  };

  const updateStudentAttendance = (studentId: number, field: keyof WeekAbsentStudent, value: string | boolean | null) => {
    setFormData(prev => ({
      ...prev,
      students: prev.students.map(student =>
        student.student_id === studentId
          ? { ...student, [field]: value }
          : student
      )
    }));
  };

  const handleFilterChange = (key: keyof WeekAbsentFilters, value: string | number) => {
    setFilters(prev => {
      const nextFilters = { ...prev, [key]: value, page: 1 };

      if (key === 'search' && !value) {
        setSelectedDate(null);
        nextFilters.date = '';
      }

      return nextFilters;
    });
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleDateChange = (date: DateObject | null) => {
    setSelectedDate(date);
    handleFilterChange('date', date ? date.format('YYYY-MM-DD') : '');
  };

  const handleQuickDateChange = (recordId: number, date: DateObject | null) => {
    setQuickEditDates(prev => ({ ...prev, [recordId]: date }));
  };

  const handleQuickDateSave = async (record: WeekAbsent) => {
    if (!accessToken || !record.id) return;

    const nextDate = quickEditDates[record.id];
    if (!nextDate) {
      toast({
        title: 'تاریخ لازم است',
        description: 'برای اصلاح رکورد، یک تاریخ جدید انتخاب کنید.',
        type: 'destructive'
      });
      return;
    }

    setSavingDateId(record.id);
    try {
      const response = await WeekAbsentService.update(
        record.id,
        { date: nextDate.format('YYYY/MM/DD') },
        accessToken
      );

      if (response.status === 'success') {
        toast({
          title: 'موفقیت',
          description: 'تاریخ رکورد با موفقیت اصلاح شد'
        });
        setQuickEditDates(prev => ({ ...prev, [record.id!]: null }));
        loadAttendanceRecords(filters.page ?? 1, perPage, filters);
      }
    } catch (error) {
      console.error('Error updating date:', error);
      toast({
        title: 'خطا',
        description: 'اصلاح تاریخ انجام نشد',
        type: 'destructive'
      });
    } finally {
      setSavingDateId(null);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadAttendanceRecords(filters.page, perPage, filters);
    }
  }, [accessToken, loadAttendanceRecords, perPage, filters]);

  const healthyRecords = useMemo(
    () => attendanceRecords.filter(record => !isProblematicDate(record)),
    [attendanceRecords, isProblematicDate]
  );
  const problematicRecords = useMemo(
    () => attendanceRecords.filter(record => isProblematicDate(record)),
    [attendanceRecords, isProblematicDate]
  );

  useEffect(() => {
    if (activeTab === 'healthy' && healthyRecords.length === 0 && problematicRecords.length > 0) {
      setActiveTab('problematic');
    }
  }, [activeTab, healthyRecords.length, problematicRecords.length]);

  const currentTabRecords = activeTab === 'healthy' ? healthyRecords : problematicRecords;

  const renderQuickDateEditor = (record: WeekAbsent) => {
    if (!record.id || activeTab !== 'problematic') return null;

    return (
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-900">
          <CalendarClock className="h-4 w-4" />
          اصلاح سریع تاریخ
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="min-w-[220px] flex-1">
            <DateSelector
              selectedDate={quickEditDates[record.id] ?? null}
              onChange={(date) => handleQuickDateChange(record.id!, date)}
            />
          </div>
          <Button
            size="sm"
            onClick={() => handleQuickDateSave(record)}
            disabled={savingDateId === record.id}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            {savingDateId === record.id ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="ml-2 h-4 w-4" />
            )}
            ذخیره تاریخ
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative flex flex-col gap-4 overflow-hidden rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 dark:from-blue-500/5 dark:via-emerald-500/5 dark:to-blue-500/5" />
        <div className="relative flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-xl font-bold text-transparent dark:from-blue-400 dark:to-emerald-400 sm:text-2xl">
              حضور و غیاب هفتگی
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              رکوردهای مشکوک به تبدیل اشتباه تاریخ در تب جدا نمایش داده می‌شوند.
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-500/20 hover:from-blue-700 hover:to-emerald-700 dark:shadow-blue-500/10"
            onClick={() => router.push('/dashboard/week-absents/add')}
          >
            <Plus className="h-4 w-4" />
            افزودن حضور و غیاب
          </Button>
        </div>
      </div>

      <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
          <CardTitle className="text-zinc-900 dark:text-zinc-100">لیست حضور و غیاب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
              <Input
                placeholder="جستجو..."
                value={filters.search}
                onChange={(event) => handleFilterChange('search', event.target.value)}
                className="border-zinc-200 bg-white pr-9 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
              />
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={() => loadAttendanceRecords(filters.page ?? 1, perPage, filters)}
              className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              جستجو
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <DateSelector selectedDate={selectedDate} onChange={handleDateChange} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-800">رکوردهای سالم</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-900">{healthyRecords.length}</div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-800">تاریخ‌های نیازمند بررسی</span>
                <AlertTriangle className="h-4 w-4 text-amber-700" />
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-900">{problematicRecords.length}</div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/60">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">کل صفحه جاری</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">از {pagination.total} رکورد</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{attendanceRecords.length}</div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as RecordTab)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="healthy">رکوردهای سالم</TabsTrigger>
              <TabsTrigger value="problematic">تاریخ‌های مشکوک</TabsTrigger>
            </TabsList>

            <TabsContent value="healthy" className="space-y-4">
              <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900">
                این تب رکوردهایی را نشان می‌دهد که تاریخ آن‌ها با الگوی معمول ثبت همخوانی دارد.
              </div>
            </TabsContent>

            <TabsContent value="problematic" className="space-y-4">
              <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
                این رکوردها بر اساس تاریخ غیرعادی یا اختلاف زیاد با زمان ایجاد، جدا شده‌اند تا سریع اصلاح شوند.
              </div>
            </TabsContent>
          </Tabs>

          {loading ? (
            <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">در حال بارگذاری...</div>
          ) : (
            <>
              <div className="relative hidden overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 md:block">
                <table className="w-full text-right text-sm">
                  <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">#</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">تاریخ</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">وضعیت تاریخ</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">تعداد دانش آموز</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">ثبت کننده</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    <AnimatePresence mode="wait">
                      {currentTabRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                            رکوردی در این تب یافت نشد
                          </td>
                        </tr>
                      ) : (
                        currentTabRecords.map((record, index) => (
                          <React.Fragment key={record.id}>
                            <motion.tr
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.2 }}
                              className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                            >
                              <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                                {(pagination.current_page - 1) * perPage + index + 1}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">
                                {getDisplayDate(record.date)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                {isProblematicDate(record) ? (
                                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">نیازمند بررسی</Badge>
                                ) : (
                                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">سالم</Badge>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{record.students.length} نفر</td>
                              <td className="whitespace-nowrap px-4 py-3">
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950/50 dark:text-green-300">
                                  {record.user ? `${record.user.fname} ${record.user.lname}` : '-'}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                    onClick={() => router.push(`/dashboard/week-absents/${record.id}`)}
                                  >
                                    <Eye className="ml-1 h-4 w-4" />
                                    مشاهده
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                    onClick={() => {
                                      setSelectedRecord(record);
                                      setFormData({
                                        date: getDisplayDate(record.date),
                                        students: record.students
                                      });
                                      setIsEditDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="ml-1 h-4 w-4" />
                                    ویرایش
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                    onClick={() => record.id && handleDelete(record.id)}
                                  >
                                    <Trash2 className="ml-1 h-4 w-4" />
                                    حذف
                                  </Button>
                                </div>
                              </td>
                            </motion.tr>
                            {activeTab === 'problematic' && (
                              <tr className="bg-amber-50/50 dark:bg-amber-950/10">
                                <td colSpan={6} className="px-4 py-3">
                                  {renderQuickDateEditor(record)}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                <AnimatePresence mode="wait">
                  {currentTabRecords.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg border border-zinc-200 bg-white p-4 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                    >
                      رکوردی در این تب یافت نشد
                    </motion.div>
                  ) : (
                    currentTabRecords.map((record) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <div className="p-4">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                {getDisplayDate(record.date)}
                              </div>
                              <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                {record.students.length} دانش آموز
                              </div>
                            </div>
                            {isProblematicDate(record) ? (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">مشکوک</Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">سالم</Badge>
                            )}
                          </div>

                          <div className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
                            <span className="font-medium">ثبت کننده:</span>{' '}
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950/50 dark:text-green-300">
                              {record.user ? `${record.user.fname} ${record.user.lname}` : '-'}
                            </span>
                          </div>

                          {renderQuickDateEditor(record)}
                        </div>

                        <div className="flex items-center divide-x divide-zinc-100 border-t border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800 rtl:divide-x-reverse">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/week-absents/${record.id}`)}
                            className="h-10 flex-1 rounded-none text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                          >
                            <Eye className="ml-1 h-4 w-4" />
                            مشاهده
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(record);
                              setFormData({
                                date: getDisplayDate(record.date),
                                students: record.students
                              });
                              setIsEditDialogOpen(true);
                            }}
                            className="h-10 flex-1 rounded-none text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                          >
                            <Edit className="ml-1 h-4 w-4" />
                            ویرایش
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => record.id && handleDelete(record.id)}
                            className="h-10 flex-1 rounded-none text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="ml-1 h-4 w-4" />
                            حذف
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {!loading && attendanceRecords.length > 0 && (
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="hidden sm:inline">نمایش {pagination.current_page} از {pagination.last_page} صفحه</span>
                  <span className="mx-2 hidden sm:inline">|</span>
                  نمایش {(pagination.current_page - 1) * perPage + 1} تا {Math.min(pagination.current_page * perPage, pagination.total)} از {pagination.total} رکورد حضور و غیاب
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.current_page === 1}
                    className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    اولین
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="hidden items-center gap-1 sm:flex">
                  {Array.from({ length: pagination.last_page }, (_, index) => index + 1)
                    .filter(page =>
                      page === 1 ||
                      page === pagination.last_page ||
                      (page >= pagination.current_page - 1 && page <= pagination.current_page + 1)
                    )
                    .map((page, index, array) => {
                      if (index > 0 && page - array[index - 1] > 1) {
                        return (
                          <React.Fragment key={`ellipsis-${page}`}>
                            <span className="px-2 text-zinc-500 dark:text-zinc-400">...</span>
                            <Button
                              key={page}
                              variant={pagination.current_page === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className={
                                pagination.current_page === page
                                  ? 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
                                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
                              }
                            >
                              {page}
                            </Button>
                          </React.Fragment>
                        );
                      }

                      return (
                        <Button
                          key={page}
                          variant={pagination.current_page === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className={
                            pagination.current_page === page
                              ? 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
                              : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
                          }
                        >
                          {page}
                        </Button>
                      );
                    })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.last_page)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    آخرین
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-zinc-100">ویرایش حضور و غیاب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-date" className="text-zinc-700 dark:text-zinc-300">تاریخ</Label>
              <Input
                id="edit-date"
                value={formData.date}
                onChange={(event) => setFormData(prev => ({ ...prev, date: event.target.value }))}
                className="border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="۱۴۰۴/۰۱/۱۵"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300">دانش آموزان</Label>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {formData.students.map((student) => (
                  <Card key={student.student_id} className="border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {student.student?.Fname} {student.student?.Lname}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-zinc-400">
                          کد دانش آموزی: {student.student?.StudentCode}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Select
                          value={student.absent === '1' ? 'absent' : student.delay === '1' ? 'delay' : 'present'}
                          onValueChange={(value) => {
                            updateStudentAttendance(student.student_id, 'absent', value === 'absent' ? '1' : '0');
                            updateStudentAttendance(student.student_id, 'delay', value === 'delay' ? '1' : '0');
                          }}
                        >
                          <SelectTrigger className="w-32 border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                            <SelectItem value="present" className="dark:text-zinc-100 dark:focus:bg-zinc-700">حاضر</SelectItem>
                            <SelectItem value="delay" className="dark:text-zinc-100 dark:focus:bg-zinc-700">تاخیر</SelectItem>
                            <SelectItem value="absent" className="dark:text-zinc-100 dark:focus:bg-zinc-700">غایب</SelectItem>
                          </SelectContent>
                        </Select>

                        {student.delay === '1' && (
                          <Input
                            type="time"
                            value={student.delay_time || ''}
                            onChange={(event) => updateStudentAttendance(student.student_id, 'delay_time', event.target.value)}
                            className="w-32 border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          />
                        )}

                        {student.absent === '1' && (
                          <Input
                            placeholder="دلیل غیبت"
                            value={student.absent_reason || ''}
                            onChange={(event) => updateStudentAttendance(student.student_id, 'absent_reason', event.target.value)}
                            className="w-48 border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                          />
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                انصراف
              </Button>
              <Button
                onClick={handleUpdate}
                className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                بروزرسانی
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
