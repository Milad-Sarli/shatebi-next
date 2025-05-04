"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/context/auth.context";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/page-transition";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  optimizedClassService,
  OptimizedClass,
  CreateOptimizedClassDto,
} from "@/lib/services/optimizedClass.service";
import { MultiSelectComboBox } from "@/components/ui/MultiSelectComboBox";

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
        const classes = await optimizedClassService.getAll(accessToken);
        console.log('Classes data:', classes);
        // Extract unique students from classes
        const uniqueStudents = new Map();
        classes.forEach((cls) => {
          cls.optimized_class_items?.forEach((item) => {
            if (item.student) {
              uniqueStudents.set(item.student.id, item.student);
            }
          });
        });
        setStudents(Array.from(uniqueStudents.values()));

        // Extract unique lessons from classes
        const uniqueLessons = new Map();
        classes.forEach((cls) => {
          if (cls.dars) {
            uniqueLessons.set(cls.dars.id, cls.dars);
          }
        });
        setLessons(Array.from(uniqueLessons.values()));

        // Extract unique teachers from classes
        const uniqueTeachers = new Map();
        classes.forEach((cls) => {
          cls.optimized_class_masters?.forEach((master) => {
            if (master.master) {
              uniqueTeachers.set(master.master.id, master.master);
            }
          });
        });
        setTeachers(Array.from(uniqueTeachers.values()));
      } catch (error) {
        toast.error("Error loading data");
        console.error(error);
      }
    };
    fetchData();
  }, [accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    try {
      setLoading(true);
      await optimizedClassService.create(
        {
          tenant_id: formData.tenant_id,
          user_id: formData.user_ids[0] || 0,
          droos_id: formData.droos_ids[0] || 0,
          status: formData.status as "active" | "inactive",
        },
        accessToken
      );
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
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">افزودن کلاس جدید</h1>
          <Button variant="outline" onClick={() => router.back()}>
            بازگشت
          </Button>
        </div>

        <Card>
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
                  className="min-w-[100px]"
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
