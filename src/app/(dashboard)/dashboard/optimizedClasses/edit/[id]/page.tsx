"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/context/auth.context";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/page-transition";
import {
  optimizedClassService,
  OptimizedClass,
} from "@/lib/services/optimizedClass.service";
import { MultiSelectComboBox } from "@/components/ui/MultiSelectComboBox";
import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams();
  const classId = parseInt(params.id as string);
  const { accessToken } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [formData, setFormData] = React.useState({
    tenant_id: 1,
    user_ids: [] as number[],
    droos_ids: [] as number[],
    teacher_ids: [] as number[],
    status: "active" as "active" | "inactive",
  });

  React.useEffect(() => {
    const fetchData = async () => {
      if (!accessToken || !classId) return;
      
      try {
        setInitialLoading(true);
        
        let classesArray: OptimizedClass[] = [];
        
        try {
          // Try paginated API first with a large per_page to get all classes
          const classesResponse = await optimizedClassService.getAll(accessToken, {
            page: 1,
            per_page: 1000 // Set a large number to get all classes
          });
          
          // Handle the paginated response structure
          if (classesResponse && classesResponse.data && Array.isArray(classesResponse.data.data)) {
            classesArray = classesResponse.data.data;
          } else {
            throw new Error('Invalid paginated response structure');
          }
        } catch (paginationError) {
          console.log('Paginated API failed, falling back to simple API:', paginationError);
          
          // Fallback to simple API
          classesArray = await optimizedClassService.getAllSimple(accessToken);
          
          if (!Array.isArray(classesArray)) {
            throw new Error('Simple API response is not an array');
          }
        }
        
        // Find the current class
        const currentClassData = classesArray.find((cls: OptimizedClass) => cls.id === classId);
        if (!currentClassData) {
          toast.error("کلاس مورد نظر یافت نشد");
          router.push("/dashboard/optimizedClasses");
          return;
        }
        
        // Extract unique students
        const uniqueStudents = new Map<number, Student>();
        classesArray.forEach((cls: OptimizedClass) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cls.optimized_class_items?.forEach((item: any) => {
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
        classesArray.forEach((cls: OptimizedClass) => {
          if (cls.dars) {
            uniqueLessons.set(cls.dars.id, {id: cls.dars.id, name: cls.dars.title});
          }
        });
        setLessons(Array.from(uniqueLessons.values()));
        
        // Extract unique teachers
        const uniqueTeachers = new Map<number, Teacher>();
        classesArray.forEach((cls: OptimizedClass) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cls.optimized_class_masters?.forEach((master_item: any) => {
            if (master_item.master) {
              uniqueTeachers.set(master_item.master.id, master_item.master);
            }
          });
        });
        setTeachers(Array.from(uniqueTeachers.values()));

        // Set form data with current class values
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentStudentIds = currentClassData.optimized_class_items?.map((item: any) => item.student?.id).filter(Boolean) || [];
        const currentLessonIds = currentClassData.dars ? [currentClassData.dars.id] : [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentTeacherIds = currentClassData.optimized_class_masters?.map((master: any) => master.master?.id).filter(Boolean) || [];

        setFormData({
          tenant_id: currentClassData.tenant_id,
          user_ids: currentStudentIds,
          droos_ids: currentLessonIds,
          teacher_ids: currentTeacherIds,
          status: currentClassData.status,
        });

      } catch (error) {
        toast.error("خطا در بارگذاری اطلاعات");
        console.error("Error fetching data for form:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [accessToken, classId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !classId) return;

    if (formData.user_ids.length === 0) {
      toast.error("لطفاً حداقل یک دانش‌آموز انتخاب کنید.");
      return;
    }
    if (formData.droos_ids.length === 0) {
      toast.error("لطفاً حداقل یک درس انتخاب کنید.");
      return;
    }
    if (formData.teacher_ids.length === 0) {
      toast.error("لطفاً حداقل یک استاد انتخاب کنید.");
      return;
    }

    const payload = {
      tenant_id: formData.tenant_id,
      user_id: formData.user_ids[0],
      droos_id: formData.droos_ids[0],
      status: formData.status,
      students: formData.user_ids,
      masters: formData.teacher_ids.map(teacherId => ({
        master_id: teacherId,
        status: 1,
      })),
    };

    try {
      setLoading(true);
      await optimizedClassService.update(classId, payload, accessToken);
      toast.success("کلاس با موفقیت ویرایش شد");
      router.push("/dashboard/optimizedClasses");
    } catch (error) {
      toast.error("خطا در ویرایش کلاس");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-zinc-600 dark:text-zinc-400">در حال بارگذاری...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg p-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 dark:from-blue-500/5 dark:via-emerald-500/5 dark:to-blue-500/5" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
              ویرایش کلاس #{classId}
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
            <CardTitle>ویرایش اطلاعات کلاس</CardTitle>
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
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    وضعیت
                  </label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive") =>
                      setFormData((prev) => ({
                        ...prev,
                        status: value,
                      }))
                    }
                  >
                    <SelectTrigger className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                      <SelectValue placeholder="انتخاب وضعیت" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900">
                      <SelectItem value="active">فعال</SelectItem>
                      <SelectItem value="inactive">غیرفعال</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  {loading ? "در حال ویرایش..." : "ویرایش"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
} 