"use client";
import React, { useState } from "react";
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
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

const leaveTypes = [
  { value: "hourly", label: "ساعتی" },
  { value: "multiday", label: "چندروزه" },
];

export default function NewLeavePage() {
  const { accessToken, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [leaveType, setLeaveType] = useState("hourly");
  const [hourlyDate, setHourlyDate] = useState<DateObject | null>(null);
  const [dateRange, setDateRange] = useState<{ from: DateObject | null; to: DateObject | null }>({ from: null, to: null });
  const [fromTime, setFromTime] = useState<string>("");
  const [toTime, setToTime] = useState<string>("");
  const [fromTimeMulti, setFromTimeMulti] = useState<string>("");
  const [toTimeMulti, setToTimeMulti] = useState<string>("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  function jalaliDateObjectToDate(obj: DateObject | null): Date | null {
    if (!obj) return null;
    try {
      return obj.toDate();
    } catch {
      return null;
    }
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
    let data: Partial<Morakhasi> = { 
      dalil: reason, 
      tenant_id: user?.tenant_id || undefined 
    };
    if (leaveType === "hourly") {
      const dateVal = jalaliDateObjectToDate(hourlyDate);
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
    } else if (leaveType === "multiday") {
      const fromDate = jalaliDateObjectToDate(dateRange.from);
      const toDateVal = jalaliDateObjectToDate(dateRange.to);
      if (!fromDate || !toDateVal || !fromTimeMulti || !toTimeMulti) {
        toast({
          title: 'خطا',
          description: 'لطفا بازه تاریخ و زمان را کامل وارد کنید.',
        });
        return;
      }
      data = {
        ...data,
        type: 3,
        fromdate: fromDate.toISOString().split("T")[0],
        todate: toDateVal.toISOString().split("T")[0],
        fromtime_2: fromTimeMulti,
        totime_2: toTimeMulti,
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
      setFromTimeMulti("");
      setToTimeMulti("");
      setHourlyDate(null);
      setDateRange({ from: null, to: null });
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

      <div className="px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="w-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-4">
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">درخواست مرخصی جدید</h1>
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/leaves')}
                className="text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="ml-2 h-4 w-4" />
                بازگشت
              </Button>
            </div>
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md rounded-lg shadow-none max-w-4xl mx-auto">
              <CardHeader className="pb-2">
                <CardTitle className="text-zinc-900 dark:text-zinc-100 text-base sm:text-lg">فرم درخواست مرخصی</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 pb-4 px-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* نوع مرخصی */}
                  <div>
                    <label className="block mb-4 font-semibold text-zinc-700 dark:text-zinc-200 text-base sm:text-lg">نوع مرخصی</label>
                    <div className="flex gap-3 justify-center">
                      {leaveTypes.map((type) => (
                        <button
                          type="button"
                          key={type.value}
                          className={cn(
                            "px-4 py-2 rounded-md border transition text-sm focus:outline-none focus:ring-2 focus:ring-blue-400",
                            leaveType === type.value
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex-1">
                        <label className="block mb-1 font-medium text-zinc-700 dark:text-zinc-200">تاریخ</label>
                        <DatePicker
                          value={hourlyDate}
                          onChange={setHourlyDate}
                          calendar={persian}
                          locale={persian_fa}
                          calendarPosition="bottom-right"
                          style={{ width: "100%" }}
                          inputClass="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <TimePicker label="از ساعت" value={fromTime} onChange={setFromTime} variant="minimal" />
                      </div>
                      <div className="flex-1">
                        <TimePicker label="تا ساعت" value={toTime} onChange={setToTime} variant="minimal" />
                      </div>
                    </div>
                  )}
                  {leaveType === "multiday" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-1">
                          <label className="block mb-1 font-medium text-zinc-700 dark:text-zinc-200">از تاریخ</label>
                          <DatePicker
                            value={dateRange.from}
                            onChange={date => setDateRange(prev => ({ ...prev, from: date }))}
                            calendar={persian}
                            locale={persian_fa}
                            calendarPosition="bottom-right"
                            style={{ width: "100%" }}
                            inputClass="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="col-span-1">
                          <TimePicker label="از ساعت" value={fromTimeMulti} onChange={setFromTimeMulti} variant="minimal" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-1">
                          <label className="block mb-1 font-medium text-zinc-700 dark:text-zinc-200">تا تاریخ</label>
                          <DatePicker
                            value={dateRange.to}
                            onChange={date => setDateRange(prev => ({ ...prev, to: date }))}
                            calendar={persian}
                            locale={persian_fa}
                            calendarPosition="bottom-right"
                            style={{ width: "100%" }}
                            inputClass="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="col-span-1">
                          <TimePicker label="تا ساعت" value={toTimeMulti} onChange={setToTimeMulti} variant="minimal" />
                        </div>
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
                      className="resize-none rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2.5 rounded-md"
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
        </div>
      </div>
    </PageTransition>
  );
}
