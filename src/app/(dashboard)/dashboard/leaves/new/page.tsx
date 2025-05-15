"use client";
import React, { useState, useRef } from "react";
import DatePicker from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import TimePicker from "@/components/ui/TimePicker";
import { cn } from "@/lib/utils";
import { MorakhasiService, Morakhasi } from "@/lib/services/morakhasi.service";
import { useAuth } from "@/lib/context/auth.context";
import { PageTransition } from '@/components/ui/page-transition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

const leaveTypes = [
  { value: "hourly", label: "ساعتی" },
  { value: "oneday", label: "یک‌روزه" },
  { value: "multiday", label: "چندروزه" },
];

export default function NewLeavePage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [leaveType, setLeaveType] = useState("hourly");
  const hourlyDateRef = useRef<Date | null>(null);
  const onedayDateRef = useRef<Date | null>(null);
  const dateRangeRef = useRef<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [fromTime, setFromTime] = useState<string>("");
  const [toTime, setToTime] = useState<string>("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper to safely convert DateObject or Date to Date
  function toDate(val: unknown): Date | null {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (
      typeof val === "object" &&
      val !== null &&
      "toDate" in val &&
      typeof (val as { toDate: unknown }).toDate === "function"
    ) {
      return (val as { toDate: () => Date }).toDate();
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      toast({
        title: 'خطا',
        description: 'دسترسی ندارید. لطفا دوباره وارد شوید.',
      });
      return;
    }
    let data: Partial<Morakhasi> = { dalil: reason, tenant_id: 1 };
    if (leaveType === "hourly") {
      const dateVal = toDate(hourlyDateRef.current);
      if (!dateVal || !fromTime || !toTime) {
        toast({
          title: 'خطا',
          description: 'لطفا تاریخ و ساعت را کامل وارد کنید.',
        });
        return;
      }
      data = {
        ...data,
        type: 1,
        dayli_date: dateVal.toISOString().split("T")[0],
        fromtime_1: fromTime,
        totime_1: toTime,
      };
    } else if (leaveType === "oneday") {
      const dateVal = toDate(onedayDateRef.current);
      if (!dateVal) {
        toast({
          title: 'خطا',
          description: 'لطفا تاریخ را وارد کنید.',
        });
        return;
      }
      data = {
        ...data,
        type: 2,
        dayli_date: dateVal.toISOString().split("T")[0],
      };
    } else if (leaveType === "multiday") {
      const fromDate = toDate(dateRangeRef.current.from);
      const toDateVal = toDate(dateRangeRef.current.to);
      if (!fromDate || !toDateVal) {
        toast({
          title: 'خطا',
          description: 'لطفا بازه تاریخ را کامل وارد کنید.',
        });
        return;
      }
      data = {
        ...data,
        type: 3,
        fromdate: fromDate.toISOString().split("T")[0],
        todate: toDateVal.toISOString().split("T")[0],
      };
    }
    setLoading(true);
    try {
      await MorakhasiService.createMorakhasi(data, accessToken);
      toast({
        title: 'موفق',
        description: 'درخواست با موفقیت ثبت شد.',
      });
      setReason("");
      setFromTime("");
      setToTime("");
      hourlyDateRef.current = null;
      onedayDateRef.current = null;
      dateRangeRef.current = { from: null, to: null };
    } catch (err: unknown) {
      toast({
        title: 'خطا',
        description: (typeof err === 'object' && err && 'message' in err) ? (err as { message?: string }).message || 'خطا در ثبت مرخصی' : 'خطا در ثبت مرخصی',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg p-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 dark:from-blue-500/5 dark:via-emerald-500/5 dark:to-blue-500/5" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
              درخواست مرخصی جدید
            </h1>
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/leaves')}
              className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
            >
              <ArrowLeft className="ml-2 h-4 w-4" />
              بازگشت به لیست مرخصی‌ها
            </Button>
          </div>
        </div>
        <Card className="border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="text-zinc-900 dark:text-zinc-100">فرم درخواست مرخصی</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* نوع مرخصی */}
              <div>
                <label className="block mb-3 font-semibold text-zinc-700 dark:text-zinc-200">نوع مرخصی</label>
                <div className="flex gap-4 justify-center">
                  {leaveTypes.map((type) => (
                    <button
                      type="button"
                      key={type.value}
                      className={cn(
                        "px-5 py-2 rounded-xl border transition font-bold text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400",
                        leaveType === type.value
                          ? "bg-gradient-to-r from-blue-500 to-green-400 text-white border-blue-500 scale-105"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      )}
                      onClick={() => setLeaveType(type.value)}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* انتخاب تاریخ/ساعت */}
              {leaveType === "hourly" && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block mb-2 font-medium text-zinc-700 dark:text-zinc-200">تاریخ</label>
                    <DatePicker onChange={(d) => (hourlyDateRef.current = d)} />
                  </div>
                  <div className="flex-1">
                    <TimePicker label="از ساعت" value={fromTime} onChange={setFromTime} />
                  </div>
                  <div className="flex-1">
                    <TimePicker label="تا ساعت" value={toTime} onChange={setToTime} />
                  </div>
                </div>
              )}
              {leaveType === "oneday" && (
                <div>
                  <label className="block mb-2 font-medium text-zinc-700 dark:text-zinc-200">تاریخ</label>
                  <DatePicker onChange={(d) => (onedayDateRef.current = d)} />
                </div>
              )}
              {leaveType === "multiday" && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block mb-2 font-medium text-zinc-700 dark:text-zinc-200">از تاریخ</label>
                    <DatePicker onChange={(d) => (dateRangeRef.current = { ...dateRangeRef.current, from: d })} />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-2 font-medium text-zinc-700 dark:text-zinc-200">تا تاریخ</label>
                    <DatePicker onChange={(d) => (dateRangeRef.current = { ...dateRangeRef.current, to: d })} />
                  </div>
                </div>
              )}
              {/* علت مرخصی */}
              <div>
                <label className="block mb-2 font-medium text-zinc-700 dark:text-zinc-200">علت مرخصی</label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="علت مرخصی را وارد کنید..."
                  className="resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4 ml-2" />
                    در حال ثبت...
                  </>
                ) : (
                  'ثبت درخواست'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
} 