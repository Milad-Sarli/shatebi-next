"use client";

import * as React from "react";
import {
  Search,
  TrendingUp,
  BookOpen,
  Users,
  BarChart3,
  Target,
  ArrowLeftRight,
  GraduationCap,
  FileSpreadsheet,
  Award,
  AlertTriangle,
  Star,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/ui/page-transition";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from "recharts";
import { useAuthStore } from "@/lib/store/auth.store";
import { reportService, StudentProgressResponse, ContentProgressResponse, OverviewResponse } from "@/lib/services/report.service";
import { Student } from "@/lib/services/student.service";
import { SingleSelectCombobox } from "@/components/ui/Combobox";
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"];

const MotionCard = motion(Card);

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 min-w-0 dark:bg-neutral-900 dark:border-neutral-800"
    >
      <CardContent className="flex items-start gap-3 sm:gap-4 p-3 sm:p-5 flex-row-reverse sm:flex-row-reverse">
        <div className="shrink-0 rounded-lg p-2 sm:p-2.5" style={{ backgroundColor: color + "20" }}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color }} />
        </div>
        <div className="space-y-1.5 sm:space-y-2 min-w-0 flex-1 text-right">
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate leading-relaxed">{label}</p>
          <p className="text-sm sm:text-xl font-bold tabular-nums leading-relaxed break-words">{value}</p>
          {sub && <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed">{sub}</p>}
        </div>
      </CardContent>
    </MotionCard>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LessonAreaBadge({ area, compact }: { area: any; compact?: boolean }) {
  if (!area) return <span className="text-xs text-muted-foreground">—</span>;

  const parts: string[] = [];
  if (area.start_surah?.titleAr && area.end_surah?.titleAr) {
    parts.push(`${area.start_surah.titleAr} ${area.start_verse ?? ''} → ${area.end_surah.titleAr} ${area.end_verse ?? ''}`);
  }
  if (area.start_page && area.end_page) {
    parts.push(`صفحه ${area.start_page} → ${area.end_page}`);
  }
  if (area.start_joze && area.end_joze) {
    parts.push(`جزء ${area.start_joze} → ${area.end_joze}`);
  }

  return (
    <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>
      {parts.join(' | ') || '—'}
    </span>
  );
}

function ScoreGauge({ score, size = 'sm' }: { score: number; size?: 'sm' | 'md' }) {
  const getColor = (s: number) => {
    if (s >= 90) return '#22c55e';
    if (s >= 80) return '#3b82f6';
    if (s >= 70) return '#f59e0b';
    return '#ef4444';
  };
  const cls = size === 'md' ? 'h-2.5' : 'h-1.5';
  return (
    <div className={`${cls} w-full rounded-full bg-muted overflow-hidden`}>
      <div
        className={`${cls} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(score, 100)}%`, backgroundColor: getColor(score) }}
      />
    </div>
  );
}

export default function ReportsPage() {
  const { accessToken } = useAuthStore();
  const tenantId = useAuthStore((s) => s.user?.tenant_id);

  // Tab state
  const [activeTab, setActiveTab] = React.useState("student");

  // Student progress state
  const [students, setStudents] = React.useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = React.useState<string>("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [selectedDars, setSelectedDars] = React.useState<string>("all");
  const [studentProgress, setStudentProgress] = React.useState<StudentProgressResponse | null>(null);
  const [loadingProgress, setLoadingProgress] = React.useState(false);

  // Content progress state
  const [contentPageStart, setContentPageStart] = React.useState("");
  const [contentPageEnd, setContentPageEnd] = React.useState("");
  const [contentJozeStart, setContentJozeStart] = React.useState("");
  const [contentJozeEnd, setContentJozeEnd] = React.useState("");
  const [contentDars, setContentDars] = React.useState<string>("all");
  const [contentStartDate, setContentStartDate] = React.useState("");
  const [contentEndDate, setContentEndDate] = React.useState("");
  const [contentProgress, setContentProgress] = React.useState<ContentProgressResponse | null>(null);
  const [loadingContent, setLoadingContent] = React.useState(false);

  // Overview state
  const [overview, setOverview] = React.useState<OverviewResponse | null>(null);
  const [, setOverviewLoading] = React.useState(false);

  // Fetch students on mount
  React.useEffect(() => {
    if (!accessToken) return;
    const tid = tenantId ?? 1;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/students?per_page=500&status=${encodeURIComponent('در حال تحصیل')}&tenant_id=${tid}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    })
      .then((r) => r.json())
      .then((res) => {
        const r = res as { data?: { data?: unknown[] } };
        const list = r?.data?.data ?? r?.data ?? [];
        setStudents(Array.isArray(list) ? (list as Student[]) : []);
      })
      .catch(() => {});
  }, [accessToken, tenantId]);

  // Fetch student progress
  const fetchStudentProgress = React.useCallback(async () => {
    if (!selectedStudent || !accessToken) return;
    setLoadingProgress(true);
    try {
      const data = await reportService.getStudentProgress(
        Number(selectedStudent),
        {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          droos_id: selectedDars !== "all" ? Number(selectedDars) : undefined,
        },
        accessToken
      );
      setStudentProgress(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProgress(false);
    }
  }, [selectedStudent, startDate, endDate, selectedDars, accessToken]);

  // Fetch content progress
  const fetchContentProgress = React.useCallback(async () => {
    if (!accessToken) return;
    setLoadingContent(true);
    try {
      const data = await reportService.getContentProgress(
        {
          start_date: contentStartDate || undefined,
          end_date: contentEndDate || undefined,
          droos_id: contentDars !== "all" ? Number(contentDars) : undefined,
          start_page: contentPageStart ? Number(contentPageStart) : undefined,
          end_page: contentPageEnd ? Number(contentPageEnd) : undefined,
          start_joze: contentJozeStart ? Number(contentJozeStart) : undefined,
          end_joze: contentJozeEnd ? Number(contentJozeEnd) : undefined,
        },
        accessToken
      );
      setContentProgress(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingContent(false);
    }
  }, [contentStartDate, contentEndDate, contentDars, contentPageStart, contentPageEnd, contentJozeStart, contentJozeEnd, accessToken]);

  // Fetch overview
  const fetchOverview = React.useCallback(async () => {
    if (!accessToken) return;
    setOverviewLoading(true);
    try {
      const data = await reportService.getOverview(
        {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
        accessToken
      );
      setOverview(data);
    } catch (e) {
      console.error(e);
    } finally {
      setOverviewLoading(false);
    }
  }, [startDate, endDate, accessToken]);

  // Auto-fetch overview on mount
  React.useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const [droosList, setDroosList] = React.useState<{ id: number; title: string; parent_id: number | null; parent_dars?: { id: number; title: string } | null }[]>([]);
  React.useEffect(() => {
    if (!accessToken) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/droos?per_page=500`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    })
      .then((r) => r.json())
      .then((data) => {
        const all = Array.isArray(data) ? data : data?.data ?? [];
        setDroosList(Array.isArray(all) ? all : []);
      })
      .catch(() => {});
  }, [accessToken]);

  const studentOptions = React.useMemo(() => {
    return students.map((s) => ({
      value: String(s.id),
      label: `${s.Fname} ${s.Lname}${s.StudentCode ? ` (${s.StudentCode})` : ''}`,
    }));
  }, [students]);

  const childDarsOptions = React.useMemo(() => {
    return droosList
      .filter((d) => d.parent_id != null)
      .map((d) => ({
        value: String(d.id),
        label: d.parent_dars ? `${d.title} (${d.parent_dars.title})` : d.title,
      }));
  }, [droosList]);

  return (
    <PageTransition>
      <div className="flex flex-col gap-3 sm:gap-6 w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-primary" />
              گزارشات پیشرفت
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              تحلیل جامع عملکرد و پیشرفت تحصیلی دانش‌آموزان
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
            <TabsTrigger value="student" className="text-xs sm:text-sm">
              <GraduationCap className="h-4 w-4 ml-1 hidden sm:inline" />
              پیشرفت دانش‌آموز
            </TabsTrigger>
            <TabsTrigger value="content" className="text-xs sm:text-sm">
              <Search className="h-4 w-4 ml-1 hidden sm:inline" />
              جستجوی محتوا
            </TabsTrigger>
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4 ml-1 hidden sm:inline" />
              نمای کلی
            </TabsTrigger>
          </TabsList>

          {/* ============ TAB 1: Student Progress ============ */}
          <TabsContent value="student" className="space-y-6 mt-4 text-right">
            {/* Filters */}
            <Card className="dark:bg-neutral-900 dark:border-neutral-800">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">دانش‌آموز</label>
                    <SingleSelectCombobox
                      options={studentOptions}
                      value={selectedStudent}
                      onChange={setSelectedStudent}
                      placeholder="انتخاب دانش‌آموز..."
                      emptyMessage="نتیجه‌ای یافت نشد"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">تا تاریخ</label>
                    <DatePicker
                      value={endDate || null}
                      onChange={(d) => setEndDate(d?.format() || '')}
                      calendar={persian}
                      locale={persian_fa}
                      calendarPosition="bottom-right"
                      containerClassName="w-full block"
                      inputClass="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 px-3 py-2"
                      placeholder="انتخاب تا تاریخ"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">از تاریخ</label>
                    <DatePicker
                      value={startDate || null}
                      onChange={(d) => setStartDate(d?.format() || '')}
                      calendar={persian}
                      locale={persian_fa}
                      calendarPosition="bottom-right"
                      containerClassName="w-full block"
                      inputClass="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 px-3 py-2"
                      placeholder="انتخاب از تاریخ"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">نوع درس</label>
                    <SingleSelectCombobox
                      options={[{ value: "all", label: "همه دروس" }, ...childDarsOptions]}
                      value={selectedDars}
                      onChange={setSelectedDars}
                      placeholder="انتخاب درس..."
                      emptyMessage="نتیجه‌ای یافت نشد"
                    />
                  </div>
                </div>
                <Button onClick={fetchStudentProgress} disabled={!selectedStudent || loadingProgress} className="mt-3 w-full sm:w-auto">
                  {loadingProgress ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Search className="h-4 w-4 ml-2" />}
                  نمایش گزارش
                </Button>
              </CardContent>
            </Card>

            {/* Student Progress Results */}
            <AnimatePresence mode="wait">
              {studentProgress && (
                <motion.div
                  key="student-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Student Info + Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    <StatCard icon={GraduationCap} label="نام دانش‌آموز" value={`${studentProgress.student.fname} ${studentProgress.student.lname}`} color="#3b82f6" />
                    <StatCard icon={BookOpen} label="کد دانش‌آموزی" value={studentProgress.student.student_code || '—'} color="#8b5cf6" />
                    <StatCard icon={Target} label="تعداد نمرات" value={studentProgress.grades.length} color="#22c55e" />
                    <StatCard icon={Award} label="میانگین کل" value={
                      studentProgress.grades.length > 0
                        ? Math.round(studentProgress.grades.reduce((a, g) => a + g.total, 0) / studentProgress.grades.length)
                        : '—'
                    } color="#f59e0b" />
                    <StatCard icon={TrendingUp} label="حضور" value={
                      studentProgress.attendance.attendance_rate !== null
                        ? `${studentProgress.attendance.attendance_rate}%`
                        : '—'
                    } sub={`${studentProgress.attendance.total} جلسه`} color="#06b6d4" />
                    <StatCard icon={AlertTriangle} label="غیبت" value={studentProgress.attendance.absents} color="#ef4444" />
                  </div>

                  {/* Pages by Lesson */}
                  {studentProgress.pages_by_lesson.length > 0 && (
                    <Card className="dark:bg-neutral-900 dark:border-neutral-800">
                      <CardHeader className="flex-row items-center justify-between py-2 sm:py-3 px-3 sm:px-4">
                        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary shrink-0" />
                          صفحات تحویل داده شده
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {studentProgress.pages_by_lesson.reduce((a, b) => a + b.total_pages, 0)} صفحه
                        </Badge>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {studentProgress.pages_by_lesson.map((p) => (
                            <div key={p.lesson_id} className="flex items-center justify-between gap-2 p-2 sm:p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-medium truncate">{p.lesson_title}</p>
                                  {p.parent_title && <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">{p.parent_title}</p>}
                                </div>
                              </div>
                              <div className="text-left shrink-0">
                                <p className="text-sm sm:text-base font-bold tabular-nums">{p.total_pages}</p>
                                <p className="text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap">{p.total_grades} نمره</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Score Trend Chart */}
                  {studentProgress.score_trend.length > 0 && (
                    <Card className="dark:bg-neutral-900 dark:border-neutral-800">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2 justify-end">
                          روند نمرات
                          <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={studentProgress.score_trend}>
                              <defs>
                                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="jalali_date" fontSize={10} />
                              <YAxis domain={[0, 100]} fontSize={10} />
                              <Tooltip />
                              <Area type="monotone" dataKey="avg_score" stroke="#3b82f6" fill="url(#scoreGradient)" strokeWidth={2} name="میانگین نمره" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Progress by Lesson Type */}
                  {studentProgress.progress_by_lesson.length > 0 && (
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                        پیشرفت به تفکیک درس
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        {studentProgress.progress_by_lesson.map((pl, idx) => (
                           <MotionCard
                             key={pl.lesson.id}
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: idx * 0.05 }}
                             className="dark:bg-neutral-900 dark:border-neutral-800"
                           >
                            <CardHeader className="flex-row items-center justify-between py-2.5 sm:py-3 px-3 sm:px-4">
                              <CardTitle className="text-xs sm:text-sm font-medium">{pl.lesson.title}</CardTitle>
                              <Badge variant="outline" className="text-[9px] sm:text-[10px] shrink-0">{pl.total_grades} نمره</Badge>
                            </CardHeader>
                            <CardContent className="space-y-2.5 sm:space-y-3 px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
                              {/* Score bar + min/max */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] sm:text-xs">
                                  <span className="text-muted-foreground">میانگین</span>
                                  <span className="font-bold tabular-nums" style={{ color: pl.avg_total >= 80 ? '#22c55e' : '#ef4444' }}>
                                    {pl.avg_total}
                                  </span>
                                </div>
                                <ScoreGauge score={pl.avg_total} size="md" />
                                <div className="flex justify-between text-[9px] sm:text-[10px] text-muted-foreground">
                                  <span>کمترین: {pl.min_score ?? '—'}</span>
                                  <span>بیشترین: {pl.max_score ?? '—'}</span>
                                </div>
                              </div>

                              {/* Progress range */}
                              <div className="border-t pt-2.5 sm:pt-3 space-y-1.5">
                                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">محدوده پیشرفت:</p>
                                <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                                  <span className="text-muted-foreground shrink-0">از</span>
                                  <LessonAreaBadge area={pl.first_area} compact />
                                  <ArrowLeftRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0" />
                                  <span className="text-muted-foreground shrink-0">تا</span>
                                  <LessonAreaBadge area={pl.last_area} compact />
                                </div>
                              </div>

                              {/* Score details */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 border-t pt-2.5 sm:pt-3">
                                {[
                                  { label: 'حفظ', value: pl.avg_hefz },
                                  { label: 'تجوید', value: pl.avg_tajvid },
                                  { label: 'صوت', value: pl.avg_sout },
                                  { label: 'دقت', value: pl.avg_details },
                                ].map((item) => (
                                  <div key={item.label} className="text-center rounded-md bg-muted/30 py-1.5 sm:py-2 px-1">
                                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">{item.label}</p>
                                    <p className="text-xs sm:text-sm font-bold tabular-nums">{item.value ?? '—'}</p>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </MotionCard>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grades Table */}
                  {studentProgress.grades.length > 0 && (
                    <Card className="dark:bg-neutral-900 dark:border-neutral-800">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2 justify-end">
                          جزئیات نمرات
                          <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="text-right p-2 font-medium">تاریخ</th>
                                <th className="text-right p-2 font-medium">درس</th>
                                <th className="text-center p-2 font-medium">حفظ</th>
                                <th className="text-center p-2 font-medium">تجوید</th>
                                <th className="text-center p-2 font-medium">صوت</th>
                                <th className="text-center p-2 font-medium">دقت</th>
                                <th className="text-center p-2 font-medium">نمره</th>
                                <th className="text-right p-2 font-medium">محدوده</th>
                                <th className="text-right p-2 font-medium">استاد</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentProgress.grades.map((g) => (
                                <tr key={g.id} className="border-b hover:bg-muted/30 transition-colors">
                                  <td className="p-2 whitespace-nowrap">{g.jalali_date}</td>
                                  <td className="p-2">{g.dars?.title ?? '—'}</td>
                                  <td className="p-2 text-center">{g.hefz ?? '—'}</td>
                                  <td className="p-2 text-center">{g.tajvid ?? '—'}</td>
                                  <td className="p-2 text-center">{g.sout ?? '—'}</td>
                                  <td className="p-2 text-center">{g.details ?? '—'}</td>
                                  <td className="p-2 text-center">
                                    <span className={`font-medium tabular-nums ${g.total < 80 ? 'text-red-500' : 'text-green-500'}`}>
                                      {g.total}
                                    </span>
                                  </td>
                                  <td className="p-2 max-w-[180px] truncate" title={g.lesson_area ? `${g.lesson_area.start_page ?? ''} → ${g.lesson_area.end_page ?? ''}` : ''}>
                                    <LessonAreaBadge area={g.lesson_area} compact />
                                  </td>
                                  <td className="p-2 whitespace-nowrap">{g.master ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* ============ TAB 2: Content Lookup ============ */}
          <TabsContent value="content" className="space-y-6 mt-4" dir="rtl">
            <Card className="dark:bg-neutral-900 dark:border-neutral-800">
              <CardContent className="p-4 space-y-5">
                {/* ردیف اول: درس */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2">نوع درس</h3>
                  <SingleSelectCombobox
                    options={[{ value: "all", label: "همه دروس" }, ...childDarsOptions]}
                    value={contentDars}
                    onChange={setContentDars}
                    placeholder="انتخاب درس..."
                    emptyMessage="نتیجه‌ای یافت نشد"
                  />
                </div>

                {/* ردیف دوم: محدوده صفحه + جزء */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2">محدوده جستجو</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">از صفحه</label>
                      <Input type="number" min={1} placeholder="۱" value={contentPageStart} onChange={(e) => setContentPageStart(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">تا صفحه</label>
                      <Input type="number" min={1} placeholder="۶۰۴" value={contentPageEnd} onChange={(e) => setContentPageEnd(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">از جزء</label>
                      <Input type="number" min={1} max={30} placeholder="۱" value={contentJozeStart} onChange={(e) => setContentJozeStart(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">تا جزء</label>
                      <Input type="number" min={1} max={30} placeholder="۳۰" value={contentJozeEnd} onChange={(e) => setContentJozeEnd(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* ردیف سوم: بازه تاریخ */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2">بازه تاریخ</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">تا تاریخ</label>
                      <DatePicker
                        value={contentEndDate || null}
                        onChange={(d) => setContentEndDate(d?.format() || '')}
                        calendar={persian}
                        locale={persian_fa}
                        calendarPosition="bottom-right"
                        containerClassName="w-full block"
                        inputClass="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 px-3 py-2"
                        placeholder="انتخاب تا تاریخ"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">از تاریخ</label>
                      <DatePicker
                        value={contentStartDate || null}
                        onChange={(d) => setContentStartDate(d?.format() || '')}
                        calendar={persian}
                        locale={persian_fa}
                        calendarPosition="bottom-right"
                        containerClassName="w-full block"
                        inputClass="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 px-3 py-2"
                        placeholder="انتخاب از تاریخ"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={fetchContentProgress} disabled={loadingContent} className="w-full sm:w-auto">
                  {loadingContent ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Search className="h-4 w-4 ml-2" />}
                  جستجو
                </Button>
              </CardContent>
            </Card>

            <AnimatePresence mode="wait">
              {contentProgress && (
                <motion.div
                  key="content-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StatCard icon={Users} label="تعداد دانش‌آموزان" value={contentProgress.total_students} color="#3b82f6" />
                    <StatCard icon={FileSpreadsheet} label="تعداد نمرات" value={contentProgress.total_grades} color="#22c55e" />
                    <StatCard icon={BookOpen} label="محدوده‌های درسی" value={contentProgress.matched_lesson_areas.length} color="#8b5cf6" />
                  </div>

                  {contentProgress.students.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {contentProgress.students.map((s, idx) => (
                        <MotionCard
                          key={s.student.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="dark:bg-neutral-900 dark:border-neutral-800"
                        >
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center justify-between">
                              <span className="truncate">{s.student.fname} {s.student.lname}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="secondary" className="text-[10px]">
                                  {s.total_grades} نمره
                                </Badge>
                                <Badge className={`text-[10px] ${s.avg_score >= 80 ? '' : 'bg-red-500'}`}>
                                  میانگین {s.avg_score}
                                </Badge>
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <ScoreGauge score={s.avg_score} size="sm" />
                            <div className="overflow-x-auto">
                              <table className="w-full text-[10px]">
                                <thead>
                                  <tr className="border-b text-muted-foreground">
                                    <th className="text-right p-1 font-medium">تاریخ</th>
                                    <th className="text-right p-1 font-medium">درس</th>
                                    <th className="text-center p-1 font-medium">نمره</th>
                                    <th className="text-right p-1 font-medium">محدوده</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {s.grades.slice(0, 5).map((g) => (
                                    <tr key={g.id} className="border-b">
                                      <td className="p-1 whitespace-nowrap">{g.jalali_date}</td>
                                      <td className="p-1">{g.dars ?? '—'}</td>
                                      <td className="p-1 text-center">
                                        <span className={g.total < 80 ? 'text-red-500' : ''}>{g.total}</span>
                                      </td>
                                      <td className="p-1 max-w-[120px] truncate">
                                        <LessonAreaBadge area={g.lesson_area} compact />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </MotionCard>
                      ))}
                    </div>
                  ) : (
                    <Card className="dark:bg-neutral-900 dark:border-neutral-800">
                      <CardContent className="p-8 text-center text-muted-foreground">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>هیچ داده‌ای برای این محدوده پیدا نشد</p>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* ============ TAB 3: Overview ============ */}
          <TabsContent value="overview" className="space-y-6 mt-4 text-right">
            <AnimatePresence mode="wait">
              {overview ? (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard icon={FileSpreadsheet} label="کل نمرات" value={overview.total_grades} color="#3b82f6" />
                    <StatCard icon={Award} label="میانگین کل" value={overview.avg_score} color="#22c55e" />
                    <StatCard icon={AlertTriangle} label="نمرات منفی" value={overview.negative_count} sub={`از ${overview.total_grades} نمره`} color="#ef4444" />
                    <StatCard icon={Users} label="دانش‌آموزان فعال" value={overview.active_students} color="#8b5cf6" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Students */}
                    <Card className="dark:bg-neutral-900 dark:border-neutral-800">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          دانش‌آموزان برتر
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {overview.top_students.map((s, idx) => (
                            <div key={s.student_id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-bold text-muted-foreground w-5">{idx + 1}</span>
                                <span className="text-sm truncate">{s.student_name}</span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-[10px] text-muted-foreground">{s.grade_count} نمره</span>
                                <Badge className="text-[10px]">{s.avg_score}</Badge>
                              </div>
                            </div>
                          ))}
                          {overview.top_students.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">داده‌ای موجود نیست</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Lesson Breakdown */}
                    <Card className="dark:bg-neutral-900 dark:border-neutral-800">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          توزیع دروس
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={overview.lesson_breakdown} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" fontSize={10} />
                              <YAxis dataKey="lesson" type="category" fontSize={10} width={90} />
                              <Tooltip />
                              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                {overview.lesson_breakdown.map((_, idx) => (
                                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Lesson Avg Scores */}
                    <Card className="lg:col-span-2 dark:bg-neutral-900 dark:border-neutral-800">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          میانگین نمرات به تفکیک درس
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={overview.lesson_breakdown}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="lesson" fontSize={10} />
                              <YAxis domain={[0, 100]} fontSize={10} />
                              <Tooltip />
                              <Bar dataKey="avg_score" radius={[4, 4, 0, 0]}>
                                {overview.lesson_breakdown.map((_, idx) => (
                                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ) : (
                <Card className="dark:bg-neutral-900 dark:border-neutral-800">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                    <p>در حال بارگذاری...</p>
                  </CardContent>
                </Card>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
