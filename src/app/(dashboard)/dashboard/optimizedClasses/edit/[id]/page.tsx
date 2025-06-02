"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/context/auth.context";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/page-transition";
import { optimizedClassService, OptimizedClass } from "@/lib/services/optimizedClass.service";
import { Student } from "@/lib/services/student.service";
import { LessonService, Lesson } from "@/lib/services/lesson.service";
import { Master } from "@/lib/services/master.service";
import { MultiSelectComboBox } from "@/components/ui/MultiSelectComboBox";
import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_URL } from "@/lib/constants";

interface StudentOption {
  label: string;
  value: number;
}

interface MasterOption {
  label: string;
  value: number;
}

interface ClassStudent {
  id: number;
  Fname: string;
  Lname: string;
  FatherName: string;
  juz: number;
  ziafat: number;
  Mellicode: string;
  Birthday: string;
  Birthplace: string;
  Entryday: string;
  Phone: string;
  ParentPhone: string;
  Ostan: string;
  City: string;
  Adress: string;
  Educating: string;
  degree: string;
  StudentCode: string;
  status: string;
  course: string;
  tenant_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface ClassMaster {
  id: number;
  Fname: string;
  Lname: string;
  mellicode: string;
  phone: string;
  tenant_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface ClassItem {
  id: number;
  optimized_class_id: number;
  student_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  student: ClassStudent;
}

interface ClassMasterItem {
  id: number;
  master_id: number;
  optimized_class_id: number;
  assistant: number;
  status: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  master: ClassMaster;
  student: ClassStudent;
}

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams();
  const classId = parseInt(params.id as string);
  const { accessToken } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [classData, setClassData] = React.useState<OptimizedClass | null>(null);
  const [studentOptions, setStudentOptions] = React.useState<StudentOption[]>([]);
  const [masterOptions, setMasterOptions] = React.useState<MasterOption[]>([]);
  const [studentSearchLoading, setStudentSearchLoading] = React.useState(false);
  const [masterSearchLoading, setMasterSearchLoading] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    tenant_id: 1,
    user_ids: [] as number[],
    droos_ids: [] as number[],
    teacher_ids: [] as number[],
    status: "active" as "active" | "inactive",
  });

  // Search students function
  const searchStudents = React.useCallback(async (searchTerm: string) => {
    if (!accessToken || !searchTerm.trim()) {
      return;
    }
    
    try {
      setStudentSearchLoading(true);
      const response = await fetch(`${API_URL}/api/students?search=${encodeURIComponent(searchTerm)}&paginate=off&status=active`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Handle non-paginated response structure
        const students = data.data || [];
        const searchResults: StudentOption[] = students.map((student: Student) => ({
          label: `${student.Fname} ${student.Lname}`,
          value: student.id,
        }));
        
        // Replace previous search results with new ones
        // Keep only the initially loaded students from current class and add new search results
        setStudentOptions(prev => {
          // Get the initial students (those that are currently selected in the form)
          const initialStudents = prev.filter(opt => formData.user_ids.includes(opt.value as number));
          
          // Create a comprehensive list combining initial students and new search results
          const allOptions = [...initialStudents, ...searchResults];
          
          // Remove duplicates by creating a Map with unique IDs
          const uniqueOptionsMap = new Map();
          allOptions.forEach(option => {
            uniqueOptionsMap.set(option.value, option);
          });
          
          // Convert back to array
          return Array.from(uniqueOptionsMap.values());
        });
      }
    } catch (error) {
      console.error("Error searching students:", error);
    } finally {
      setStudentSearchLoading(false);
    }
  }, [accessToken, formData.user_ids]);

  // Search masters function
  const searchMasters = React.useCallback(async (searchTerm: string) => {
    if (!accessToken || !searchTerm.trim()) {
      return;
    }
    
    try {
      setMasterSearchLoading(true);
      const response = await fetch(`${API_URL}/api/masters/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const searchResults: MasterOption[] = (data.data || []).map((master: Master) => ({
          label: master.fullname,
          value: master.id,
        }));
        
        // Replace previous search results with new ones
        // Keep only the initially loaded masters from current class and add new search results
        setMasterOptions(prev => {
          // Get the initial masters (those that are currently selected in the form)
          const initialMasters = prev.filter(opt => formData.teacher_ids.includes(opt.value as number));
          
          // Create a comprehensive list combining initial masters and new search results
          const allOptions = [...initialMasters, ...searchResults];
          
          // Remove duplicates by creating a Map with unique IDs
          const uniqueOptionsMap = new Map();
          allOptions.forEach(option => {
            uniqueOptionsMap.set(option.value, option);
          });
          
          // Convert back to array
          return Array.from(uniqueOptionsMap.values());
        });
      }
    } catch (error) {
      console.error("Error searching masters:", error);
    } finally {
      setMasterSearchLoading(false);
    }
  }, [accessToken, formData.teacher_ids]);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!accessToken || !classId) return;
      
      try {
        setInitialLoading(true);
        
        // Fetch the specific optimized class data
        const classResponse = await optimizedClassService.getById(classId, accessToken);
        setClassData(classResponse);
        
        // Fetch all lessons for dropdown (lessons are usually limited in number)
        const lessonsResponse = await LessonService.getLessons(
          { per_page: 1000 }, 
          accessToken
        );
        setLessons(lessonsResponse.data || []);

        // Set initial student options from current class data
        const currentStudents: StudentOption[] = [];
        if (classResponse.optimized_class_items) {
          (classResponse.optimized_class_items as ClassItem[]).forEach((item) => {
            if (item.student) {
              currentStudents.push({
                label: `${item.student.Fname} ${item.student.Lname}`,
                value: item.student.id,
              });
            }
          });
        }
        setStudentOptions(currentStudents);

        // Set initial master options from current class data
        const currentMasters: MasterOption[] = [];
        if (classResponse.optimized_class_masters) {
          (classResponse.optimized_class_masters as ClassMasterItem[]).forEach((masterItem) => {
            if (masterItem.master) {
              currentMasters.push({
                label: `${masterItem.master.Fname} ${masterItem.master.Lname}`,
                value: masterItem.master.id,
              });
            }
          });
        }
        setMasterOptions(currentMasters);

        // Set form data with current class values
        const currentStudentIds = (classResponse.optimized_class_items as ClassItem[])?.map((item) => item.student?.id).filter(Boolean) || [];
        const currentLessonIds = classResponse.dars ? [classResponse.dars.id] : [];
        const currentTeacherIds = (classResponse.optimized_class_masters as ClassMasterItem[])?.map((master) => master.master?.id).filter(Boolean) || [];

        setFormData({
          tenant_id: classResponse.tenant_id,
          user_ids: currentStudentIds,
          droos_ids: currentLessonIds,
          teacher_ids: currentTeacherIds,
          status: classResponse.status,
        });

      } catch (error) {
        toast.error("خطا در بارگذاری اطلاعات");
        console.error("Error fetching data for form:", error);
        router.push("/dashboard/optimizedClasses");
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

  if (!classData) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-zinc-600 dark:text-zinc-400">کلاس مورد نظر یافت نشد</p>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/optimizedClasses")}
              className="mt-4"
            >
              بازگشت به لیست کلاس‌ها
            </Button>
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
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <p>درس فعلی: {classData.dars?.title || 'نامشخص'}</p>
              <p>تعداد دانش‌آموزان: {classData.optimized_class_items?.length || 0}</p>
              <p>تعداد اساتید: {classData.optimized_class_masters?.length || 0}</p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MultiSelectComboBox
                  label="دانش‌آموزان"
                  options={studentOptions}
                  value={formData.user_ids}
                  onChange={(vals) =>
                    setFormData((prev) => ({
                      ...prev,
                      user_ids: vals as number[],
                    }))
                  }
                  placeholder="انتخاب دانش‌آموزان"
                  searchLoading={studentSearchLoading}
                  onSearch={searchStudents}
                />
                
                <MultiSelectComboBox
                  label="درس‌ها"
                  options={lessons.map((l) => ({ label: l.title, value: l.id }))}
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
                  options={masterOptions}
                  value={formData.teacher_ids}
                  onChange={(vals) =>
                    setFormData((prev) => ({
                      ...prev,
                      teacher_ids: vals as number[],
                    }))
                  }
                  placeholder="انتخاب اساتید"
                  searchLoading={masterSearchLoading}
                  onSearch={searchMasters}
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