"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth.context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/ui/page-transition";
import { optimizedNumberService } from "@/lib/services/number.service";
import {
  optimizedClassService,
  OptimizedClass,
  Student,
} from "@/lib/services/optimizedClass.service";
import { Calendar } from "@/components/ui/calendar";
import { faIR } from "date-fns/locale";
import { format } from "date-fns-jalali";
import { useState } from "react";

export default function AddNumberPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [classes, setClasses] = React.useState<OptimizedClass[]>([]);
  const [selectedClass, setSelectedClass] =
    React.useState<OptimizedClass | null>(null);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [existingGrades, setExistingGrades] = React.useState<
    Record<number, boolean>
  >({});

  React.useEffect(() => {
    const fetchClasses = async () => {
      if (!accessToken) return;

      try {
        const data = await optimizedClassService.getAll(accessToken);
        setClasses(data);
      } catch (error) {
        console.error(error);
        toast.error("Error loading classes");
      }
    };

    fetchClasses();
  }, [accessToken]);

  React.useEffect(() => {
    const fetchStudents = async () => {
      if (!accessToken || !selectedClass) return;

      try {
        const data = await optimizedClassService.getStudents(
          selectedClass.id,
          accessToken
        );

        // Ensure unique student IDs by using a Map
        const uniqueStudentsMap = new Map();
        data.forEach((student) => {
          if (!uniqueStudentsMap.has(student.id)) {
            uniqueStudentsMap.set(student.id, student);
          }
        });

        setStudents(Array.from(uniqueStudentsMap.values()));

        // Fetch existing grades for the selected date
        const grades = await optimizedNumberService.getByClass(
          selectedClass.id,
          accessToken
        );
        const gradesMap: Record<number, boolean> = {};
        const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

        grades.forEach((grade) => {
          const gradeDate = format(new Date(grade.created_at), "yyyy-MM-dd");
          if (gradeDate === selectedDateStr) {
            gradesMap[grade.student_id] = true;
          }
        });

        setExistingGrades(gradesMap);
      } catch (error) {
        console.error(error);
        toast.error("Error loading students");
      }
    };

    fetchStudents();
  }, [accessToken, selectedClass, selectedDate]);

  const handleClassChange = (classId: string) => {
    const selected = classes.find((c) => c.id.toString() === classId);
    setSelectedClass(selected || null);
  };

  const handleAddNumber = async (studentId: number) => {
    if (!accessToken || !selectedClass) return;

    try {
      setLoading(true);
      await optimizedNumberService.create(
        {
          class_id: selectedClass.id,
          master_id: selectedClass.optimized_class_masters?.[0]?.user_id || 0,
          student_id: studentId,
          droos_id: selectedClass.droos_id,
          hefz: 0,
          details: 0,
          tajvid: 0,
          sout: 0,
          number: 0,
          practice_count: 0,
          lesson_area_id: 0,
          user_id: 0,
          tenant_id: 0,
        },
        accessToken
      );
      toast.success("Number added successfully");
      // Refresh the grades list
      const grades = await optimizedNumberService.getByClass(
        selectedClass.id,
        accessToken
      );
      const gradesMap: Record<number, boolean> = {};
      const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

      grades.forEach((grade) => {
        const gradeDate = format(new Date(grade.created_at), "yyyy-MM-dd");
        if (gradeDate === selectedDateStr) {
          gradesMap[grade.student_id] = true;
        }
      });

      setExistingGrades(gradesMap);
    } catch (error) {
      console.error(error);
      toast.error("Error adding number");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg bg-white dark:bg-zinc-900 p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            افزودن نمره جدید
          </h1>
        </div>

        <Card className="border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="text-zinc-900 dark:text-zinc-100">
              انتخاب کلاس و تاریخ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Select onValueChange={handleClassChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب کلاس" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {classes.map((classItem) => (
                      <SelectItem
                        key={classItem.id}
                        value={classItem.id.toString()}
                      >
                        {classItem.dars?.title || "بدون نام"} -{" "}
                        {classItem.optimized_class_masters?.[0]?.master
                          ?.fullname ||
                          classItem.optimized_class_masters?.[0]?.users
                            ?.fullname ||
                          "بدون استاد"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={faIR}
                  className="rounded-md border"
                />
              </div>
            </div>

            {selectedClass && (
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  تاریخ: {format(selectedDate, "yyyy/MM/dd")}
                </h2>
                <div className="grid gap-4">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800"
                    >
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {student.Fname} {student.Lname}
                      </span>
                      <Button
                        onClick={() => handleAddNumber(student.id)}
                        disabled={loading || existingGrades[student.id]}
                        className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        {existingGrades[student.id]
                          ? "نمره ثبت شده"
                          : "افزودن نمره"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
