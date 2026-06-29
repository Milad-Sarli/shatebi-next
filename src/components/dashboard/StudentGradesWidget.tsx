"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  optimizedNumberService,
  OptimizedNumber,
} from "@/lib/services/number.service";
import {
  GraduationCap,
  BookOpen,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Filter,
  X,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth.context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MasterService, Master } from "@/lib/services/master.service";

interface Dars {
  id: number;
  title: string;
}

export default function StudentGradesWidget() {
  const { accessToken, user } = useAuth();
  const [studentId, setStudentId] = React.useState<number | null>(null);
  const [studentName, setStudentName] = React.useState("");
  const [autoDetecting, setAutoDetecting] = React.useState(true);

  const [masters, setMasters] = React.useState<Master[]>([]);
  const [droosList, setDroosList] = React.useState<Dars[]>([]);

  const [showFilters, setShowFilters] = React.useState(false);
  const [selectedMaster, setSelectedMaster] = React.useState("all");
  const [selectedDars, setSelectedDars] = React.useState("all");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  // Auto-detect student by matching logged-in user
  React.useEffect(() => {
    if (!accessToken || !user?.id) return;
    setAutoDetecting(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/students?per_page=500&paginate=off`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    )
      .then((r) => r.json())
      .then((res) => {
        const raw = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(raw) ? raw : [];
        const match =
          list.find(
            (s: { user_id?: number; Mellicode?: string; Phone?: string }) =>
              s.user_id === user.id ||
              s.Mellicode === user.username ||
              s.Phone === user.phone
          ) || null;
        if (match) {
          setStudentId(match.id);
          setStudentName(`${match.Fname} ${match.Lname}`);
        }
      })
      .catch(() => {})
      .finally(() => setAutoDetecting(false));
  }, [accessToken, user]);

  // Fetch masters and droos
  React.useEffect(() => {
    if (!accessToken) return;
    MasterService.getAllMasters(accessToken)
      .then(setMasters)
      .catch(() => {});
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/droos?per_page=500`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((data) => {
        const all = Array.isArray(data) ? data : data?.data ?? [];
        setDroosList(
          Array.isArray(all)
            ? all.map((d: { id: number; title: string }) => ({ id: d.id, title: d.title }))
            : []
        );
      })
      .catch(() => {});
  }, [accessToken]);

  // Grades
  const [grades, setGrades] = React.useState<OptimizedNumber[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const perPage = 8;

  const fetchGrades = React.useCallback(
    async (sid: number, p: number) => {
      if (!accessToken) return;
      setLoading(true);
      try {
        const res = await optimizedNumberService.getAll(
          accessToken,
          p,
          perPage,
          "",
          selectedMaster,
          String(sid),
          "all",
          startDate || null,
          endDate || null
        );
        setGrades(res?.data ?? []);
        setPage(res?.current_page ?? 1);
        setTotalPages(res?.last_page ?? 1);
        setTotal(res?.total ?? 0);
      } catch {
        setGrades([]);
      } finally {
        setLoading(false);
      }
    },
    [accessToken, selectedMaster, startDate, endDate]
  );

  React.useEffect(() => {
    if (studentId) {
      setPage(1);
      fetchGrades(studentId, 1);
    }
  }, [studentId, fetchGrades]);

  const handlePageChange = (p: number) => {
    if (studentId) {
      setPage(p);
      fetchGrades(studentId, p);
    }
  };

  const clearFilters = () => {
    setSelectedMaster("all");
    setSelectedDars("all");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters =
    selectedMaster !== "all" ||
    selectedDars !== "all" ||
    startDate !== "" ||
    endDate !== "";

  const scoreColor = (s: number) =>
    s >= 90
      ? "text-green-600 dark:text-green-400"
      : s >= 80
        ? "text-blue-600 dark:text-blue-400"
        : s >= 70
          ? "text-amber-600 dark:text-amber-400"
          : "text-red-600 dark:text-red-400";

  return (
    <Card className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
          <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            {studentName ? `نمرات ${studentName}` : "نمرات من"}
          </h3>
          <p className="text-[11px] text-zinc-500 truncate">
            {studentName
              ? `${total} نمره`
              : autoDetecting
                ? "در حال تشخیص..."
                : "پروفایل دانش‌آموزی یافت نشد"}
          </p>
        </div>
        {studentId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 h-8 px-2",
              showFilters && "bg-zinc-100 dark:bg-zinc-800"
            )}
          >
            <Filter className="h-3.5 w-3.5 ml-1" />
            <span className="hidden sm:inline text-xs">فیلتر</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1" />
            )}
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && studentId && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-3 pt-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    از تاریخ
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs py-1.5 px-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    تا تاریخ
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs py-1.5 px-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-zinc-400">استاد</label>
                  <Select value={selectedMaster} onValueChange={setSelectedMaster}>
                    <SelectTrigger className="h-8 text-xs bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                      <SelectValue placeholder="همه اساتید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه اساتید</SelectItem>
                      {masters.map((m) => (
                        <SelectItem key={m.id} value={m.id.toString()}>
                          {m.fullname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-zinc-400">درس</label>
                  <Select value={selectedDars} onValueChange={setSelectedDars}>
                    <SelectTrigger className="h-8 text-xs bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                      <SelectValue placeholder="همه دروس" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه دروس</SelectItem>
                      {droosList.map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          {d.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-[10px] text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  پاک کردن فیلترها
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="px-0">
        {autoDetecting || loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : !studentId ? (
          <div className="py-10 text-center text-zinc-400">
            <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">پروفایل دانش‌آموزی یافت نشد</p>
          </div>
        ) : grades.length === 0 ? (
          <div className="py-10 text-center text-zinc-400">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">هیچ نمره‌ای ثبت نشده است</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="text-right px-3 py-2.5 font-medium text-zinc-500 whitespace-nowrap">تاریخ</th>
                    <th className="text-right px-3 py-2.5 font-medium text-zinc-500 whitespace-nowrap">درس</th>
                    <th className="text-center px-2 py-2.5 font-medium text-zinc-500">حفظ</th>
                    <th className="text-center px-2 py-2.5 font-medium text-zinc-500">دقت</th>
                    <th className="text-center px-2 py-2.5 font-medium text-zinc-500">تجوید</th>
                    <th className="text-center px-2 py-2.5 font-medium text-zinc-500">صوت</th>
                    <th className="text-center px-2 py-2.5 font-medium text-zinc-500">نمره</th>
                    <th className="text-right px-3 py-2.5 font-medium text-zinc-500 whitespace-nowrap">استاد</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((g, idx) => {
                    const totalScore =
                      g.number ||
                      (g.hefz + (g.details || 0) + (g.tajvid || 0) + (g.sout || 0));
                    return (
                      <tr
                        key={g.id}
                        className={cn(
                          "border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors",
                          idx % 2 === 1 && "bg-zinc-50/50 dark:bg-zinc-800/20"
                        )}
                      >
                        <td className="px-3 py-2.5 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                          {g.date ? new Date(g.date).toLocaleDateString("fa-IR") : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-zinc-700 dark:text-zinc-300 max-w-[120px] truncate">
                          {g.dars?.title || g.droos?.title || "—"}
                        </td>
                        <td className="px-2 py-2.5 text-center tabular-nums">{g.hefz ?? "—"}</td>
                        <td className="px-2 py-2.5 text-center tabular-nums">{g.details ?? "—"}</td>
                        <td className="px-2 py-2.5 text-center tabular-nums">{g.tajvid ?? "—"}</td>
                        <td className="px-2 py-2.5 text-center tabular-nums">{g.sout ?? "—"}</td>
                        <td className="px-2 py-2.5 text-center">
                          <span className={cn("font-bold tabular-nums", scoreColor(totalScore))}>
                            {totalScore}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-zinc-600 dark:text-zinc-400 text-[10px] sm:text-xs">
                          {g.masterTeacher?.fullname || g.master_teacher?.fullname || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="sm:hidden space-y-2 px-4 py-3">
              <AnimatePresence>
                {grades.map((g, idx) => {
                  const totalScore =
                    g.number ||
                    (g.hefz + (g.details || 0) + (g.tajvid || 0) + (g.sout || 0));
                  return (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                      className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-zinc-500">
                          {g.date ? new Date(g.date).toLocaleDateString("fa-IR") : "—"}
                        </span>
                        <span className={cn("text-xs font-bold tabular-nums", scoreColor(totalScore))}>
                          نمره: {totalScore}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                        {g.dars?.title || g.droos?.title || "—"}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        استاد: {g.masterTeacher?.fullname || g.master_teacher?.fullname || "—"}
                      </p>
                      <div className="grid grid-cols-4 gap-1 mt-2">
                        {[
                          { label: "حفظ", value: g.hefz },
                          { label: "دقت", value: g.details },
                          { label: "تجوید", value: g.tajvid },
                          { label: "صوت", value: g.sout },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="text-center bg-white dark:bg-zinc-900 rounded py-1"
                          >
                            <p className="text-[8px] text-zinc-400">{item.label}</p>
                            <p className="text-[10px] font-bold tabular-nums">{item.value ?? "—"}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] sm:text-xs text-zinc-500">
                  صفحه {page} از {totalPages} — {total} نمره
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="h-8 px-2 text-xs"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline mr-1">قبلی</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="h-8 px-2 text-xs"
                  >
                    <span className="hidden sm:inline ml-1">بعدی</span>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
