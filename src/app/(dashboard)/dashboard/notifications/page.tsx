"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/auth.context";
import { fetchNotifications, deleteNotification, markNotificationAsRead } from "@/lib/services/notification.service";
import { Notification } from "@/components/NotificationDisplay";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function NotificationsTablePage() {
  const { accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [selectedIds, setSelectedIds] = useState<(string|number)[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const loadNotifications = (searchValue?: string) => {
    if (!accessToken) return;
    setLoading(true);
    fetchNotifications(accessToken, searchValue)
      .then((data) => {
        setNotifications(data);
        setSelectedIds([]);
        setSelectAll(false);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications(debouncedSearch);
    // eslint-disable-next-line
  }, [accessToken, debouncedSearch]);

  const handleDelete = async (id: string | number) => {
    if (!accessToken) return;
    setActionLoading(String(id));
    try {
      await deleteNotification(accessToken, id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? "خطا در حذف اعلان: " + err.message : "خطا در حذف اعلان");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsRead = async (id: string | number) => {
    if (!accessToken) return;
    setActionLoading(String(id));
    try {
      await markNotificationAsRead(accessToken, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? "خطا در خواندن اعلان: " + err.message : "خطا در خواندن اعلان");
    } finally {
      setActionLoading(null);
    }
  };

  // Group actions
  const handleGroupDelete = async () => {
    if (!accessToken || selectedIds.length === 0) return;
    setActionLoading("group-delete");
    try {
      await Promise.all(selectedIds.map((id) => deleteNotification(accessToken, id)));
      setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
      setSelectedIds([]);
      setSelectAll(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? "خطا در حذف گروهی: " + err.message : "خطا در حذف گروهی");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGroupMarkAsRead = async () => {
    if (!accessToken || selectedIds.length === 0) return;
    setActionLoading("group-read");
    try {
      await Promise.all(selectedIds.map((id) => markNotificationAsRead(accessToken, id)));
      setNotifications((prev) =>
        prev.map((n) =>
          selectedIds.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setSelectedIds([]);
      setSelectAll(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? "خطا در خواندن گروهی: " + err.message : "خطا در خواندن گروهی");
    } finally {
      setActionLoading(null);
    }
  };

  // Selection logic
  const handleSelect = (id: string | number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      setSelectedIds(notifications.map((n) => n.id));
      setSelectAll(true);
    }
  };

  if (loading) return <div className="p-8 text-center">در حال بارگذاری اعلان‌ها...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-4" dir="rtl" style={{ direction: 'rtl' }}>
      <h1 className="text-xl font-bold mb-4 text-right">جدول اعلان‌ها</h1>
      {/* Search and group actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="جستجو..."
            className="border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 w-full md:w-64 text-right bg-white dark:bg-zinc-900 shadow-sm"
            dir="rtl"
          />
        </div>
        {selectedIds.length > 0 && (
          <div className="flex gap-2 justify-end w-full md:w-auto">
            <Button
              variant="destructive"
              size="sm"
              disabled={!!actionLoading}
              onClick={handleGroupDelete}
            >
              حذف گروهی
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!!actionLoading}
              onClick={handleGroupMarkAsRead}
            >
              علامت‌گذاری به عنوان خوانده‌شده گروهی
            </Button>
          </div>
        )}
      </div>
      {/* Desktop table view */}
      <div className="relative overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 hidden md:block">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-8">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="accent-blue-600"
                    aria-label="انتخاب همه"
                  />
                </TableHead>
                <TableHead className="text-right">عنوان</TableHead>
                <TableHead className="text-right">متن</TableHead>
                <TableHead className="text-right">فرستنده</TableHead>
                <TableHead className="text-right">دانش‌آموز</TableHead>
                <TableHead className="text-right">درس</TableHead>
                <TableHead className="text-right">تاریخ</TableHead>
                <TableHead className="text-right">وضعیت</TableHead>
                <TableHead className="text-right">اکشن‌ها</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((n) => (
                <TableRow key={n.id} className={n.read_at ? "bg-zinc-50 dark:bg-zinc-900" : "bg-blue-50 dark:bg-blue-950"}>
                  <TableCell className="text-right w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(n.id)}
                      onChange={() => handleSelect(n.id)}
                      className="accent-blue-600"
                      aria-label={`انتخاب اعلان ${n.data?.title}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">{n.data?.title}</TableCell>
                  <TableCell className="text-right">{n.data?.body}</TableCell>
                  <TableCell className="text-right">{n.data?.sender}</TableCell>
                  <TableCell className="text-right">{n.data?.student}</TableCell>
                  <TableCell className="text-right">{n.data?.dars}</TableCell>
                  <TableCell className="text-right">{new Date(n.created_at).toLocaleString('fa-IR')}</TableCell>
                  <TableCell className="text-right">{n.read_at ? "خوانده‌شده" : "خوانده‌نشده"}</TableCell>
                  <TableCell className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!actionLoading}
                      onClick={() => handleMarkAsRead(n.id)}
                    >
                      {actionLoading === String(n.id) ? "..." : "خوانده شد"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={!!actionLoading}
                      onClick={() => handleDelete(n.id)}
                    >
                      {actionLoading === String(n.id) ? "..." : "حذف"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {notifications.length === 0 && (
            <div className="p-8 text-center text-zinc-500">اعلانی وجود ندارد.</div>
          )}
        </div>
      </div>
      {/* Mobile card view */}
      <div className="space-y-4 md:hidden">
        <AnimatePresence>
          {loading ? (
            <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
              در حال بارگذاری...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
              اعلانی وجود ندارد.
            </div>
          ) : (
            notifications.map((n, index) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`bg-white dark:bg-zinc-900 border ${n.read_at ? "border-zinc-200 dark:border-zinc-800" : "border-blue-200 dark:border-blue-800"} rounded-lg overflow-hidden shadow-md`}
                dir="rtl"
              >
                <div className="flex items-center gap-2 p-2 border-b border-zinc-200 dark:border-zinc-800">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(n.id)}
                    onChange={() => handleSelect(n.id)}
                    className="accent-blue-600"
                    aria-label={`انتخاب اعلان ${n.data?.title}`}
                  />
                  <span className="text-xs text-zinc-500">انتخاب</span>
                </div>
                <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
                  <CardTitle className="text-zinc-900 dark:text-zinc-100 text-right text-base">
                    {n.data?.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 text-right text-zinc-800 dark:text-zinc-200">
                    {n.data?.body}
                  </div>
                  <div className="mb-2 text-xs text-zinc-500 dark:text-zinc-400 text-right">
                    فرستنده: {n.data?.sender} | دانش‌آموز: {n.data?.student} | درس: {n.data?.dars}
                  </div>
                  <div className="mb-2 text-xs text-zinc-500 dark:text-zinc-400 text-right">
                    {new Date(n.created_at).toLocaleString('fa-IR')}
                  </div>
                  <div className="mb-2 text-xs text-zinc-500 dark:text-zinc-400 text-right">
                    وضعیت: {n.read_at ? "خوانده‌شده" : "خوانده‌نشده"}
                  </div>
                  <div className="flex gap-2 justify-end mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!actionLoading}
                      onClick={() => handleMarkAsRead(n.id)}
                    >
                      {actionLoading === String(n.id) ? "..." : "خوانده شد"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={!!actionLoading}
                      onClick={() => handleDelete(n.id)}
                    >
                      {actionLoading === String(n.id) ? "..." : "حذف"}
                    </Button>
                  </div>
                </CardContent>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 