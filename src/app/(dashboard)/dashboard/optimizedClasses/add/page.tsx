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
import { MasterService } from "@/lib/services/master.service";
import { StudentService, PaginatedResponse, Student as StudentType } from "@/lib/services/student.service";
import { MultiSelectComboBox } from "@/components/ui/MultiSelectComboBox";
import { MultiSelectComboBoxWithInfiniteScroll } from "@/components/ui/MultiSelectComboBoxWithInfiniteScroll";
import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// استفاده از اینترفیس StudentType که از سرویس وارد شده است
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

interface OptimizedClassItem {
  student: {
    id: number;
    Fname?: string;
    Lname?: string;
    name?: string;
  };
}

interface OptimizedClassMaster {
  master: {
    id: number;
    fullname: string;
  };
}

interface OptimizedClassData {
  optimized_class_items?: OptimizedClassItem[];
  optimized_class_masters?: OptimizedClassMaster[];
  dars?: {
    id: number;
    title: string;
  };
}

export default function AddClassPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [students, setStudents] = React.useState<Student[]>([]);
  

  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [teachersLoading, setTeachersLoading] = React.useState(false);
  const [teachersHasMore, setTeachersHasMore] = React.useState(true);
  const [formData, setFormData] = React.useState({
    tenant_id: 1, // You may need to get this from your auth context
    user_ids: [] as number[],
    droos_ids: [] as number[],
    teacher_ids: [] as number[],
    status: true as boolean, // true for active, false for inactive
    start_time: "",
    end_time: "",
  });

  React.useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      try {
        // Load first page of masters/teachers
        setTeachersLoading(true);
        const mastersResponse = await MasterService.getMasters({ page: 1, per_page: 15 }, accessToken);
        setTeachers(mastersResponse.data.data.map(master => ({
          id: master.id,
          fullname: master.fullname,
        })));
        setTeachersHasMore(mastersResponse.data.current_page < mastersResponse.data.last_page);
        setTeachersLoading(false);

        // Load students with status filter
        const studentsResponse = await StudentService.getStudents({
          status: 'در حال تحصیل'
        }, accessToken) as unknown as { data: PaginatedResponse<StudentType> };
        
        // با توجه به ساختار واقعی API که در تصویر مشاهده شد
        const studentsData = studentsResponse.data.data.map(student => ({
          id: student.id,
          Fname: student.Fname,
          Lname: student.Lname,
        }));
        setStudents(studentsData);

        // Load existing classes to extract lessons
        const classesResponse = await optimizedClassService.getAll(accessToken);
        
        // Get the data array from the paginated response
        const classesArray = classesResponse.data.data;

        // Extract unique lessons
        const uniqueLessons = new Map<number, Lesson>();
        classesArray.forEach((cls: OptimizedClassData) => {
          if (cls.dars) {
            uniqueLessons.set(cls.dars.id, {id: cls.dars.id, name: cls.dars.title});
          }
        });
        setLessons(Array.from(uniqueLessons.values()));

      } catch (error: unknown) {
        // بهبود پیام خطا با جزئیات بیشتر
        const err = error as { 
          response?: { 
            status: number; 
            statusText?: string 
          }; 
          request?: unknown;
        };
        
        if (err.response) {
          // خطای پاسخ از سرور
          toast.error(`خطا در بارگذاری اطلاعات: ${err.response.status} - ${err.response.statusText || 'خطای سرور'}`);
        } else if (err.request) {
          // خطای عدم دریافت پاسخ
          toast.error("خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.");
        } else {
          // سایر خطاها
          toast.error("خطا در بارگذاری اطلاعات اولیه");
        }
        console.error("Error fetching data for form:", error);
        setTeachersLoading(false);
      }
    };
    fetchData();
  }, [accessToken]);

  const handleLoadMoreTeachers = async (page: number) => {
    if (!accessToken || teachersLoading) return;
    
    try {
      setTeachersLoading(true);
      const mastersResponse = await MasterService.getMasters({ page, per_page: 15 }, accessToken);
      
      const newTeachers = mastersResponse.data.data.map(master => ({
        id: master.id,
        fullname: master.fullname,
      }));
      
      setTeachers(prev => [...prev, ...newTeachers]);
      setTeachersHasMore(mastersResponse.data.current_page < mastersResponse.data.last_page);
      setTeachersLoading(false);
    } catch (error: unknown) {
      toast.error("خطا در بارگذاری اساتید بیشتر");
      console.error("Error loading more teachers:", error);
      setTeachersLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (formData.user_ids.length === 0) {
      toast.error("لطفاً حداقل یک قرآن انتخاب کنید.");
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

    // روش جدید: ارسال تمام قرآن‌آموزان به صورت کامل
    // قرآن‌آموز اول به عنوان کاربر اصلی
    const mainStudentId = formData.user_ids[0];
    // ارسال تمام قرآن‌آموزان (شامل قرآن‌آموز اول) به عنوان قرآن‌آموزان کلاس
    // این تغییر باعث می‌شود که هیچ قرآن‌آموزی از لیست حذف نشود
    const allStudents = [...formData.user_ids];

    const payload = {
      tenant_id: formData.tenant_id,
      user_id: mainStudentId,
      droos_id: formData.droos_ids[0], 
      status: formData.status,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      students: allStudents,
      masters: formData.teacher_ids.map(teacherId => ({
        master_id: teacherId,
        status: 1,
      })),
    };

    try {
      setLoading(true);
      await optimizedClassService.create(payload, accessToken);
      toast.success("کلاس با موفقیت ایجاد شد");
      router.push("/dashboard/optimizedClasses");
    } catch (error: unknown) {
      toast.error("خطا در ایجاد کلاس");
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

        <Card className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md">
          <CardHeader>
            <CardTitle>اطلاعات کلاس</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MultiSelectComboBox
                  label="قرآن آموزان"
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
                  placeholder="انتخاب قرآن آموزان"
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
                <MultiSelectComboBoxWithInfiniteScroll
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
                  onLoadMore={handleLoadMoreTeachers}
                  hasMore={teachersHasMore}
                  loading={teachersLoading}
                />
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    وضعیت
                  </label>
                  <Select
                    value={formData.status ? "true" : "false"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: value === "true",
                      }))
                    }
                  >
                    <SelectTrigger className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                      <SelectValue placeholder="انتخاب وضعیت" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900">
                      <SelectItem value="true">فعال</SelectItem>
                      <SelectItem value="false">غیرفعال</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    زمان شروع
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        start_time: e.target.value,
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    زمان پایان
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        end_time: e.target.value,
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  />
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
