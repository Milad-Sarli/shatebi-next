"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/context/auth.context";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/page-transition";
import {
  optimizedClassService,
} from "@/lib/services/optimizedClass.service";
import { MultiSelectComboBox } from "@/components/ui/MultiSelectComboBox";
import { ArrowLeft } from "lucide-react";

interface Student {
  id: number;
  Fname: string;
  Lname: string;
}

interface Lesson {
  id: number;
  name: string;
}

interface Teacher {
  id: number;
  fullname: string;
}

export default function AddClassPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [formData, setFormData] = React.useState({
    tenant_id: 1, // You may need to get this from your auth context
    user_ids: [] as number[],
    droos_ids: [] as number[],
    teacher_ids: [] as number[],
    status: "active",
  });

  React.useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      try {
        const classesResponse = await optimizedClassService.getAll(accessToken);
        
        // Extract unique students
        const uniqueStudents = new Map<number, Student>();
        classesResponse.forEach((cls) => {
          cls.optimized_class_items?.forEach((item) => {
            if (item.student) {
              uniqueStudents.set(item.student.id, {
                id: item.student.id,
                Fname: item.student.Fname || (item.student.name || '').split(' ')[0],
                Lname: item.student.Lname || (item.student.name || '').split(' ')[1] || '',
              });
            }
          });
        });
        setStudents(Array.from(uniqueStudents.values()));

        // Extract unique lessons
        const uniqueLessons = new Map<number, Lesson>();
        classesResponse.forEach((cls) => {
          if (cls.dars) {
            uniqueLessons.set(cls.dars.id, {id: cls.dars.id, name: cls.dars.title});
          }
        });
        setLessons(Array.from(uniqueLessons.values()));
        
        // Extract unique teachers
        const uniqueTeachers = new Map<number, Teacher>();
        classesResponse.forEach((cls) => {
          cls.optimized_class_masters?.forEach((master_item) => {
            if (master_item.master) {
              uniqueTeachers.set(master_item.master.id, master_item.master);
            }
          });
        });
        setTeachers(Array.from(uniqueTeachers.values()));

      } catch (error) {
        toast.error("Error loading initial data for dropdowns");
        console.error("Error fetching data for form:", error);
      }
    };
    fetchData();
  }, [accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (formData.user_ids.length === 0) {
      toast.error("Please select at least one student.");
      return;
    }
    if (formData.droos_ids.length === 0) {
      toast.error("Please select at least one lesson.");
      return;
    }
    if (formData.teacher_ids.length === 0) {
      toast.error("Please select at least one teacher.");
      return;
    }

    const payload = {
      tenant_id: formData.tenant_id,
      user_id: formData.user_ids[0],
      droos_id: formData.droos_ids[0],
      status: formData.status as "active" | "inactive",
      students: formData.user_ids,
      masters: formData.teacher_ids.map(teacherId => ({
        master_id: teacherId,
        status: 1,
      })),
    };

    try {
      setLoading(true);
      await optimizedClassService.create(payload, accessToken);
      toast.success("Class created successfully");
      router.push("/dashboard/optimizedClasses");
    } catch (error) {
      toast.error("Error creating class");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg p-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 dark:from-blue-500/5 dark:via-emerald-500/5 dark:to-blue-500/5" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
              افزودن کلاس جدید
            </h1>
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
            >
              <ArrowLeft className="ml-2 h-4 w-4" />
              بازگشت به لیست کلاس‌ها
            </Button>
          </div>
        </div>

        <Card className="border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>اطلاعات کلاس</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MultiSelectComboBox
                  label="دانش‌آموزان"
                  options={students.map((s) => ({
                    label: s.Fname + " " + s.Lname,
                    value: s.id,
                  }))}
                  value={formData.user_ids}
                  onChange={(vals) =>
                    setFormData((prev) => ({
                      ...prev,
                      user_ids: vals as number[],
                    }))
                  }
                  placeholder="انتخاب دانش‌آموزان"
                />
                <MultiSelectComboBox
                  label="درس‌ها"
                  options={lessons.map((l) => ({ label: l.name, value: l.id }))}
                  value={formData.droos_ids}
                  onChange={(vals) =>
                    setFormData((prev) => ({
                      ...prev,
                      droos_ids: vals as number[],
                    }))
                  }
                  placeholder="انتخاب درس‌ها"
                />
                <MultiSelectComboBox
                  label="اساتید"
                  options={teachers.map((t) => ({
                    label: t.fullname,
                    value: t.id,
                  }))}
                  value={formData.teacher_ids}
                  onChange={(vals) =>
                    setFormData((prev) => ({
                      ...prev,
                      teacher_ids: vals as number[],
                    }))
                  }
                  placeholder="انتخاب اساتید"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "در حال ثبت..." : "ثبت"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
