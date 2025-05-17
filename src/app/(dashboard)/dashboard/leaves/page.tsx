"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { PageTransition } from "@/components/ui/page-transition";
import { useAuth } from "@/lib/context/auth.context";
import { MorakhasiService, Morakhasi } from "@/lib/services/morakhasi.service";
import { useReactTable, getCoreRowModel, getPaginationRowModel } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { MorakhasiFilters } from "@/lib/types";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { TrendingUp, CalendarCheck, Clock, Info } from "lucide-react";

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

function toJalali(date: string | undefined) {
  if (!date) return '-';
  // Try to parse as ISO or YYYY-MM-DD
  const d = dayjs(date);
  return d.locale('fa').format('YYYY/MM/DD');
}

function getLeaveTimeDisplay(leave: Morakhasi) {
  // ساعتی
  if (leave.fromtime_1 && leave.totime_1 && leave.dayli_date) {
    return (
      <span className="font-mono">
        {toJalali(leave.dayli_date)}
        ({leave.fromtime_1} تا {leave.totime_1})
      </span>
    );
  }
  // چندروزه
  if (leave.fromdate && leave.todate) {
    return (
      <span className="font-mono">
        {toJalali(leave.fromdate)}
        {' تا '}
        {toJalali(leave.todate)}
      </span>
    );
  }
  // یک‌روزه
  if (leave.dayli_date) {
    return (
      <span className="font-mono">
        {toJalali(leave.dayli_date)}
      </span>
    );
  }
  return "-";
}

interface Statistics {
  growth_rate?: { value: number | null, period: string };
  most_common_reason?: { reason: string, count: number, period: string };
  average_leave_duration?: { value: number | null, period: string };
  average_late_time?: { value: number | null, period: string };
}

const chartData = {
  growth: [
    { value: 2 }, { value: 3 }, { value: 5 }, { value: 4 }, { value: 6 }, { value: 7 }, { value: 8 }, { value: 7 }, { value: 9 }, { value: 10 }
  ],
  reason: [
    { value: 1 }, { value: 2 }, { value: 2 }, { value: 3 }, { value: 2 }, { value: 4 }, { value: 3 }, { value: 5 }, { value: 4 }, { value: 6 }
  ],
  duration: [
    { value: 5 }, { value: 6 }, { value: 7 }, { value: 6 }, { value: 8 }, { value: 7 }, { value: 9 }, { value: 8 }, { value: 10 }, { value: 9 }
  ],
  late: [
    { value: 0 }, { value: 1 }, { value: 0 }, { value: 2 }, { value: 1 }, { value: 3 }, { value: 2 }, { value: 4 }, { value: 3 }, { value: 2 }
  ],
};

export default function LeavesListPage() {
  const { accessToken, user } = useAuth();
  const [leaves, setLeaves] = React.useState<Morakhasi[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [selectedType, setSelectedType] = React.useState("all");
  const [filters, setFilters] = React.useState<MorakhasiFilters>({
    page: 1,
    per_page: 10,
    search: "",
    type: "all",
  });
  const [pagination, setPagination] = React.useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
    from: 0,
    to: 0,
  });
  const [statistics, setStatistics] = React.useState<Statistics | null>(null);

  React.useEffect(() => {
    if (!accessToken || !user) return;
    setLoading(true);
    setError(null);

    const isAdmin = user.app_roles?.some((role: { name: string }) => role.name === 'admin');
    
    const apiFilters: MorakhasiFilters = {
      ...filters,
      search: debouncedSearch,
      type: selectedType,
    };

    if (!isAdmin && user.id) {
      apiFilters.user_id = user.id;
    }
    
    MorakhasiService.getMorakhasiList(accessToken, apiFilters)
      .then((responseFromServer) => {
        const paginatedPayload = responseFromServer.data;

        let leavesArr: Morakhasi[] = [];
        let pag = {
          current_page: 1,
          last_page: 1,
          total: 0,
          per_page: filters.per_page,
          from: 0,
          to: 0,
        };

        if (paginatedPayload && typeof paginatedPayload === 'object') {
          type LaravelPaginatedResponse = {
            current_page?: number;
            last_page?: number;
            total?: number;
            per_page?: number;
            from?: number;
            to?: number;
            data?: Morakhasi[];
          };
          
          const laravelData = paginatedPayload as LaravelPaginatedResponse;
          leavesArr = Array.isArray(laravelData.data) ? laravelData.data : [];
          pag = {
            current_page: laravelData.current_page ?? 1,
            last_page: laravelData.last_page ?? 1,
            total: laravelData.total ?? 0,
            per_page: laravelData.per_page ?? filters.per_page,
            from: laravelData.from ?? 0,
            to: laravelData.to ?? 0,
          };
        }
        setLeaves(leavesArr);
        setPagination(pag);

        if (responseFromServer && 'statistics' in responseFromServer && responseFromServer.statistics) {
          setStatistics(responseFromServer.statistics as Statistics);
        } else {
          setStatistics(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "خطا در دریافت لیست مرخصی‌ها");
        setLeaves([]);
        setStatistics(null);
        setPagination({
          current_page: 1,
          last_page: 1,
          total: 0,
          per_page: filters.per_page,
          from: 0,
          to: 0,
        });
        setLoading(false);
      });
  }, [accessToken, user, filters, debouncedSearch, selectedType]);

  // Define columns for TanStack Table
  const columns = React.useMemo<ColumnDef<Morakhasi>[]>(() => [
    {
      id: 'index',
      header: '#',
      cell: (info) =>
        String((filters.page - 1) * filters.per_page + info.row.index + 1),
      size: 32,
      enableSorting: false,
    },
    { accessorKey: 'type', header: 'نوع', cell: (info) => getTypeLabel(info.getValue() as string | number | undefined) },
    // تاریخ ایجاد
    { accessorKey: 'created_at', header: 'تاریخ', cell: (info) => (
      <span className="font-mono">
        {typeof info.row.original.created_at === 'string'
          ? toJalali(info.row.original.created_at)
          : '-'}
      </span>
    ) },
    // زمان مرخصی
    { accessorKey: 'leave_time', header: 'زمان مرخصی', cell: (info) => getLeaveTimeDisplay(info.row.original) },
    { accessorKey: 'dalil', header: 'علت', cell: (info) => info.getValue() || '-' },
    { accessorKey: 'fullname', header: 'قرآن آموز', cell: (info) => info.getValue() || '-' },
    { accessorKey: 'accepted_by', header: 'تائید شده توسط', cell: (info) => String(info.getValue() ?? '-') },
    { accessorKey: 'status', header: 'وضعیت', cell: (info) => (
      <span className={
        getStatusLabel(info.getValue() as string | number | undefined) === 'تایید شده'
          ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 px-3 py-1 rounded-full text-xs font-bold'
          : getStatusLabel(info.getValue() as string | number | undefined) === 'رد شده'
          ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200 px-3 py-1 rounded-full text-xs font-bold'
          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-xs font-bold'
      }>
        {getStatusLabel(info.getValue() as string | number | undefined)}
      </span>
    ) },
  ], [filters.page, filters.per_page]);

  // TanStack Table instance
  const table = useReactTable({
    data: leaves,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: pagination.last_page,
    debugTable: true,
    state: {
      pagination: {
        pageIndex: filters.page - 1,
        pageSize: filters.per_page,
      },
    },
    onPaginationChange: updater => {
      const next = typeof updater === 'function' ? updater({ pageIndex: filters.page - 1, pageSize: filters.per_page }) : updater;
      setFilters(prev => ({ ...prev, page: next.pageIndex + 1, per_page: next.pageSize }));
    },
  });

  const currentUserIsAdmin = user?.app_roles?.some((role: { name: string }) => role.name === 'admin');

  return (
    <PageTransition>
      <div className="space-y-4 relative">
       
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
        {statistics && currentUserIsAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {/* Growth Rate */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.5, type: "spring" }}
              whileHover={{ scale: 1.04 }}
              className="relative overflow-hidden rounded-2xl shadow-lg p-5 bg-gradient-to-tr from-indigo-500 to-blue-400 dark:from-indigo-700 dark:to-blue-800 flex flex-col"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-white text-sm font-medium mb-1">نرخ رشد</div>
                  <div className="text-2xl font-bold text-white">{statistics.growth_rate?.value ?? '-'}</div>
                  <div className="text-xs text-blue-100 mt-1">{statistics.growth_rate?.period}</div>
                </div>
                <div className="bg-white/20 rounded-full p-2">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-auto h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.growth}>
                    <Line type="monotone" dataKey="value" stroke="#fff" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
            {/* Most Common Reason */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, type: "spring" }}
              whileHover={{ scale: 1.04 }}
              className="relative overflow-hidden rounded-2xl shadow-lg p-5 bg-gradient-to-tr from-pink-500 to-rose-400 dark:from-pink-700 dark:to-rose-800 flex flex-col"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-white text-sm font-medium mb-1">شایع‌ترین علت</div>
                  <div className="text-lg font-bold text-white">{statistics.most_common_reason?.reason ?? '-'}</div>
                  <div className="text-xs text-rose-100 mt-1">{statistics.most_common_reason?.period} ({statistics.most_common_reason?.count ?? 0} بار)</div>
                </div>
                <div className="bg-white/20 rounded-full p-2">
                  <Info className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-auto h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.reason}>
                    <Line type="monotone" dataKey="value" stroke="#fff" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
            {/* Average Leave Duration */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, type: "spring" }}
              whileHover={{ scale: 1.04 }}
              className="relative overflow-hidden rounded-2xl shadow-lg p-5 bg-gradient-to-tr from-amber-400 to-yellow-300 dark:from-yellow-700 dark:to-amber-800 flex flex-col"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-white text-sm font-medium mb-1">میانگین مدت مرخصی</div>
                  <div className="text-2xl font-bold text-white">{statistics.average_leave_duration?.value ?? '-'}</div>
                  <div className="text-xs text-yellow-100 mt-1">{statistics.average_leave_duration?.period}</div>
                </div>
                <div className="bg-white/20 rounded-full p-2">
                  <CalendarCheck className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-auto h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.duration}>
                    <Line type="monotone" dataKey="value" stroke="#fff" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
            {/* Average Late Time */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5, type: "spring" }}
              whileHover={{ scale: 1.04 }}
              className="relative overflow-hidden rounded-2xl shadow-lg p-5 bg-gradient-to-tr from-orange-500 to-red-400 dark:from-orange-700 dark:to-red-800 flex flex-col"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-white text-sm font-medium mb-1">میانگین تاخیر</div>
                  <div className="text-2xl font-bold text-white">{statistics.average_late_time?.value ?? '-'}</div>
                  <div className="text-xs text-red-100 mt-1">{statistics.average_late_time?.period}</div>
                </div>
                <div className="bg-white/20 rounded-full p-2">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-auto h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.late}>
                    <Line type="monotone" dataKey="value" stroke="#fff" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        )}
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
          {/* Desktop Table: match students table design */}
          <div className="relative overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 hidden md:block">
            <table className="w-full text-right text-sm">
              <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">#</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">نوع</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">تاریخ</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">زمان مرخصی</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">علت</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">قرآن آموز</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">تایید شده توسط</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {loading ? (
                  Array.from({ length: 8 }).map((_, idx) => (
                    <tr key={idx}>
                      {Array.from({ length: 8 }).map((_, colIdx) => (
                        <td key={colIdx} className="px-4 py-3">
                          <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  leaves.map((leave: Morakhasi, index: number) => (
                    <tr key={leave.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {pagination.from ? pagination.from + index : index + 1}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{getTypeLabel(leave.type)}</td>
                      {/* تاریخ ایجاد */}
                      <td className="whitespace-nowrap px-4 py-3 font-mono">{typeof leave.created_at === 'string' ? toJalali(leave.created_at) : '-'}</td>
                      {/* زمان مرخصی */}
                      <td className="whitespace-nowrap px-4 py-3">{getLeaveTimeDisplay(leave)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{leave.dalil || '-'}</td>
                      <td className="whitespace-nowrap px-4 py-3">{leave.fullname || '-'}</td>
                      <td className="whitespace-nowrap px-4 py-3">{String(leave.accepted_by ?? '-')}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={
                          getStatusLabel(leave.status) === 'تایید شده'
                            ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 px-3 py-1 rounded-full text-xs font-bold'
                            : getStatusLabel(leave.status) === 'رد شده'
                            ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200 px-3 py-1 rounded-full text-xs font-bold'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-xs font-bold'
                        }>
                          {getStatusLabel(leave.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile/Tablet Card View */}
          <div className="md:hidden space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow p-4">
                  <div className="h-4 w-1/3 mb-2 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-4 w-2/3 mb-2 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-4 w-1/2 mb-2 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-4 w-1/4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                </div>
              ))
            ) : (
              leaves.map((leave: Morakhasi) => (
                <div key={leave.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{getTypeLabel(leave.type)}</span>
                    {/* تاریخ ایجاد */}
                    <span className="font-mono">{typeof leave.created_at === 'string' ? toJalali(leave.created_at) : '-'}</span>
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{leave.dalil || '-'}</div>
                  <div className="flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>قرآن آموز: {leave.fullname || '-'}</span>
                    <span>تایید شده توسط: {String(leave.accepted_by ?? '-')}</span>
                    {/* زمان مرخصی */}
                    <span>زمان مرخصی: {getLeaveTimeDisplay(leave)}</span>
                    <span>
                      وضعیت: <span className={
                        getStatusLabel(leave.status) === 'تایید شده'
                          ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 px-2 py-0.5 rounded-full font-bold'
                          : getStatusLabel(leave.status) === 'رد شده'
                          ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200 px-2 py-0.5 rounded-full font-bold'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full font-bold'
                      }>{getStatusLabel(leave.status)}</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Pagination Controls */}
          {!loading && !error && pagination.last_page > 1 && (
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>اولین</Button>
                  <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronRight className="h-4 w-4" /></Button>
                </div>
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.last_page) }).map((_, i) => {
                    let pageNum;
                    if (pagination.last_page <= 5) pageNum = i + 1;
                    else if (pagination.current_page <= 3) pageNum = i + 1;
                    else if (pagination.current_page >= pagination.last_page - 2) pageNum = pagination.last_page - 4 + i;
                    else pageNum = pagination.current_page - 2 + i;
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.current_page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => table.setPageIndex(pageNum - 1)}
                        className={pagination.current_page === pageNum ? 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button onClick={() => table.setPageIndex(pagination.last_page - 1)} disabled={!table.getCanNextPage()}>آخرین</Button>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">تعداد در صفحه:</span>
                <select
                  value={filters.per_page}
                  onChange={e => setFilters(prev => ({ ...prev, page: 1, per_page: parseInt(e.target.value) }))}
                  className="w-20 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 rounded"
                >
                  {[5, 10, 20, 50].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
