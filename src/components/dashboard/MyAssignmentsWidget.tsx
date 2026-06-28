"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  JuzService,
  StudentTask,
  getDayName,
} from "@/lib/services/juz.service";
import {
  BookMarked,
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

function getTodayPersianDay(): number {
  const jsDay = new Date().getDay();
  return (jsDay + 1) % 7;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function isTaskActive(task: StudentTask): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateFrom = new Date(task.date_from);
  const dateTo = new Date(task.date_to);
  return today >= dateFrom && today <= dateTo;
}

interface JuzItem {
  juz_number: number;
  day_of_week: number;
}

function getTaskItems(task: StudentTask): JuzItem[] {
  if (task.assignments && task.assignments.length > 0) {
    return task.assignments.map((a) => ({
      juz_number: a.juz_number,
      day_of_week: a.day_of_week,
    }));
  }
  if (Array.isArray(task.juz_list)) {
    return task.juz_list.map((j) => ({ juz_number: j, day_of_week: -1 }));
  }
  return [];
}

interface TaskCardProps {
  task: StudentTask;
  onToggle: (taskId: number, juzNumber: number, currentlyRead: boolean) => void;
  togglingId: number | null;
  todayPersianDay: number;
}

const TaskCard = React.memo(function TaskCard({
  task,
  onToggle,
  togglingId,
  todayPersianDay,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const active = isTaskActive(task);

  const items = useMemo(() => getTaskItems(task), [task]);

  if (active && items.length === 0) return null;

  const allRead = items.every((j) => task.read_juz.includes(j.juz_number));
  const someRead = items.some((j) => task.read_juz.includes(j.juz_number));
  const readCount = items.filter((j) =>
    task.read_juz.includes(j.juz_number)
  ).length;
  const progressLabel = `${readCount}/${items.length}`;

  return (
    <Card
      className={cn(
        "bg-white dark:bg-zinc-900 border rounded-xl shadow-sm overflow-hidden transition-all",
        active
          ? "border-emerald-200 dark:border-emerald-800"
          : "border-zinc-200 dark:border-zinc-700 opacity-70"
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-right hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
              active
                ? "bg-emerald-100 dark:bg-emerald-900/40"
                : "bg-zinc-100 dark:bg-zinc-800"
            )}
          >
            <BookMarked
              className={cn(
                "h-4 w-4",
                active
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-400"
              )}
            />
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              تکلیف {formatDate(task.date_from)} تا {formatDate(task.date_to)}
            </div>
            <div className="mt-0.5 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500">
                  {progressLabel} جزء
                </span>
                {!active && (
                  <span className="text-[11px] text-zinc-400">
                    (پایان یافته)
                  </span>
                )}
              </div>
              {active && (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed block">
                  پس از اتمام مهلت، تحویل ممکن نیست (جریمه دارد)
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allRead && active && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              کامل
            </span>
          )}
          {someRead && !allRead && active && (
            <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              {progressLabel}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-50 dark:divide-zinc-800/50">
          {items.map((item) => {
            const isRead = task.read_juz.includes(item.juz_number);
            const isToggling = togglingId === item.juz_number;
            return (
              <div
                key={item.juz_number}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    جزء {item.juz_number}
                  </span>
                  {item.day_of_week >= 0 && (
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                      {getDayName(item.day_of_week)}
                    </span>
                  )}
                </div>
                {active &&
                (item.day_of_week < 0 ||
                  item.day_of_week === todayPersianDay) ? (
                  <Button
                    variant={isRead ? "secondary" : "outline"}
                    size="sm"
                    disabled={isToggling}
                    onClick={() => onToggle(task.id, item.juz_number, isRead)}
                    className={cn(
                      "h-8 text-xs gap-1.5 transition-all",
                      isRead
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                        : "text-zinc-600 dark:text-zinc-400 hover:border-emerald-300 dark:hover:border-emerald-600"
                    )}
                  >
                    {isToggling ? (
                      <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    ) : isRead ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Circle className="h-3.5 w-3.5" />
                    )}
                    {isRead ? "خوانده شده" : "علامت خواندن"}
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                    {isRead ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>خوانده شده</span>
                      </>
                    ) : (
                      <>
                        <Circle className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600" />
                        <span>خوانده نشده</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
});

export default function MyAssignmentsWidget() {
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [showPast, setShowPast] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await JuzService.getMyTasks();
      if (res.status === "success" && Array.isArray(res.data)) {
        setTasks(res.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const { toast } = useToast();

  const handleToggle = useCallback(
    async (taskId: number, juzNumber: number, currentlyRead: boolean) => {
      setTogglingId(juzNumber);

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          if (currentlyRead) {
            return {
              ...t,
              read_juz: t.read_juz.filter((j) => j !== juzNumber),
            };
          }
          if (!t.read_juz.includes(juzNumber)) {
            return { ...t, read_juz: [...t.read_juz, juzNumber] };
          }
          return t;
        })
      );

      try {
        if (currentlyRead) {
          await JuzService.unmarkTaskJuz(taskId, juzNumber);
          toast({ title: "جزء با موفقیت حذف شد", type: "destructive" });
        } else {
          await JuzService.markTaskJuz(taskId, juzNumber);
          toast({ title: "جزء با موفقیت ثبت شد", type: "default" });
        }
      } catch (e) {
        console.error("خطا در ثبت خواندن جزء:", e);
        toast({ title: "خطا در ثبت خواندن", description: "دوباره تلاش کنید", type: "destructive" });
        // Rollback optimistic update
        await fetchTasks();
      } finally {
        setTogglingId(null);
      }
    },
    [fetchTasks, toast]
  );

  const todayPersianDay = useMemo(() => getTodayPersianDay(), []);

  const activeTasks = tasks.filter((t) => isTaskActive(t));
  const pastTasks = tasks.filter((t) => !isTaskActive(t));

  if (loading) {
    return (
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 animate-pulse" />
          <div className="h-5 w-36 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <BookMarked className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              تکالیف جزء خوانی من
            </h3>
          </div>
        </div>
        <div className="px-5 py-8 text-center">
          <BookMarked className="h-8 w-8 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            برای شما تکلیفی تعیین نشده است
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
          <BookMarked className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            تکالیف جزء خوانی من
          </h3>
          <p className="text-[11px] text-zinc-500">
            {activeTasks.length} تکلیف فعال
          </p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {activeTasks.length === 0 && pastTasks.length === 0 && (
          <p className="text-center text-sm text-zinc-400 py-6">
            هیچ تکلیفی برای شما ثبت نشده است
          </p>
        )}

        {activeTasks.slice(0, 3).map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggle={handleToggle}
            togglingId={togglingId}
            todayPersianDay={todayPersianDay}
          />
        ))}

        {activeTasks.length > 3 && (
          <p className="text-center text-xs text-zinc-400">
            و {activeTasks.length - 3} تکلیف فعال دیگر
          </p>
        )}
      </div>

      {pastTasks.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowPast(!showPast)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <History className="h-3.5 w-3.5" />
            {showPast ? "بستن تکالیف گذشته" : `${pastTasks.length} تکلیف گذشته`}
          </button>

          {showPast && (
            <div className="px-4 pb-4 space-y-3">
              {pastTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  togglingId={togglingId}
                  todayPersianDay={todayPersianDay}
                />
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
