"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { JuzService, JuzReadingLog } from "@/lib/services/juz.service";
import { StudentService, Student } from "@/lib/services/student.service";
import { useAuth } from "@/lib/context/auth.context";
import { PageTransition } from "@/components/ui/page-transition";
import DateSelector from "../../optimizedNumbers/add/DateSelector";
import { BookMarked, Plus, Trash2, CheckCircle2, Search, Loader2 } from "lucide-react";
import { DateObject } from "react-multi-date-picker";

export default function JuzReadingLogsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [logs, setLogs] = useState<JuzReadingLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [filters, setFilters] = useState({
    student_id: '',
    juz_number: '',
    date_from: null as DateObject | null,
    date_to: null as DateObject | null,
    is_verified: '',
  });

  const [formData, setFormData] = useState({
    student_id: '',
    juz_number: '',
    read_date: null as DateObject | null,
    source: 'self',
  });

  useEffect(() => {
    if (accessToken) {
      fetchStudents();
      fetchLogs();
    }
  }, [accessToken]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { paginate: 'off' };
      if (filters.student_id) params.student_id = Number(filters.student_id);
      if (filters.juz_number) params.juz_number = Number(filters.juz_number);
      if (filters.date_from) params.date_from = filters.date_from.toDate().toISOString().slice(0, 10);
      if (filters.date_to) params.date_to = filters.date_to.toDate().toISOString().slice(0, 10);
      if (filters.is_verified) params.is_verified = filters.is_verified === 'true';

      const res = await JuzService.getReadingLogs(params);
      if (res.status === 'success') {
        setLogs(Array.isArray(res.data) ? res.data : res.data.data);
      }
    } catch (err: unknown) {
      toast({ title: 'خطا', description: err instanceof Error ? err.message : 'خطا در دریافت اطلاعات', type: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudents() {
    if (!accessToken) return;
    try {
      const res = await StudentService.getStudents({ per_page: 500 }, accessToken) as unknown as { data: { data: Student[] } };
      const arr = res.data?.data || [];
      console.log("[JuzReadingLogs] students loaded:", arr.length);
      setStudents(arr);
    } catch (e) {
      console.error("[JuzReadingLogs] fetchStudents error:", e);
    }
  }

  function getStudentName(id: number) {
    const s = students.find(st => st.id === id);
    return s ? `${s.Fname} ${s.Lname}` : `دانش‌آموز ${id}`;
  }

  function formatDate(gregDate: Date | null): string {
    if (!gregDate) return '-';
    try {
      return gregDate.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return '-';
    }
  }

  async function handleAdd() {
    if (!formData.student_id || !formData.juz_number || !formData.read_date) {
      toast({ title: 'خطا', description: 'لطفاً تمام فیلدها را پر کنید', type: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await JuzService.createReadingLog({
        student_id: Number(formData.student_id),
        juz_number: Number(formData.juz_number),
        read_date: formData.read_date.toDate().toISOString().slice(0, 10),
        source: formData.source,
      });
      if (res.status === 'success') {
        toast({ title: 'موفق', description: 'قرائت با موفقیت ثبت شد' });
        setIsAddOpen(false);
        setFormData({ student_id: '', juz_number: '', read_date: null, source: 'self' });
        fetchLogs();
      }
    } catch (err: unknown) {
      toast({ title: 'خطا', description: err instanceof Error ? err.message : 'خطا در ثبت', type: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(id: number) {
    try {
      const res = await JuzService.verifyReadingLog(id);
      if (res.status === 'success') {
        toast({ title: 'تایید شد', description: 'قرائت با موفقیت تایید شد' });
        fetchLogs();
      }
    } catch (err: unknown) {
      toast({ title: 'خطا', description: err instanceof Error ? err.message : 'خطا در تایید', type: 'destructive' });
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await JuzService.deleteReadingLog(id);
      if (res.status === 'success') {
        toast({ title: 'حذف شد', description: 'قرائت حذف شد' });
        fetchLogs();
      }
    } catch (err: unknown) {
      toast({ title: 'خطا', description: err instanceof Error ? err.message : 'خطا در حذف', type: 'destructive' });
    }
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 p-1.5 sm:p-2">
              <BookMarked className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-zinc-800 dark:text-zinc-200">ثبت قرائت جزء</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">مدیریت و ثبت قرائت روزانه قرآن آموزان</div>
            </div>
          </div>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="ml-2 h-4 w-4" />
            ثبت قرائت جدید
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">قرآن آموز</Label>
              <Select value={filters.student_id} onValueChange={(v) => setFilters(p => ({ ...p, student_id: v }))}>
                <SelectTrigger><SelectValue placeholder="همه" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">همه</SelectItem>
                  {students.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.Fname} {s.Lname}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">جزء</Label>
              <Select value={filters.juz_number} onValueChange={(v) => setFilters(p => ({ ...p, juz_number: v }))}>
                <SelectTrigger><SelectValue placeholder="همه" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">همه</SelectItem>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(n => (
                    <SelectItem key={n} value={String(n)}>جزء {n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">از تاریخ</Label>
              <DateSelector selectedDate={filters.date_from} onChange={(d) => setFilters(p => ({ ...p, date_from: d }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">تا تاریخ</Label>
              <DateSelector selectedDate={filters.date_to} onChange={(d) => setFilters(p => ({ ...p, date_to: d }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">وضعیت تایید</Label>
              <Select value={filters.is_verified} onValueChange={(v) => setFilters(p => ({ ...p, is_verified: v }))}>
                <SelectTrigger><SelectValue placeholder="همه" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">همه</SelectItem>
                  <SelectItem value="true">تایید شده</SelectItem>
                  <SelectItem value="false">تایید نشده</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-start mt-3">
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <Search className="ml-1 h-3.5 w-3.5" />
              جستجو
            </Button>
          </div>
        </Card>

        {/* Logs Table */}
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-zinc-400">هیچ قرائتی ثبت نشده است</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="text-right px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">قرآن آموز</th>
                    <th className="text-right px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">جزء</th>
                    <th className="text-right px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">تاریخ</th>
                    <th className="text-right px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">منبع</th>
                    <th className="text-center px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">وضعیت</th>
                    <th className="text-center px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200">
                        {getStudentName(log.student_id)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">جزء {log.juz_number}</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {formatDate(new Date(log.read_date + 'T00:00:00'))}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {log.source === 'supervisor' ? 'مسئول' : 'خود'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {log.is_verified ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">تایید شده</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">در انتظار تایید</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {!log.is_verified && (
                            <button onClick={() => handleVerify(log.id)} className="text-emerald-500 hover:text-emerald-700 transition-colors" title="تایید">
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => handleDelete(log.id)} className="text-red-400 hover:text-red-600 transition-colors" title="حذف">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Add Reading Log Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>ثبت قرائت جدید</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>قرآن آموز</Label>
                <Select value={formData.student_id} onValueChange={(v) => setFormData(p => ({ ...p, student_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="انتخاب قرآن آموز" /></SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.Fname} {s.Lname}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>شماره جزء</Label>
                <Select value={formData.juz_number} onValueChange={(v) => setFormData(p => ({ ...p, juz_number: v }))}>
                  <SelectTrigger><SelectValue placeholder="انتخاب جزء" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(n => (
                      <SelectItem key={n} value={String(n)}>جزء {n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>تاریخ قرائت</Label>
                <DateSelector selectedDate={formData.read_date} onChange={(d) => setFormData(p => ({ ...p, read_date: d }))} />
              </div>
              <div className="space-y-2">
                <Label>منبع</Label>
                <Select value={formData.source} onValueChange={(v) => setFormData(p => ({ ...p, source: v }))}>
                  <SelectTrigger><SelectValue placeholder="انتخاب منبع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">خود قرآن آموز</SelectItem>
                    <SelectItem value="supervisor">مسئول</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>انصراف</Button>
              <Button onClick={handleAdd} disabled={submitting}>
                {submitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                ثبت قرائت
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
