"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { JuzService } from "@/lib/services/juz.service";
import { StudentService, Student } from "@/lib/services/student.service";
import { useAuth } from "@/lib/context/auth.context";
import { PageTransition } from "@/components/ui/page-transition";
import { MultiSelectComboBox } from "@/components/ui/MultiSelectComboBox";
import { JuzMultiSelectCell } from "@/components/ui/JuzMultiSelectCell";
import DateSelector from "../../optimizedNumbers/add/DateSelector";
import {
  BookMarked,
  Save,
  Loader2,
  Download,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { DateObject } from "react-multi-date-picker";

const dayLabels = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه"];

interface DayInfo {
  dateStr: string;
  greg: Date;
  dayOfWeek: number;
}

function jsDayToAssignmentDay(jsDay: number): number | null {
  const map: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4 };
  return map[jsDay] ?? null;
}

function formatJalaliDate(date: Date): string {
  const y = date.toLocaleDateString("fa-IR", { year: "numeric" });
  const m = date.toLocaleDateString("fa-IR", { month: "2-digit" });
  const d = date.toLocaleDateString("fa-IR", { day: "2-digit" });
  return `${y}/${m}/${d}`;
}

const StudentCard = React.memo(function StudentCard({
  student,
  days,
  studentValues,
  studentProgress,
  onCellChange,
}: {
  student: Student;
  days: DayInfo[];
  studentValues: Record<string, number[]> | undefined;
  studentProgress: Record<string, number[]> | undefined;
  onCellChange: (studentId: number, dateStr: string, next: number[]) => void;
}) {
  const allDaysDone = days.every((day) => {
    const val = studentValues?.[day.dateStr];
    if (!val || val.length === 0) return false;
    const done = studentProgress?.[day.dateStr] || [];
    return val.every((j) => done.includes(j));
  });
  const someDaysDone = days.some((day) => {
    const val = studentValues?.[day.dateStr];
    if (!val || val.length === 0) return false;
    const done = studentProgress?.[day.dateStr] || [];
    return done.some((j) => val.includes(j));
  });

  return (
    <Card className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 text-sm font-bold">
            {student.Fname?.charAt(0) || "?"}
          </div>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
            {student.Fname} {student.Lname}
          </span>
        </div>
        <div>
          {days.length > 0 && allDaysDone && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              کامل
            </span>
          )}
          {days.length > 0 && someDaysDone && !allDaysDone && (
            <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              نیمه
            </span>
          )}
        </div>
      </div>
      <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
        {days.map((day) => {
          const val = studentValues?.[day.dateStr] || [];
          const done = studentProgress?.[day.dateStr] || [];
          const allDone = val.length > 0 && val.every((j) => done.includes(j));
          const someDone = val.length > 0 && done.some((j) => val.includes(j));
          return (
            <div
              key={day.dateStr}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className="shrink-0 w-16 text-right">
                <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {dayLabels[day.dayOfWeek]}
                </div>
                <div className="text-[10px] text-zinc-400">{day.dateStr}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <JuzMultiSelectCell
                      value={val}
                      onChange={(next) =>
                        onCellChange(student.id, day.dateStr, next)
                      }
                    />
                  </div>
                  <div className="shrink-0 w-10 text-center">
                    {allDone && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                    )}
                    {someDone && !allDone && (
                      <Clock className="h-4 w-4 text-amber-500 mx-auto" />
                    )}
                    {!someDone && !allDone && val.length > 0 && (
                      <span className="text-[10px] text-zinc-400">
                        {val.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
});

export default function JuzAssignmentsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<
    (string | number)[]
  >([]);
  const [fromDate, setFromDate] = useState<DateObject | null>(null);
  const [toDate, setToDate] = useState<DateObject | null>(null);
  const [values, setValues] = useState<
    Record<string, Record<string, number[]>>
  >({});
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progressMap, setProgressMap] = useState<
    Record<string, Record<string, number[]>>
  >({});

  useEffect(() => {
    if (accessToken) fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    clearData();
  }, [fromDate, toDate, selectedStudentIds]);

  async function fetchStudents() {
    if (!accessToken) return;
    setStudentsLoading(true);
    try {
      const res = (await StudentService.getStudents(
        { per_page: 50 },
        accessToken
      )) as unknown as { data: { data: Student[] } };
      const arr = res.data?.data || [];
      console.log("[JuzAssignments] students loaded:", arr.length);
      setStudents(arr);
    } catch (e) {
      console.error("[JuzAssignments] fetchStudents error:", e);
    } finally {
      setStudentsLoading(false);
    }
  }

  const days = useMemo(() => {
    if (!fromDate || !toDate) return [];
    const fromGreg = fromDate.toDate();
    const toGreg = toDate.toDate();
    if (!fromGreg || !toGreg) return [];

    const result: Array<{ dateStr: string; greg: Date; dayOfWeek: number }> =
      [];
    const current = new Date(fromGreg);
    while (current <= toGreg) {
      const dow = jsDayToAssignmentDay(current.getDay());
      if (dow !== null) {
        result.push({
          dateStr: formatJalaliDate(current),
          greg: new Date(current),
          dayOfWeek: dow,
        });
      }
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [fromDate, toDate]);

  const selectedStudents = useMemo(
    () => students.filter((s) => selectedStudentIds.includes(s.id)),
    [students, selectedStudentIds]
  );

  const studentOptions = useMemo(
    () =>
      students.map((s) => ({ label: `${s.Fname} ${s.Lname}`, value: s.id })),
    [students]
  );

  const totalAssignments = useMemo(() => {
    let count = 0;
    for (const studentId of selectedStudentIds) {
      const studentMap = values[`${studentId}`];
      if (!studentMap) continue;
      for (const day of days) {
        count += (studentMap[day.dateStr] || []).length;
      }
    }
    return count;
  }, [selectedStudentIds, days, values]);

  function clearData() {
    setValues({});
    setProgressMap({});
  }

  const searchedTermsRef = useRef(new Set<string>());

  const handleSearchStudents = useCallback(
    async (term: string) => {
      const trimmed = term.trim();
      if (!accessToken || !trimmed) return;
      if (searchedTermsRef.current.has(trimmed)) return;
      searchedTermsRef.current.add(trimmed);
      setSearchLoading(true);
      try {
        const res = (await StudentService.getStudents(
          { search: trimmed, per_page: 50 },
          accessToken
        )) as unknown as { data: { data: Student[] } };
        const arr = res.data?.data || [];
        setStudents((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const merged = [...prev];
          for (const s of arr) {
            if (!existingIds.has(s.id)) {
              merged.push(s);
              existingIds.add(s.id);
            }
          }
          return merged;
        });
      } catch (e) {
        console.error("[JuzAssignments] search error:", e);
      } finally {
        setSearchLoading(false);
      }
    },
    [accessToken]
  );

  const setCellValue = useCallback(
    (studentId: number, dateStr: string, juz: number[]) => {
      setValues((prev) => {
        const key = `${studentId}`;
        return { ...prev, [key]: { ...prev[key], [dateStr]: juz } };
      });
    },
    []
  );

  function getCellValue(studentId: number, dateStr: string): number[] {
    return values[`${studentId}`]?.[dateStr] || [];
  }

  async function handleLoad() {
    if (selectedStudentIds.length === 0 || days.length === 0) return;
    setLoadingData(true);
    try {
      const [assignmentsRes, logsRes] = await Promise.all([
        JuzService.getAssignments({ is_active: true, paginate: "off" }),
        JuzService.getReadingLogs({
          date_from: days[0].greg.toISOString().slice(0, 10),
          date_to: days[days.length - 1].greg.toISOString().slice(0, 10),
          paginate: "off",
        }),
      ]);

      const allAssignments = (
        Array.isArray(assignmentsRes.data)
          ? assignmentsRes.data
          : assignmentsRes.data?.data || []
      ) as Array<{
        student_id: number;
        juz_number: number;
        day_of_week: number;
      }>;
      const allLogs = (
        Array.isArray(logsRes.data) ? logsRes.data : logsRes.data?.data || []
      ) as Array<{ student_id: number; juz_number: number; read_date: string }>;

      const newValues: Record<string, Record<string, number[]>> = {};
      const newProgress: Record<string, Record<string, number[]>> = {};

      for (const studentId of selectedStudentIds) {
        const sid = `${studentId}`;

        for (const day of days) {
          const matchingAssignments = allAssignments.filter(
            (a) =>
              a.student_id === Number(studentId) &&
              a.day_of_week === day.dayOfWeek
          );
          if (matchingAssignments.length > 0) {
            if (!newValues[sid]) newValues[sid] = {};
            newValues[sid][day.dateStr] = matchingAssignments.map(
              (a) => a.juz_number
            );
          }

          const dateStr = day.greg.toISOString().slice(0, 10);
          const dayLogs = allLogs.filter(
            (l) =>
              l.student_id === Number(studentId) &&
              l.read_date?.startsWith(dateStr)
          );
          if (dayLogs.length > 0) {
            if (!newProgress[sid]) newProgress[sid] = {};
            newProgress[sid][day.dateStr] = dayLogs.map((l) => l.juz_number);
          }
        }
      }

      setValues(newValues);
      setProgressMap(newProgress);
      toast({ title: "موفق", description: "برنامه و پیشرفت بارگذاری شد" });
    } catch (err: unknown) {
      toast({
        title: "خطا",
        description: err instanceof Error ? err.message : "خطا در بارگذاری",
        type: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  }

  async function handleSave() {
    if (selectedStudentIds.length === 0 || days.length === 0) return;

    const grouped: Record<
      number,
      Array<{
        juz_number: number;
        day_of_week: number;
        dateStr: string;
      }>
    > = {};

    for (const studentId of selectedStudentIds) {
      const sid = Number(studentId);
      for (const day of days) {
        const juzes = getCellValue(sid, day.dateStr);
        for (const juz of juzes) {
          if (!grouped[sid]) grouped[sid] = [];
          grouped[sid].push({
            juz_number: juz,
            day_of_week: day.dayOfWeek,
            dateStr: day.dateStr,
          });
        }
      }
    }

    const flatAssignments = Object.values(grouped).flat();
    if (flatAssignments.length === 0) {
      toast({
        title: "خطا",
        description: "حداقل یک جزء برای یک روز انتخاب کنید",
        type: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const dateFromStr = days[0].greg.toISOString().slice(0, 10);
      const dateToStr = days[days.length - 1].greg.toISOString().slice(0, 10);
      const createdTasks: Array<{ studentId: number; taskId: number }> = [];

      for (const studentId of Object.keys(grouped).map(Number)) {
        const items = grouped[studentId];
        const uniqueJuzes = [...new Set(items.map((i) => i.juz_number))].sort(
          (a, b) => a - b
        );
        const taskRes = await JuzService.createStudentTask({
          student_id: studentId,
          date_from: dateFromStr,
          date_to: dateToStr,
          juz_list: uniqueJuzes,
        });
        if (taskRes.status === "success" && taskRes.data?.id) {
          createdTasks.push({ studentId, taskId: taskRes.data.id });
        }
      }

      const assignmentsPayload = createdTasks.flatMap(({ studentId, taskId }) =>
        grouped[studentId].map((item) => ({
          student_id: studentId,
          juz_number: item.juz_number,
          day_of_week: item.day_of_week,
          juz_student_task_id: taskId,
        }))
      );

      const res = await JuzService.bulkCreateAssignments(assignmentsPayload);
      if (res.status === "success") {
        toast({
          title: "موفق",
          description: `${assignmentsPayload.length} تکلیف برای ${createdTasks.length} قرآن آموز ذخیره شد`,
        });
        setValues({});
      }
    } catch (err: unknown) {
      toast({
        title: "خطا",
        description: err instanceof Error ? err.message : "خطا در ذخیره",
        type: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 p-1.5 sm:p-2">
              <BookMarked className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-zinc-800 dark:text-zinc-200">
                تنظیم برنامه جزء خوانی
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                انتخاب قرآن آموزان و تعیین جزء به صورت روزانه
              </div>
            </div>
          </div>
        </div>

        <Card className="p-4 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 text-right">
                قرآن آموزان
              </label>
              <MultiSelectComboBox
                options={studentOptions}
                value={selectedStudentIds}
                onChange={setSelectedStudentIds}
                placeholder={
                  studentsLoading
                    ? "در حال بارگذاری..."
                    : "جستجو و انتخاب قرآن آموزان..."
                }
                disabled={studentsLoading}
                onSearch={handleSearchStudents}
                searchLoading={searchLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 text-right">
                از تاریخ
              </label>
              <DateSelector selectedDate={fromDate} onChange={setFromDate} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 text-right">
                تا تاریخ
              </label>
              <DateSelector selectedDate={toDate} onChange={setToDate} />
            </div>
          </div>
        </Card>

        {selectedStudentIds.length > 0 && days.length > 0 && (
          <>
            {/* ─── Desktop: Table ─── */}
            <Card className="hidden lg:block bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                      <th className="sticky right-0 bg-zinc-50 dark:bg-zinc-800/50 z-10 text-right px-3 py-3 font-semibold text-zinc-600 dark:text-zinc-300 min-w-[140px] border-l border-zinc-100 dark:border-zinc-800">
                        قرآن آموز
                      </th>
                      {days.map((day) => (
                        <th
                          key={day.dateStr}
                          className="text-center px-2 py-3 font-semibold text-zinc-600 dark:text-zinc-300 min-w-[90px]"
                        >
                          <div className="text-xs">
                            {dayLabels[day.dayOfWeek]}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {day.dateStr}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {selectedStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="sticky right-0 bg-white dark:bg-zinc-900 z-10 text-right px-3 py-2.5 font-medium text-zinc-800 dark:text-zinc-200 border-l border-zinc-100 dark:border-zinc-800">
                          {student.Fname} {student.Lname}
                        </td>
                        {days.map((day) => {
                          const val = getCellValue(student.id, day.dateStr);
                          const done =
                            progressMap[`${student.id}`]?.[day.dateStr] || [];
                          const allDone =
                            val.length > 0 &&
                            val.every((j) => done.includes(j));
                          const someDone =
                            val.length > 0 && done.some((j) => val.includes(j));
                          return (
                            <td
                              key={day.dateStr}
                              className="px-2 py-2.5 text-center align-middle"
                            >
                              <div className="flex items-center justify-center">
                                <div className="relative">
                                  {allDone && (
                                    <div className="absolute -top-1.5 left-0 z-10">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    </div>
                                  )}
                                  {someDone && !allDone && (
                                    <div className="absolute -top-1.5 left-0 z-10">
                                      <Clock className="h-4 w-4 text-amber-500" />
                                    </div>
                                  )}
                                  <JuzMultiSelectCell
                                    value={val}
                                    onChange={(next) =>
                                      setCellValue(
                                        student.id,
                                        day.dateStr,
                                        next
                                      )
                                    }
                                  />
                                </div>
                              </div>
                              {allDone && (
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                                  تکمیل
                                </div>
                              )}
                              {someDone && !allDone && (
                                <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                                  {done.length}/{val.length}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* ─── Mobile: Student Cards ─── */}
            <div className="block lg:hidden space-y-4">
              {selectedStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  days={days}
                  studentValues={values[`${student.id}`]}
                  studentProgress={progressMap[`${student.id}`]}
                  onCellChange={setCellValue}
                />
              ))}
            </div>

            {/* ─── Footer (shared desktop + mobile) ─── */}
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                <span className="text-sm text-zinc-500">
                  {selectedStudentIds.length} قرآن آموز × {days.length} روز ={" "}
                  {totalAssignments} جزء
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={handleLoad}
                    disabled={
                      loadingData ||
                      selectedStudentIds.length === 0 ||
                      days.length === 0
                    }
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    {loadingData ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="ml-2 h-4 w-4" />
                    )}
                    بارگذاری برنامه
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || totalAssignments === 0}
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    {saving && (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="ml-2 h-4 w-4" />
                    ذخیره تکالیف
                  </Button>
                </div>
              </div>
            </Card>
          </>
        )}

        {selectedStudentIds.length === 0 && (
          <Card className="p-12 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md">
            <p className="text-center text-zinc-400">
              قرآن آموزان و بازه زمانی را انتخاب کنید
            </p>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
