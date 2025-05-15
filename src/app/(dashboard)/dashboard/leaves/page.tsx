"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, CalendarDays, Clock } from "lucide-react";
import { PageTransition } from "@/components/ui/page-transition";
import { useAuth } from "@/lib/context/auth.context";
import { MorakhasiService, Morakhasi } from "@/lib/services/morakhasi.service";

const leaveTypes = [
  { value: "all", label: "همه انواع" },
  { value: "ساعتی", label: "ساعتی" },
  { value: "یک‌روزه", label: "یک‌روزه" },
  { value: "چندروزه", label: "چندروزه" },
];

function getTypeLabel(type: number | string | undefined) {
  if (type === 1 || type === "ساعتی") return "ساعتی";
  if (type === 2 || type === "یک‌روزه") return "یک‌روزه";
  if (type === 3 || type === "چندروزه") return "چندروزه";
  return "-";
}

function getStatusLabel(status: number | string | undefined) {
  if (status === 1 || status === "تایید شده") return "تایید شده";
  if (status === 2 || status === "رد شده") return "رد شده";
  return "در انتظار تایید";
}

// Helper to display date(s) clearly
function getDateDisplay(leave: Morakhasi) {
  // چندروزه
  if (leave.type === 3 && leave.fromdate && leave.todate) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 text-blue-700 dark:text-blue-200 font-bold text-sm">
        <CalendarDays className="w-4 h-4 text-green-500" />
        <span>از</span>
        <span className="font-mono">{leave.fromdate}</span>
        <span>تا</span>
        <span className="font-mono">{leave.todate}</span>
      </span>
    );
  }
  
  // ساعتی
  if (leave.dayli_date && leave.fromtime_1 && leave.totime_1) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 text-yellow-800 dark:text-yellow-200 font-bold text-sm">
        <Clock className="w-4 h-4 text-orange-500" />
        <span className="font-mono">{leave.dayli_date}</span>
        <span className="mx-1">(</span>
        <span className="font-mono">{leave.fromtime_1}</span>
        <span>تا</span>
        <span className="font-mono">{leave.totime_1}</span>
        <span className="mx-1">)</span>
      </span>
    );
  }
  
  // یک‌روزه
  if (leave.dayli_date) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-800 dark:text-blue-200 font-bold text-sm">
        <CalendarDays className="w-4 h-4 text-blue-500" />
        <span className="font-mono">{leave.dayli_date}</span>
      </span>
    );
  }
  
  // چندروزه (بدون تایپ)
  if (leave.fromdate && leave.todate) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 text-green-800 dark:text-green-200 font-bold text-sm">
        <CalendarDays className="w-4 h-4 text-green-500" />
        <span>از</span>
        <span className="font-mono">{leave.fromdate}</span>
        <span>تا</span>
        <span className="font-mono">{leave.todate}</span>
      </span>
    );
  }
  
  // حالت پیش‌فرض
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-sm">
      <CalendarDays className="w-4 h-4 text-zinc-400" />
      <span>{leave.fromdate || leave.todate || "-"}</span>
    </span>
  );
}

export default function LeavesListPage() {
  const { accessToken } = useAuth();
  const [leaves, setLeaves] = React.useState<Morakhasi[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [selectedType, setSelectedType] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const perPage = 10;

  React.useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    MorakhasiService.getMorakhasiList(accessToken)
      .then((data) => {
        setLeaves(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "خطا در دریافت لیست مرخصی‌ها");
        setLoading(false);
      });
  }, [accessToken]);

  // Filter and search logic (client-side)
  const filteredLeaves = leaves.filter((l) => {
    const typeLabel = getTypeLabel(l.type);
    const statusLabel = getStatusLabel(l.status);
    return (
      (selectedType === "all" || typeLabel === selectedType) &&
      (
        (typeLabel && typeLabel.includes(search)) ||
        (l.dalil && l.dalil.includes(search)) ||
        (statusLabel && statusLabel.includes(search)) ||
        (l.fromdate && l.fromdate.includes(search)) ||
        (l.todate && l.todate.includes(search)) ||
        (l.dayli_date && l.dayli_date.includes(search))
      )
    );
  });
  const total = filteredLeaves.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const paginatedLeaves = filteredLeaves.slice((page - 1) * perPage, page * perPage);

  React.useEffect(() => {
    if (page > lastPage) setPage(1);
  }, [lastPage, page]);

  return (
    <PageTransition>
      <div className="max-w-screen-2xl   space-y-4">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg p-4 overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 dark:from-blue-500/5 dark:via-emerald-500/5 dark:to-blue-500/5" />
          {/* Content */}
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
              لیست مرخصی‌های من
            </h1>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Link href="/dashboard/leaves/new">
                <Button className="bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-md px-6 py-2 transition">
                  درخواست مرخصی جدید
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6">
          {/* Filters/Search */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
              <Input
                placeholder="جستجو..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-9 border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-[180px] border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                <SelectValue placeholder="نوع مرخصی" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Table */}
          {loading ? (
            <div className="text-center text-zinc-500 py-8">در حال بارگذاری...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : (
            <>
              <table className="w-full text-right border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-zinc-600 dark:text-zinc-300 text-base">
                    <th className="pb-2">نوع</th>
                    <th className="pb-2">تاریخ</th>
                    <th className="pb-2">علت</th>
                    <th className="pb-2">قرآن آموز</th>
                    <th className="pb-2">تائید شده توسط</th>
                    <th className="pb-2">زمان مرخصی</th>
                    <th className="pb-2">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLeaves.map((leave) => (
                    <tr key={leave.id} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl shadow hover:scale-[1.01] transition">
                      <td className="py-3 px-4 font-semibold">{getTypeLabel(leave.type)}</td>
                      <td className="py-3 px-4">{getDateDisplay(leave)}</td>
                      <td className="py-3 px-4">{leave.dalil || "-"}</td>
                      <td className="py-3 px-4">{leave.fullname || "-"}</td>
                      <td className="py-3 px-4">{String(leave.accepted_by ?? "-")}</td>
                      <td className="py-3 px-4">{String(leave.datetime ?? "-")}</td>
                      <td className="py-3 px-4">
                        <span className={
                          getStatusLabel(leave.status) === "تایید شده"
                            ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 px-3 py-1 rounded-full text-xs font-bold"
                            : getStatusLabel(leave.status) === "رد شده"
                            ? "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200 px-3 py-1 rounded-full text-xs font-bold"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-xs font-bold"
                        }>
                          {getStatusLabel(leave.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {paginatedLeaves.length === 0 && (
                <div className="text-center text-zinc-500 py-8">هیچ مرخصی ثبت نشده است.</div>
              )}
            </>
          )}
          {/* Pagination */}
          {lastPage > 1 && !loading && !error && (
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                اولین
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                صفحه {page} از {lastPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === lastPage}
                className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(lastPage)}
                disabled={page === lastPage}
                className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                آخرین
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
} 