"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { JuzService, JuzAssignmentWithRecord, JuzStudentReadingRecord, getDayName } from "@/lib/services/juz.service";
import { StudentService, Student } from "@/lib/services/student.service";
import { useAuth } from "@/lib/context/auth.context";
import { PageTransition } from "@/components/ui/page-transition";
import { MultiSelectComboBox } from "@/components/ui/MultiSelectComboBox";
import DateSelector from "../../optimizedNumbers/add/DateSelector";
import { DateObject } from "react-multi-date-picker";
import { ListChecks, CheckCircle2, XCircle, Loader2, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, BookX } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;

export default function TaskListPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<(string | number)[]>([]);
  const [fromDate, setFromDate] = useState<DateObject | null>(null);
  const [toDate, setToDate] = useState<DateObject | null>(null);
  const [assignments, setAssignments] = useState<JuzAssignmentWithRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingAction, setTogglingAction] = useState<{ id: number; type: "verify" | "reject" } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const firstLoadDone = useRef(false);

  useEffect(() => {
    if (accessToken) {
      StudentService.getStudents({ per_page: 200 }, accessToken)
        .then((res: unknown) => {
          const data = res as { data: { data: Student[] } };
          setStudents(data.data?.data || []);
        })
        .catch(() => {});
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken && !firstLoadDone.current) {
      firstLoadDone.current = true;
      fetchAssignments(1);
    }
  }, [accessToken]);

  const studentOptions = useMemo(
    () => students.map((s) => ({ label: `${s.Fname} ${s.Lname}`, value: s.id })),
    [students]
  );

  const fetchAssignments = useCallback(async (p?: number) => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const currentPage = p ?? page;
      const params: Record<string, string | number | boolean> = {
        per_page: PAGE_SIZE,
        page: currentPage,
      };
      if (selectedStudentIds.length === 1) {
        params.student_id = Number(selectedStudentIds[0]);
      }
      if (fromDate) {
        params.date_from = fromDate.toDate().toISOString().slice(0, 10);
      }
      if (toDate) {
        params.date_to = toDate.toDate().toISOString().slice(0, 10);
      }
      if (filterStatus !== "all") {
        params.status = filterStatus;
      }
      const res = await JuzService.getAssignmentsWithStatus(params);
      if (res.status === "success") {
        const raw = res.data as { data: JuzAssignmentWithRecord[]; current_page: number; last_page: number };
        let items: JuzAssignmentWithRecord[];
        if (Array.isArray(raw)) {
          items = raw;
        } else {
          items = raw.data || [];
          setTotalPages(raw.last_page || 1);
        }
        items = items.map((i) => {
          const raw = i as Record<string, unknown>;
          return {
            ...i,
            readingRecord: (raw.reading_record as JuzStudentReadingRecord | null) ?? raw.readingRecord as JuzStudentReadingRecord | null,
          } as JuzAssignmentWithRecord;
        });
        setAssignments(items);
      }
    } catch {
      toast({ title: "خطا", description: "بارگذاری با مشکل مواجه شد", type: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedStudentIds, fromDate, toDate, filterStatus, page]);

  useEffect(() => {
    if (firstLoadDone.current) {
      setPage(1);
      fetchAssignments(1);
    }
  }, [selectedStudentIds, fromDate, toDate, filterStatus]);

  function clearFilters() {
    setSelectedStudentIds([]);
    setFromDate(null);
    setToDate(null);
    setFilterStatus("all");
  }

  function toggleExpand(studentId: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  const grouped = useMemo(() => {
    const map = new Map<number, { student: { id: number; Fname: string; Lname: string }; items: JuzAssignmentWithRecord[] }>();
    for (const a of assignments) {
      const sid = a.student_id;
      if (!map.has(sid)) {
        map.set(sid, { student: a.student ?? { id: sid, Fname: "نامشخص", Lname: "" }, items: [] });
      }
      map.get(sid)!.items.push(a);
    }
    return Array.from(map.values());
  }, [assignments]);

  async function handleVerify(recordId: number) {
    setTogglingAction({ id: recordId, type: "verify" });
    try {
      await JuzService.verifyReadingRecord(recordId);
      setAssignments((prev) =>
        prev.map((a) =>
          a.readingRecord?.id === recordId
            ? { ...a, readingRecord: { ...a.readingRecord, is_verified: 1 } }
            : a
        )
      );
      toast({ title: "تأیید شد", type: "default" });
    } catch {
      toast({ title: "خطا", description: "تأیید انجام نشد", type: "destructive" });
    } finally {
      setTogglingAction(null);
    }
  }

  async function handleReject(recordId: number) {
    setTogglingAction({ id: recordId, type: "reject" });
    try {
      await JuzService.rejectReadingRecord(recordId);
      setAssignments((prev) =>
        prev.map((a) =>
          a.readingRecord?.id === recordId
            ? { ...a, readingRecord: { ...a.readingRecord, is_verified: 0 } }
            : a
        )
      );
      toast({ title: "رد شد", type: "destructive" });
    } catch {
      toast({ title: "خطا", description: "رد انجام نشد", type: "destructive" });
    } finally {
      setTogglingAction(null);
    }
  }

  function renderStatus(item: JuzAssignmentWithRecord) {
    const rr = item.readingRecord;

    if (!rr) {
      return (
        <span className="flex items-center gap-1 text-[11px] text-zinc-400">
          <BookX className="h-3.5 w-3.5" />
          خوانده نشده
        </span>
      );
    }

    if (rr.is_verified == true || rr.is_verified === 1) {
      return (
        <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          تأیید شده
        </span>
      );
    }

    if (rr.is_verified == false) {
      return (
        <span className="flex items-center gap-1 text-[11px] text-red-500 dark:text-red-400">
          <XCircle className="h-3.5 w-3.5" />
          رد شده
        </span>
      );
    }

    return (
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={togglingAction?.id === rr.id}
          onClick={() => handleVerify(rr.id)}
          className={cn(
            "h-7 text-xs gap-1 transition-all",
            togglingAction?.id === rr.id
              ? "opacity-50"
              : "text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
          )}
        >
          {togglingAction?.id === rr.id && togglingAction?.type === "verify" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          تأیید
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={togglingAction?.id === rr.id}
          onClick={() => handleReject(rr.id)}
          className={cn(
            "h-7 text-xs gap-1 transition-all",
            togglingAction?.id === rr.id
              ? "opacity-50"
              : "text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
          )}
        >
          {togglingAction?.id === rr.id && togglingAction?.type === "reject" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          رد
        </Button>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-emerald-100 p-1.5 sm:p-2">
            <ListChecks className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-zinc-800 dark:text-zinc-200">
              لیست تکالیف جزء خوانی
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              مشاهده و تأیید تکالیف تعیین شده
            </div>
          </div>
        </div>

        <Card className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 text-right">
                دانش آموز
              </label>
              <MultiSelectComboBox
                options={studentOptions}
                value={selectedStudentIds}
                onChange={setSelectedStudentIds}
                placeholder="انتخاب دانش آموز..."
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
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 text-right">
                وضعیت
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <option value="all">همه</option>
                <option value="unread">خوانده نشده</option>
                <option value="pending">در انتظار تأیید</option>
                <option value="verified">تأیید شده</option>
                <option value="rejected">رد شده</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              پاک کردن فیلتر
            </Button>
          </div>
        </Card>

        {loading && assignments.length === 0 && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="h-16 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-sm animate-pulse" />
            ))}
          </div>
        )}

        {!loading && assignments.length === 0 && (
          <Card className="p-12 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md">
            <p className="text-center text-zinc-400">هیچ تکلیفی یافت نشد</p>
          </Card>
        )}

        {assignments.length > 0 && (
          <>
            {/* Desktop table — grouped by student with expandable rows */}
            <div className="hidden sm:block">
              <Card className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                        <th className="text-right px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300 w-64">دانش آموز</th>
                        <th className="text-center px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">جزء</th>
                        <th className="text-center px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">روز</th>
                        <th className="text-center px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">تاریخ قرائت</th>
                        <th className="text-center px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {grouped.map((group) => {
                        const isExpanded = expandedIds.has(group.student.id);
                        const total = group.items.length;
                        const readCount = group.items.filter((i) => i.readingRecord).length;
                        const verifiedCount = group.items.filter((i) => i.readingRecord && (i.readingRecord.is_verified == true || i.readingRecord.is_verified === 1)).length;
                        return (
                          <React.Fragment key={group.student.id}>
                            {/* Student header row */}
                            <tr
                              className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors select-none"
                              onClick={() => toggleExpand(group.student.id)}
                            >
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                                    {group.student.Fname?.charAt(0) || "?"}
                                  </div>
                                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                    {group.student.Fname} {group.student.Lname}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-zinc-500 text-[12px]" colSpan={3}>
                                {readCount}/{total} خوانده شده
                                {verifiedCount > 0 && ` • ${verifiedCount} تأیید شده`}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 inline-block text-zinc-400 transition-transform",
                                    isExpanded && "rotate-180"
                                  )}
                                />
                              </td>
                            </tr>
                            {/* Detail rows (shown when expanded) */}
                            {isExpanded && group.items.map((item) => {
                              const rr = item.readingRecord;
                              return (
                                <tr key={item.id} className="bg-zinc-50/50 dark:bg-zinc-800/20 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition-colors">
                                  <td className="px-4 py-2.5 text-right pr-12">
                                    <span className="text-[12px] text-zinc-500">جزء</span>
                                  </td>
                                  <td className="px-4 py-2.5 text-center text-zinc-700 dark:text-zinc-300 font-medium">
                                    {item.juz_number}
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <span className="text-[11px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                      {getDayName(item.day_of_week)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-center text-zinc-600 dark:text-zinc-400 text-[13px]">
                                    {rr ? new Date(rr.read_date).toLocaleDateString("fa-IR") : "—"}
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    {renderStatus(item)}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Mobile — grouped by student with expandable cards */}
            <div className="block sm:hidden space-y-3">
              {grouped.map((group) => {
                const isExpanded = expandedIds.has(group.student.id);
                const total = group.items.length;
                const readCount = group.items.filter((i) => i.readingRecord).length;
                return (
                  <Card
                    key={group.student.id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                      onClick={() => toggleExpand(group.student.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-sm font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                          {group.student.Fname?.charAt(0) || "?"}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                            {group.student.Fname} {group.student.Lname}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {readCount}/{total} خوانده شده
                          </div>
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-zinc-400 transition-transform shrink-0",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </div>
                    {isExpanded && (
                      <div className="border-t border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                        {group.items.map((item) => {
                          const rr = item.readingRecord;
                          return (
                            <div key={item.id} className="px-4 py-2.5 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                  جزء {item.juz_number}
                                </span>
                                <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                  {getDayName(item.day_of_week)}
                                </span>
                                {rr && (
                                  <span className="text-[11px] text-zinc-400">
                                    {new Date(rr.read_date).toLocaleDateString("fa-IR")}
                                  </span>
                                )}
                              </div>
                              {renderStatus(item)}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => {
                    const next = page - 1;
                    setPage(next);
                    fetchAssignments(next);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="text-zinc-400 px-1">...</span>
                      )}
                      <Button
                        variant={p === page ? "default" : "outline"}
                        size="sm"
                        disabled={loading}
                        onClick={() => {
                          setPage(p);
                          fetchAssignments(p);
                        }}
                        className={cn(
                          "min-w-[36px]",
                          p === page && "bg-emerald-600 hover:bg-emerald-700 text-white"
                        )}
                      >
                        {p}
                      </Button>
                    </React.Fragment>
                  ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    fetchAssignments(next);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
