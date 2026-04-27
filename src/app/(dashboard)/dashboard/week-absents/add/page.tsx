'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { WeekAbsentService, WeekAbsentStudent } from '@/lib/services/weekAbsent.service';
import { CurrentlyStudyingStudentsService, CurrentlyStudyingStudent } from '@/lib/services/currently-studying-students.service';
import { useAuth } from '@/lib/context/auth.context';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  Loader2,
  Save,
  UserX,
  Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import DateSelector from '../../optimizedNumbers/add/DateSelector';
import { DateObject } from 'react-multi-date-picker';

export default function AddWeekAbsentPage() {
  const { user, accessToken } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<DateObject | null>(null);
  const [startedDate, setStartedDate] = useState<string | null>(null);

  const [students, setStudents] = useState<CurrentlyStudyingStudent[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastStudentRef = useRef<HTMLDivElement | null>(null);

  const [attendance, setAttendance] = useState<Record<number, WeekAbsentStudent>>({});

  useEffect(() => {
    setStudents([]);
    setAttendance({});
    setPage(1);
    setHasMore(true);
    setTotalStudents(0);
  }, [selectedDate]);

  const createBaseAttendance = (student: CurrentlyStudyingStudent): WeekAbsentStudent => ({
    student_id: student.id,
    absent: '0',
    delay: '0',
    delay_time: null,
    absent_reason: null,
    status: 0,
    student: {
      id: student.id,
      Fname: student.Fname,
      Lname: student.Lname,
      Mellicode: student.Mellicode,
      StudentCode: student.StudentCode
    }
  });

  const loadStudents = useCallback(async () => {
    if (!accessToken || !user?.tenant_id || !selectedDate || loadingStudents || !hasMore) return;
    setLoadingStudents(true);

    try {
      const response = await CurrentlyStudyingStudentsService.getCurrentlyStudyingStudents(
        user.tenant_id,
        { per_page: 15, paginate: 'on', page },
        accessToken
      );

      if (response.status === 'success') {
        let newStudents: CurrentlyStudyingStudent[] = [];
        let total = 0;

        if (Array.isArray(response.data)) {
          newStudents = response.data;
          total = response.data.length;
          setHasMore(false);
        } else {
          newStudents = response.data.data;
          total = response.data.total;
          setHasMore(response.data.current_page < response.data.last_page);
        }

        setTotalStudents(total);
        setStudents(prev => {
          const existingIds = new Set(prev.map(student => student.id));
          const filteredStudents = newStudents.filter(student => !existingIds.has(student.id));
          return [...prev, ...filteredStudents];
        });
      }
    } catch {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری دانش آموزان',
        type: 'destructive'
      });
    } finally {
      setLoadingStudents(false);
    }
  }, [accessToken, user, selectedDate, loadingStudents, hasMore, toast, page]);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    if (lastStudentRef.current && hasMore && !loadingStudents) {
      observer.current = new window.IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          setPage(prev => prev + 1);
        }
      });

      observer.current.observe(lastStudentRef.current);
    }

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [students, hasMore, loadingStudents]);

  useEffect(() => {
    if (selectedDate) {
      loadStudents();
    }
  }, [page, selectedDate, loadStudents]);

  const markAbsent = (student: CurrentlyStudyingStudent) => {
    setAttendance(prev => {
      const current = prev[student.id] ?? createBaseAttendance(student);

      return {
        ...prev,
        [student.id]: {
          ...current,
          absent: '1',
          delay: '0',
          delay_time: null,
          absent_reason: current.absent_reason ?? ''
        }
      };
    });
  };

  const markDelay = (student: CurrentlyStudyingStudent) => {
    setAttendance(prev => {
      const current = prev[student.id] ?? createBaseAttendance(student);

      return {
        ...prev,
        [student.id]: {
          ...current,
          absent: '0',
          absent_reason: null,
          delay: '1',
          delay_time: current.delay_time ?? ''
        }
      };
    });
  };

  const clearAttendanceStatus = (student: CurrentlyStudyingStudent) => {
    setAttendance(prev => ({
      ...prev,
      [student.id]: createBaseAttendance(student)
    }));
  };

  const setAbsentReason = (studentId: number, reason: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        absent_reason: reason
      }
    }));
  };

  const setDelayTime = (studentId: number, time: string) => {
    const formattedTime = time && /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : time;

    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        delay_time: formattedTime
      }
    }));
  };

  const createAllAttendanceRecords = () =>
    students.map(student => attendance[student.id] ?? createBaseAttendance(student));

  const handleSubmit = async () => {
    if (!accessToken || !selectedDate) return;

    setSubmitting(true);

    try {
      const response = await WeekAbsentService.create(
        {
          date: selectedDate.format('YYYY/MM/DD'),
          students: createAllAttendanceRecords()
        },
        accessToken
      );

      if (response.status === 'success') {
        setStartedDate(selectedDate.format('YYYY/MM/DD'));
        toast({
          title: 'موفقیت',
          description: 'حضور و غیاب با موفقیت ثبت شد'
        });
        router.push('/dashboard/week-absents');
      }
    } catch {
      toast({
        title: 'خطا',
        description: 'خطا در ثبت حضور و غیاب',
        type: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDateChange = (date: DateObject | null) => {
    if (startedDate && date && startedDate !== date.format('YYYY/MM/DD')) {
      const shouldChange = window.confirm(
        `شما حضور و غیاب تاریخ ${startedDate} را شروع کردید. آیا مطمئن هستید که می‌خواهید برای تاریخ ${date.format('YYYY/MM/DD')} حضور و غیاب را شروع کنید؟`
      );

      if (!shouldChange) return;
    }

    setSelectedDate(date);
  };

  const absentCount = useMemo(
    () => Object.values(attendance).filter(item => item.absent === '1').length,
    [attendance]
  );
  const delayCount = useMemo(
    () => Object.values(attendance).filter(item => item.delay === '1').length,
    [attendance]
  );
  const changedCount = absentCount + delayCount;
  const hasDraftChanges = Boolean(selectedDate || changedCount > 0);

  const handleBack = () => {
    if (hasDraftChanges) {
      const shouldLeave = window.confirm('اطلاعات ثبت‌نشده از بین می‌رود. بازگشت انجام شود؟');
      if (!shouldLeave) return;
    }

    router.push('/dashboard/week-absents');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-zinc-800 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>ثبت حضور و غیاب هفتگی</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 sm:text-2xl">افزودن حضور و غیاب جدید</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                صفحه به‌صورت موبایل‌محور بازطراحی شده تا انتخاب وضعیت هر قرآن‌آموز سریع‌تر و واضح‌تر باشد.
              </p>
            </div>
          </div>

          <div className="flex gap-2 sm:flex-col sm:items-end lg:flex-row">
            <Button variant="outline" onClick={handleBack} className="flex-1 sm:flex-none">
              <ArrowRight className="ml-2 h-4 w-4" />
              انصراف و بازگشت
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <CardHeader className="space-y-4 pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                انتخاب تاریخ
              </CardTitle>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-zinc-800/70">
                <Label htmlFor="date" className="mb-3 block text-sm font-medium text-slate-600 dark:text-zinc-300">
                  تاریخ حضور و غیاب
                </Label>
                <DateSelector selectedDate={selectedDate} onChange={handleDateChange} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-red-50 p-3 dark:bg-red-950/40">
                  <p className="text-xs text-red-700 dark:text-red-300">غایب</p>
                  <p className="mt-1 text-xl font-bold text-red-800 dark:text-red-200">{absentCount}</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/40">
                  <p className="text-xs text-amber-700 dark:text-amber-300">تاخیر</p>
                  <p className="mt-1 text-xl font-bold text-amber-800 dark:text-amber-200">{delayCount}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                <div className="flex items-center justify-between gap-2">
                  <span>کل قرآن‌آموزان</span>
                  <span className="font-semibold">{totalStudents}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span>بارگذاری شده</span>
                  <span className="font-semibold">{students.length}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span>وضعیت‌های ثبت‌شده</span>
                  <span className="font-semibold">{changedCount}</span>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!selectedDate || loadingStudents || students.length === 0 || submitting}
                className="h-11 w-full bg-green-600 text-white hover:bg-green-700"
              >
                {submitting ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="ml-2 h-4 w-4" />
                )}
                ثبت حضور و غیاب
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  لیست قرآن‌آموزان
                </CardTitle>

                {selectedDate ? (
                  <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-sm">
                    تاریخ: {selectedDate.format('YYYY/MM/DD')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="w-fit rounded-full px-3 py-1 text-sm">
                    ابتدا تاریخ را انتخاب کنید
                  </Badge>
                )}
              </div>

              <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-zinc-800/70 dark:text-zinc-300">
                برای هر قرآن‌آموز یک وضعیت انتخاب کنید. در صورت اشتباه، با دکمه «حاضر» همان کارت را برگردانید.
              </div>
            </CardHeader>

            <CardContent>
              {!selectedDate ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-800/60">
                  <Calendar className="mb-3 h-10 w-10 text-slate-400 dark:text-zinc-500" />
                  <p className="text-base font-medium text-slate-700 dark:text-zinc-200">برای شروع یک تاریخ انتخاب کنید</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">بعد از انتخاب تاریخ، لیست قرآن‌آموزان به‌صورت خودکار بارگذاری می‌شود.</p>
                </div>
              ) : (
                <div className="space-y-3 pb-24 sm:pb-6">
                  {students.map((student, idx) => {
                    const currentAttendance = attendance[student.id] ?? createBaseAttendance(student);
                    const isAbsent = currentAttendance.absent === '1';
                    const isDelay = currentAttendance.delay === '1';
                    const isLastStudent = idx === students.length - 1;

                    return (
                      <div
                        key={student.id}
                        ref={isLastStudent ? lastStudentRef : undefined}
                        className={`rounded-3xl border p-4 transition-all ${
                          isAbsent
                            ? 'border-red-200 bg-red-50/70 dark:border-red-900/60 dark:bg-red-950/25'
                            : isDelay
                              ? 'border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/25'
                              : 'border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-base font-bold text-slate-900 dark:text-zinc-100">
                                {student.Fname} {student.Lname}
                              </p>
                              {isAbsent ? (
                                <Badge variant="destructive">غایب</Badge>
                              ) : isDelay ? (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-100">
                                  تاخیر
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">
                                  حاضر
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">کد دانش‌آموز: {student.StudentCode || '-'}</p>
                          </div>

                          {(isAbsent || isDelay) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => clearAttendanceStatus(student)}
                              className="self-start rounded-full text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200"
                            >
                              <CheckCircle2 className="ml-1 h-4 w-4" />
                              حاضر
                            </Button>
                          )}
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <Button
                            type="button"
                            variant={isAbsent ? 'destructive' : 'outline'}
                            onClick={() => markAbsent(student)}
                            className="h-11 rounded-2xl"
                          >
                            <UserX className="ml-2 h-4 w-4" />
                            ثبت غیبت
                          </Button>

                          <Button
                            type="button"
                            variant={isDelay ? 'secondary' : 'outline'}
                            onClick={() => markDelay(student)}
                            className={`h-11 rounded-2xl ${isDelay ? 'bg-amber-400 text-white hover:bg-amber-500' : ''}`}
                          >
                            <Clock3 className="ml-2 h-4 w-4" />
                            ثبت تاخیر
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => clearAttendanceStatus(student)}
                            disabled={!isAbsent && !isDelay}
                            className="h-11 rounded-2xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200"
                          >
                            <CheckCircle2 className="ml-2 h-4 w-4" />
                            لغو وضعیت
                          </Button>
                        </div>

                        {isAbsent && (
                          <div className="mt-3 rounded-2xl bg-white/80 p-3 ring-1 ring-red-100 dark:bg-zinc-900/80 dark:ring-red-900/40">
                            <Label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-200">دلیل غیبت</Label>
                            <Input
                              placeholder="مثلاً بیماری، مأموریت یا سفر"
                              value={currentAttendance.absent_reason || ''}
                              onChange={event => setAbsentReason(student.id, event.target.value)}
                              className="h-11 rounded-2xl border-red-200 bg-white dark:border-red-900/60 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                            />
                          </div>
                        )}

                        {isDelay && (
                          <div className="mt-3 rounded-2xl bg-white/80 p-3 ring-1 ring-amber-100 dark:bg-zinc-900/80 dark:ring-amber-900/40">
                            <Label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-200">ساعت تاخیر</Label>
                            <Input
                              type="time"
                              step="1"
                              value={currentAttendance.delay_time ? currentAttendance.delay_time.slice(0, 5) : ''}
                              onChange={event => setDelayTime(student.id, event.target.value)}
                              className="h-11 rounded-2xl border-amber-200 bg-white dark:border-amber-900/60 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {loadingStudents && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                      <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">در حال بارگذاری قرآن‌آموزان...</p>
                    </div>
                  )}

                  {!loadingStudents && students.length === 0 && !hasMore && (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-400">
                      دانش‌آموزی یافت نشد.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedDate && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 sm:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-2">
            <Button variant="outline" onClick={handleBack} className="h-11 flex-1">
              بازگشت
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loadingStudents || students.length === 0 || submitting}
              className="h-11 flex-[1.4] bg-green-600 text-white hover:bg-green-700"
            >
              {submitting ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="ml-2 h-4 w-4" />
              )}
              ثبت نهایی
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
