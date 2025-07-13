"use client";

import * as React from "react";
import { useAuth } from "@/lib/context/auth.context";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { optimizedNumberService } from "@/lib/services/number.service";
import { MasterService, Master } from "@/lib/services/master.service";
import { studentActivityService, CreateStudentActivityDto } from "@/lib/services/studentActivity.service";
import { format, subHours } from "date-fns-jalali";
import { UseFormReturn } from "react-hook-form";
// import RotatingText from "@/components/reactbit/texts/RotatingText";
import { EditingGrade, ValidationError } from '@/lib/types';
import { OptimizedClass, Grade, Student, optimizedClassService } from '@/lib/services/optimizedClass.service';
import SelectCourseModal from './SelectCourseModal';
import EditGradeModal from './EditGradeModal';
import AbsentModal from './AbsentModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import AddGradeModal from './AddGradeModal';
import { isReadingClass, formatLessonRange } from '@/lib/utils';
import ClassSelector from './ClassSelector';
import DateSelector from './DateSelector';
import EmptyState from './EmptyState';
import { DateObject } from "react-multi-date-picker";
import * as z from "zod";
import StudentCardList from './StudentCardList';
import { PageTransition } from "@/components/ui/page-transition";

interface Course {
  id: number;
  title: string;
  is_one_grade: boolean | null;
}

// Define the form schema for each tab
const pageBasedSchema = z.object({
  start_page: z.string().min(1, "صفحه شروع الزامی است"),
  end_page: z.string().min(1, "صفحه پایان الزامی است"),
  hefz: z.string()
    .min(1, "نمره حفظ الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 70, {
      message: "نمره حفظ باید بین 0 تا 70 باشد"
    }),
  tajvid: z.string()
    .min(1, "نمره تجوید الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10, {
      message: "نمره تجوید باید بین 0 تا 10 باشد"
    }),
  sout: z.string()
    .min(1, "نمره صوت الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10, {
      message: "نمره صوت باید بین 0 تا 10 باشد"
    }),
  details: z.string()
    .min(1, "نمره مشخصات الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10, {
      message: "نمره مشخصات باید بین 0 تا 10 باشد"
    }),
});

const surahBasedSchema = z.object({
  start_surah: z.string().min(1, "سوره شروع الزامی است"),
  start_verse: z.string().min(1, "آیه شروع الزامی است"),
  end_surah: z.string().min(1, "سوره پایان الزامی است"),
  end_verse: z.string().min(1, "آیه پایان الزامی است"),
  hefz: z.string()
    .min(1, "نمره حفظ الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 70, {
      message: "نمره حفظ باید بین 0 تا 70 باشد"
    }),
  tajvid: z.string()
    .min(1, "نمره تجوید الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10, {
      message: "نمره تجوید باید بین 0 تا 10 باشد"
    }),
  sout: z.string()
    .min(1, "نمره صوت الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10, {
      message: "نمره صوت باید بین 0 تا 10 باشد"
    }),
  details: z.string()
    .min(1, "نمره مشخصات الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10, {
      message: "نمره مشخصات باید بین 0 تا 10 باشد"
    }),
});

const partBasedSchema = z.object({
  start_joze: z.string().min(1, "جز شروع الزامی است"),
  end_joze: z.string().min(1, "جز پایان الزامی است"),
  hefz: z.string()
    .min(1, "نمره حفظ الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 70, {
      message: "نمره حفظ باید بین 0 تا 70 باشد"
    }),
  tajvid: z.string()
    .min(1, "نمره تجوید الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10, {
      message: "نمره تجوید باید بین 0 تا 10 باشد"
    }),
  sout: z.string()
    .min(1, "نمره صوت الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10, {
      message: "نمره صوت باید بین 0 تا 10 باشد"
    }),
  details: z.string()
    .min(1, "نمره مشخصات الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10, {
      message: "نمره مشخصات باید بین 0 تا 10 باشد"
    }),
});

interface StudentType {
  id: number;
  name: string;
  father_name: string;
  student_code: string;
  phone: string;
  parent_phone: string;
  aks?: string | null;
}

interface FormRefs {
  multiGradeForm: UseFormReturn<z.infer<typeof pageBasedSchema>>;
  surahForm: UseFormReturn<z.infer<typeof surahBasedSchema>>;
  partForm: UseFormReturn<z.infer<typeof partBasedSchema>>;
  activeTab: string;
}

export default function AddNumberPage() {
  const { accessToken, user } = useAuth();
  const [classes, setClasses] = React.useState<OptimizedClass[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<OptimizedClass | null>(null);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<DateObject | null>(null);
  const [existingGrades, setExistingGrades] = React.useState<Record<number, Grade[]>>({});
  const [selectedStudent, setSelectedStudent] = React.useState<StudentType | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isOneGrade, setIsOneGrade] = React.useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = React.useState(false);
  const [selectedCourse, setSelectedCourse] = React.useState<Course | null>(null);
  const [formRefs, setFormRefs] = React.useState<FormRefs | null>(null);
  const [masterData, setMasterData] = React.useState<Master | null>(null);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editingGrade, setEditingGrade] = React.useState<EditingGrade | null>(null);
  const [isAbsentModalOpen, setIsAbsentModalOpen] = React.useState(false);
  const [absentStudent, setAbsentStudent] = React.useState<StudentType | null>(null);
  const [isProvideConfirmOpen, setIsProvideConfirmOpen] = React.useState(false);
  const [isAbsentConfirmOpen, setIsAbsentConfirmOpen] = React.useState(false);
  const [selectedStudentForAction, setSelectedStudentForAction] = React.useState<StudentType | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchMasterData = async () => {
      if (!accessToken || !user) return;
      
      try {
        console.log("Fetching master data...");
        console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
        console.log("User data:", user);
        
        const allMasters = await MasterService.getAllMasters(accessToken);
        console.log("All masters fetched:", allMasters.length);
        console.log("Masters:", allMasters);
        
        // Try multiple ways to find the master
        let foundMaster = null;
        
        // First try by user_id (most reliable)
        if (user.id) {
          foundMaster = allMasters.find(
            (master) => master.user_id === user.id
          );
          console.log("Trying user_id match:", user.id, "Found:", foundMaster);
        }
        
        // If not found, try by mellicode matching username (very common case)
        if (!foundMaster && user.username) {
          foundMaster = allMasters.find(
            (master) => master.mellicode === user.username
          );
          console.log("Trying mellicode match:", user.username, "Found:", foundMaster);
        }
        
        // If not found, try by name matching
        if (!foundMaster && user.name) {
          foundMaster = allMasters.find(
            (master) => master.fullname === user.name
          );
          console.log("Trying name match:", user.name, "Found:", foundMaster);
        }
        
        // If still not found, try by username matching mellicode (string comparison)
        if (!foundMaster && user.username) {
          foundMaster = allMasters.find(
            (master) => master.mellicode?.toString() === user.username?.toString()
          );
          console.log("Trying username-mellicode string match:", user.username, "Found:", foundMaster);
        }
        
        // If still not found, try by ID matching user_id as string
        if (!foundMaster && user.id) {
          foundMaster = allMasters.find(
            (master) => master.user_id?.toString() === user.id?.toString()
          );
          console.log("Trying user_id string match:", user.id, "Found:", foundMaster);
        }
        
        // If still not found, try by phone number if available
        if (!foundMaster && user.phone) {
          foundMaster = allMasters.find(
            (master) => master.phone === user.phone
          );
          console.log("Trying phone match:", user.phone, "Found:", foundMaster);
        }
        
        // If still not found, try by fullname containing parts of user name
        if (!foundMaster && user.fname && user.lname) {
          const fullUserName = `${user.fname} ${user.lname}`;
          foundMaster = allMasters.find(
            (master) => master.fullname.includes(String(user.fname)) && master.fullname.includes(String(user.lname))
          );
          console.log("Trying fullname parts match:", fullUserName, "Found:", foundMaster);
        }
        
        setMasterData(foundMaster || null);
        console.log("Master data fetched successfully:", foundMaster);
        
        if (!foundMaster) {
          console.log("No master found for user:", user);
          console.log("Available masters:", allMasters);
          console.log("Available masters user_ids:", allMasters.map(m => ({ id: m.id, user_id: m.user_id, mellicode: m.mellicode, fullname: m.fullname })));
        }
      } catch (error) {
        console.error("Error fetching master data:", error);
        
        // More specific error handling
        if (error instanceof Error) {
          if (error.message.includes('Network Error')) {
            toast.error("خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.");
          } else if (error.message.includes('timeout')) {
            toast.error("زمان انتظار تمام شد. لطفاً دوباره تلاش کنید.");
          } else {
            toast.error(`خطا در دریافت اطلاعات مربی: ${error.message}`);
          }
        } else {
          toast.error("خطا در دریافت اطلاعات مربی");
        }
      }
    };

    fetchMasterData();
  }, [accessToken, user]);

  React.useEffect(() => {
    const fetchClasses = async () => {
      if (!accessToken) return;
      try {
        setLoading(true);
        console.log("Fetching classes with token:", accessToken ? "Present" : "Missing");
        
        // Use the simple method instead of paginated one
        const response = await optimizedClassService.getAllSimple(accessToken);
        console.log("Classes response:", response);
        
        // The service now handles different response formats and always returns an array
        if (Array.isArray(response)) {
          setClasses(response);
        } else {
          console.error("Expected array but got:", typeof response, response);
          setClasses([]);
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        
        // More specific error handling
        if (error instanceof Error) {
          if (error.message.includes('Network Error') || error.message.includes('ERR_CONNECTION_RESET')) {
            toast.error("خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.");
          } else if (error.message.includes('timeout')) {
            toast.error("زمان انتظار تمام شد. لطفاً دوباره تلاش کنید.");
          } else if (error.message.includes('401')) {
            toast.error("احراز هویت ناموفق. لطفاً دوباره وارد شوید.");
          } else if (error.message.includes('403')) {
            toast.error("شما دسترسی لازم برای این عملیات را ندارید.");
          } else if (error.message.includes('500')) {
            toast.error("خطای سرور. لطفاً بعداً تلاش کنید.");
          } else {
            toast.error(`خطا در بارگذاری کلاس‌ها: ${error.message}`);
          }
        } else {
          toast.error("خطا در بارگذاری کلاس‌ها");
        }
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [accessToken]);

  const refetchStudentsAndGrades = React.useCallback(async () => {
    if (!accessToken || !selectedClass || !selectedDate) return;
    const jsDate = selectedDate ? selectedDate.toDate() : null;
    if (!jsDate) return;

    try {
      const response = await optimizedClassService.getStudents(
        selectedClass.id,
        format(jsDate, "yyyy/MM/dd"),
        accessToken
      );
      const gradesMap: Record<number, Grade[]> = {};
      response.data.forEach((student) => {
        if (student.grades && student.grades.length > 0) {
          gradesMap[student.student.id] = student.grades;
        }
      });
      const uniqueStudents = Array.from(
        new Map(response.data.map(item => [item.student.id, item])).values()
      );
      setStudents(uniqueStudents);
      setExistingGrades(gradesMap);
    } catch (error) {
      console.error("Error refetching students and grades:", error);
      toast.error("خطا در به‌روزرسانی لیست نمرات");
    }
  }, [accessToken, selectedClass, selectedDate]);

  React.useEffect(() => {
    const fetchStudents = async () => {
      if (!accessToken || !selectedClass || !selectedDate) return;

      try {
        const jsDate = selectedDate ? selectedDate.toDate() : null;
        if (!jsDate) return;
        
        // Fetch students and their grades
        const response = await optimizedClassService.getStudents(
          selectedClass.id,
          format(jsDate, "yyyy/MM/dd"),
          accessToken
        );

        const gradesMap: Record<number, Grade[]> = {};
        // تاریخ انتخاب شده را به میلادی تبدیل کن
        // Always use Gregorian yyyy-MM-dd for comparison
        const selectedDateGregorianStr = jsDate ? format(jsDate, "yyyy-MM-dd") : "";
        
        // Debug logging for date conversion
        console.log("📅 Date debugging:");
        console.log("Selected date object:", selectedDate);
        console.log("JS date (Gregorian):", jsDate);
        console.log("Selected date string (Gregorian):", selectedDateGregorianStr);
        console.log("JS date string (Jalali):", format(jsDate, "yyyy/MM/dd"));

        response.data.forEach((student) => {
          // Show all grades for each student, without filtering by date
          if (student.grades && student.grades.length > 0) {
            gradesMap[student.student.id] = student.grades;
          }
        });

        const uniqueStudents = Array.from(
          new Map(response.data.map(item => [item.student.id, item])).values()
        );

        setStudents(uniqueStudents);
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
    const student = students.find(s => s.student.id === studentId);
    if (student) {
      setSelectedStudent(student.student);
      setIsCourseModalOpen(true);
    }
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setIsOneGrade(course.is_one_grade || false);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: Record<string, unknown>) => {
    if (!accessToken || !selectedClass || !selectedStudent || !selectedCourse || !selectedDate) return;

    try {
      setLoading(true);

      type PayloadType = {
        class_id: number;
        master_id: number;
        student_id: number;
        droos_id: number;
        hefz?: number;
        details?: number;
        tajvid?: number;
        sout?: number;
        number?: number;
        practice_count?: number;
        user_id: number;
        tenant_id: number;
        date: string; // تاریخ انتخاب شده (MySQL datetime format - required)
        created_at?: string;
        start_page?: number;
        end_page?: number;
        start_surah?: string;
        start_verse?: number;
        end_surah?: string;
        end_verse?: number;
        start_joze?: number;
        end_joze?: number;
      };

      // Get master_id from multiple sources
      let masterId = 0;
      let userId = 0;
      
      if (masterData) {
        masterId = masterData.id;
        userId = masterData.user_id || user?.id || 0;
        console.log("📋 Grade submission - Using masterData - masterId:", masterId, "userId:", userId);
      } else {
        // Fallback to class master or current user
        const classMaster = selectedClass.optimized_class_masters?.[0];
        masterId = classMaster?.master?.id || classMaster?.user_id || 0;
        userId = user?.id || 0;
        
        // If user has master role and no masterId found, use user.id as masterId
        if (masterId === 0 && user?.app_roles?.some(role => role.name === 'master')) {
          masterId = user.id || 0;
        }
        
        console.log("📋 Grade submission - Using fallback - masterId:", masterId, "userId:", userId);
        console.log("📋 Grade submission - Class master data:", classMaster);
      }

      // Check if this is a reading class or hefz class
      const isReadingClassType = isReadingClass(selectedCourse.title);
      const isHefzClass = selectedCourse.title?.toLowerCase().includes('حفظ') || false;

      const jsDate = selectedDate ? selectedDate.toDate() : null;
      if (!jsDate) return;

      // Use the selected date in 'yyyy-MM-dd' format for the 'date' field
      const payload: PayloadType = {
        class_id: selectedClass.id,
        master_id: masterId,
        student_id: selectedStudent.id,
        droos_id: selectedCourse.id,
        hefz: data.hefz !== undefined && data.hefz !== "" ? Number(data.hefz) : 0,
        details: data.details !== undefined && data.details !== "" ? Number(data.details) : 0,
        tajvid: data.tajvid !== undefined && data.tajvid !== "" ? Number(data.tajvid) : 0,
        sout: data.sout !== undefined && data.sout !== "" ? Number(data.sout) : 0,
        number: data.number !== undefined && data.number !== "" ? Number(data.number) : 0,
        practice_count: data.practice_count !== undefined && data.practice_count !== "" ? Number(data.practice_count) : 0,
        user_id: userId,
        tenant_id: 0,
        date: format(jsDate, "yyyy-MM-dd"),
        created_at: format(jsDate, "yyyy-MM-dd HH:mm:ss"),
        ...(data.start_page !== undefined && data.start_page !== "" ? { start_page: Number(data.start_page) } : {}),
        ...(data.end_page !== undefined && data.end_page !== "" ? { end_page: Number(data.end_page) } : {}),
        ...(typeof data.start_surah === 'string' && data.start_surah !== '' ? { start_surah: data.start_surah } : {}),
        ...(typeof data.end_surah === 'string' && data.end_surah !== '' ? { end_surah: data.end_surah } : {}),
        ...(data.start_verse !== undefined && data.start_verse !== "" ? { start_verse: Number(data.start_verse) } : {}),
        ...(data.end_verse !== undefined && data.end_verse !== "" ? { end_verse: Number(data.end_verse) } : {}),
        ...(data.start_joze !== undefined && data.start_joze !== "" ? { start_joze: Number(data.start_joze) } : {}),
        ...(data.end_joze !== undefined && data.end_joze !== "" ? { end_joze: Number(data.end_joze) } : {}),
      };

      // Handle different types of droos
      if (isOneGrade) {
        if (isHefzClass) {
          // Hefz class - store grade in number field (0-100)
          payload.number = parseFloat(data.number as string);
          
          if (data.type === 'surah') {
            payload.start_surah = data.start_surah as string;
            payload.start_verse = parseInt(data.start_verse as string);
            payload.end_surah = data.end_surah as string;
            payload.end_verse = parseInt(data.end_verse as string);
          } else if (data.type === 'page') {
            payload.start_page = parseInt(data.start_page as string);
            payload.end_page = parseInt(data.end_page as string);
          }
        } else if (isReadingClassType) {
          // Reading class - store grade in number field
          payload.number = parseFloat(data.number as string);
          payload.start_page = parseInt(data.start_page as string);
          payload.end_page = parseInt(data.end_page as string);
        } else {
          // Other is_one_grade droos - store grade in hefz field
          payload.hefz = parseFloat(data.hefz as string);
          payload.start_page = parseInt(data.start_page as string);
          payload.end_page = parseInt(data.end_page as string);
        }
      } else {
        // Multi-grade droos
        payload.hefz = parseFloat(data.hefz as string);
        payload.details = parseFloat(data.details as string);
        payload.tajvid = parseFloat(data.tajvid as string);
        payload.sout = parseFloat(data.sout as string);

        if (data.type === 'page') {
          payload.start_page = parseInt(data.start_page as string);
          payload.end_page = parseInt(data.end_page as string);
        } else if (data.type === 'surah') {
          payload.start_surah = data.start_surah as string;
          payload.start_verse = parseInt(data.start_verse as string);
          payload.end_surah = data.end_surah as string;
          payload.end_verse = parseInt(data.end_verse as string);
        } else if (data.type === 'part') {
          payload.start_joze = parseInt(data.start_joze as string);
          payload.end_joze = parseInt(data.end_joze as string);
        }
      }

      // Add the selected date to the payload
      payload.created_at = format(jsDate, "yyyy-MM-dd HH:mm:ss");

      console.log("📋 Final payload:", payload);
      console.log("📋 Date field:", payload.date);

      await optimizedNumberService.create(payload, accessToken);
      toast.success("نمره با موفقیت ثبت شد");
      setIsModalOpen(false);
      setSelectedCourse(null);
      await refetchStudentsAndGrades();
    } catch (error: unknown) {
      const validationError = error as ValidationError;
      console.error(validationError);
      if (validationError.response?.data?.errors) {
        const errors = validationError.response.data.errors;
        Object.keys(errors).forEach((field) => {
          const errorMessage = errors[field][0];
          const persianMessage = errorMessage
            .replace("The tajvid field must not be greater than 10.", "نمره تجوید نباید بیشتر از 10 باشد")
            .replace("The hefz field must not be greater than 70.", "نمره حفظ نباید بیشتر از 70 باشد")
            .replace("The sout field must not be greater than 10.", "نمره صوت نباید بیشتر از 10 باشد")
            .replace("The details field must not be greater than 10.", "نمره مشخصات نباید بیشتر از 10 باشد")
            .replace("The date field is required.", "تاریخ الزامی است");
          
          if (isOneGrade || isReadingClass(selectedCourse?.title || '')) {
            toast.error(persianMessage);
          } else if (!formRefs) {
            toast.error(persianMessage);
          } else {
            const fieldName = field as string;
            switch (formRefs.activeTab) {
              case 'page':
                if (fieldName in pageBasedSchema.shape) {
                  formRefs.multiGradeForm.setError(fieldName as keyof z.infer<typeof pageBasedSchema>, { message: persianMessage });
                }
                break;
              case 'surah':
                if (fieldName in surahBasedSchema.shape) {
                  formRefs.surahForm.setError(fieldName as keyof z.infer<typeof surahBasedSchema>, { message: persianMessage });
                }
                break;
              case 'part':
                if (fieldName in partBasedSchema.shape) {
                  formRefs.partForm.setError(fieldName as keyof z.infer<typeof partBasedSchema>, { message: persianMessage });
                }
                break;
            }
          }
        });
      } else {
        toast.error("خطا در ثبت نمره");
      }
    } finally {
      setLoading(false);
    }
  };

  const isGradeWithin24Hours = (grade: Grade) => {
    // اولویت با ستون date، اگر نبود از created_at استفاده کن
    const dateToUse = grade.date || grade.created_at;
    if (!dateToUse) return false;
    
    try {
      const gradeDate = new Date(dateToUse);
      const twentyFourHoursAgo = subHours(new Date(), 24);
      return gradeDate > twentyFourHoursAgo;
    } catch (error) {
      console.error("Error parsing date in isGradeWithin24Hours:", dateToUse, error);
      return false;
    }
  };

  const handleEditGrade = (studentId: number, grade: Grade) => {
    setEditingGrade({ ...grade, studentId });
    console.log(grade)
    setEditModalOpen(true);
  };
  
  const handleEditModalSubmit = async (form: Record<string, string | number>) => {
    if (!editingGrade) return;
    try {
      setLoading(true);
      // Check if this is a reading grade
      const isReadingGrade = Number(editingGrade.number) > 0 && 
                           Number(editingGrade.hefz) === 0 && 
                           Number(editingGrade.tajvid) === 0 && 
                           Number(editingGrade.sout) === 0 && 
                           Number(editingGrade.details) === 0;
      // Check if this is a hefz grade
      const isHefzGrade = Number(editingGrade.number) > 0 && 
                        Number(editingGrade.hefz) === 0 && 
                        Number(editingGrade.tajvid) === 0 && 
                        Number(editingGrade.sout) === 0 && 
                        Number(editingGrade.details) === 0;
      // Check if this is a provideless grade (55 hefz score)
      const isProvidelessGrade = Number(editingGrade.hefz) === 55 && 
                               Number(editingGrade.tajvid) === 0 && 
                               Number(editingGrade.sout) === 0 && 
                               Number(editingGrade.details) === 0;
      // استخراج فیلدهای اصلی از grade و state
      const class_id = selectedClass?.id;
      const master_id = masterData?.id;
      const student_id = editingGrade.studentId;
      const droos_id = editingGrade.droos_id?.id || editingGrade.dars?.id;
      const lesson_area_id = editingGrade.lesson_area?.id;
      const user_id = user?.id || masterData?.user_id;
      const tenant_id = selectedClass?.tenant_id || user?.tenant_id || 0;
      const practice_count = editingGrade.practice_count || 0;
      
      type UpdateData = {
        class_id: number;
        master_id: number;
        student_id: number;
        droos_id?: number;
        lesson_area_id?: number;
        user_id: number;
        tenant_id: number;
        practice_count: number;
        date: string; // تاریخ انتخاب شده (MySQL datetime format - required)
        created_at?: string;
        number?: number;
        hefz?: number;
        tajvid?: number;
        sout?: number;
        details?: number;
        start_page?: number;
        end_page?: number;
        start_surah?: string;
        start_verse?: number;
        end_surah?: string;
        end_verse?: number;
        start_joze?: number;
        end_joze?: number;
      };
      
      // Get the date to use for the update
      const updateDate = selectedDate ? selectedDate.toDate() : new Date();
      
      let updateData: UpdateData = {
        class_id: class_id ?? 0,
        master_id: master_id ?? 0,
        student_id: student_id,
        droos_id: droos_id ?? 0,
        lesson_area_id: lesson_area_id ?? 0,
        user_id: user_id ?? 0,
        tenant_id: tenant_id ?? 0,
        practice_count,
        date: format(updateDate, "yyyy-MM-dd"), // <-- fix: use only the date part
        created_at: format(updateDate, "yyyy-MM-dd HH:mm:ss"),
      };
      if (isReadingGrade || isHefzGrade) {
        // Update number field for reading/hefz grades
        updateData = {
          ...updateData,
          number: parseFloat(form.number as string),
          hefz: 0,
          tajvid: 0,
          sout: 0,
          details: 0,
          start_page: form.start_page ? parseInt(form.start_page as string) : undefined,
          end_page: form.end_page ? parseInt(form.end_page as string) : undefined,
          start_surah: form.start_surah ? form.start_surah.toString() : undefined,
          start_verse: form.start_verse ? parseInt(form.start_verse as string) : undefined,
          end_surah: form.end_surah ? form.end_surah.toString() : undefined,
          end_verse: form.end_verse ? parseInt(form.end_verse as string) : undefined,
          start_joze: form.start_joze ? parseInt(form.start_joze as string) : undefined,
          end_joze: form.end_joze ? parseInt(form.end_joze as string) : undefined,
        };
      } else if (isProvidelessGrade) {
        // Update hefz field for provideless grades
        updateData = {
          ...updateData,
          hefz: parseFloat(form.hefz as string),
          tajvid: 0,
          sout: 0,
          details: 0,
          number: 0,
          start_page: form.start_page ? parseInt(form.start_page as string) : undefined,
          end_page: form.end_page ? parseInt(form.end_page as string) : undefined,
          start_surah: form.start_surah ? form.start_surah.toString() : undefined,
          start_verse: form.start_verse ? parseInt(form.start_verse as string) : undefined,
          end_surah: form.end_surah ? form.end_surah.toString() : undefined,
          end_verse: form.end_verse ? parseInt(form.end_verse as string) : undefined,
          start_joze: form.start_joze ? parseInt(form.start_joze as string) : undefined,
          end_joze: form.end_joze ? parseInt(form.end_joze as string) : undefined,
        };
      } else {
        // Update individual fields for multi-grade
        updateData = {
          ...updateData,
          hefz: parseFloat(form.hefz as string),
          tajvid: parseFloat(form.tajvid as string),
          sout: parseFloat(form.sout as string),
          details: parseFloat(form.details as string),
          number: 0,
          start_page: form.start_page ? parseInt(form.start_page as string) : undefined,
          end_page: form.end_page ? parseInt(form.end_page as string) : undefined,
          start_surah: form.start_surah ? form.start_surah.toString() : undefined,
          start_verse: form.start_verse ? parseInt(form.start_verse as string) : undefined,
          end_surah: form.end_surah ? form.end_surah.toString() : undefined,
          end_verse: form.end_verse ? parseInt(form.end_verse as string) : undefined,
          start_joze: form.start_joze ? parseInt(form.start_joze as string) : undefined,
          end_joze: form.end_joze ? parseInt(form.end_joze as string) : undefined,
        };
      }
      console.log("Updating grade with data:", updateData);
      await optimizedNumberService.update(editingGrade.id, updateData, accessToken!);
      toast.success("نمره با موفقیت ویرایش شد");
      setEditModalOpen(false);
      setEditingGrade(null);
      await refetchStudentsAndGrades();
    } catch (error) {
      console.error("Error updating grade:", error);
      toast.error("خطا در ویرایش نمره: " + (error as ValidationError)?.response?.data?.message || (error as ValidationError)?.message || "خطای نامشخص");
    } finally {
      setLoading(false);
    }
  };

  const handleProvideless = (studentId: number) => {
    const student = students.find(s => s.student.id === studentId);
    if (student) {
      setSelectedStudentForAction(student.student);
      setIsProvideConfirmOpen(true);
    } else {
      toast.error("دانش آموز یافت نشد");
    }
  };

  const handleConfirmProvideless = async () => {
    if (!selectedStudentForAction || !accessToken || !selectedClass) {
      toast.error("اطلاعات لازم موجود نیست");
      return;
    }

    const studentId = selectedStudentForAction.id;
    console.log("🔄 Starting handleConfirmProvideless for student:", studentId);

    try {
      setActionLoading(true);
      console.log("✅ Starting API calls...");
      
      // Get master_id from multiple sources
      let masterId = 0;
      let userId = 0;
      
      if (masterData) {
        masterId = masterData.id;
        userId = masterData.user_id || user?.id || 0;
        console.log("📋 Using masterData - masterId:", masterId, "userId:", userId);
      } else {
        // Fallback to class master or current user
        const classMaster = selectedClass.optimized_class_masters?.[0];
        masterId = classMaster?.master?.id || classMaster?.user_id || 0;
        userId = user?.id || 0;
        
        // If user has master role and no masterId found, use user.id as masterId
        if (masterId === 0 && user?.app_roles?.some(role => role.name === 'master')) {
          masterId = user.id || 0;
        }
        
        console.log("📋 Using fallback - masterId:", masterId, "userId:", userId);
        console.log("📋 Class master data:", classMaster);
        
        if (masterId === 0) {
          toast.error("اطلاعات مربی یافت نشد. لطفا با مدیر سیستم تماس بگیرید.");
          return;
        }
      }
      
      // Create student activity for provideless
      const activityData: CreateStudentActivityDto = {
        student_id: studentId,
        master_id: masterId,
        classha_id: selectedClass.id,
        class_absent: false,
        provideless: true,
        user_id: userId,
      };

      console.log("activityData:", activityData);
      
      await studentActivityService.create(activityData, accessToken);
      console.log("Student activity created successfully");

      // Create a grade with score 55
      const gradeDate = selectedDate ? selectedDate.toDate() : new Date();
      
      type GradePayload = {
        class_id: number;
        master_id: number;
        student_id: number;
        droos_id: number;
        hefz: number;
        details: number;
        tajvid: number;
        sout: number;
        number: number;
        practice_count: number;
        user_id: number;
        tenant_id: number;
        date: string;
        created_at: string;
      };

      const gradePayload: GradePayload = {
        class_id: selectedClass.id,
        master_id: masterId,
        student_id: studentId,
        droos_id: selectedClass.dars?.id || 0,
        hefz: 55,
        details: 0,
        tajvid: 0,
        sout: 0,
        number: 0,
        practice_count: 0,
        user_id: userId,
        tenant_id: 0,
        date: format(gradeDate, "yyyy-MM-dd"), // <-- fix: use only the date part
        created_at: format(gradeDate, "yyyy-MM-dd HH:mm:ss"),
      };

      console.log("gradePayload:", gradePayload);
      console.log("📋 Grade payload date field:", gradePayload.date);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await optimizedNumberService.create(gradePayload as any, accessToken);
      console.log("Grade created successfully");
      
      // Refresh students data
      if (selectedDate) {
        const jsDate = selectedDate.toDate();
        const jsDateStr = format(jsDate, "yyyy/MM/dd");
        try {
          const response = await optimizedClassService.getStudents(
            selectedClass.id,
            jsDateStr,
            accessToken
          );
          
          const uniqueStudents = Array.from(
            new Map(response.data.map(item => [item.student.id, item])).values()
          );
          setStudents(uniqueStudents);
        } catch (refreshError) {
          console.error("Error refreshing students:", refreshError);
        }
      }
      
      toast.success("عدم تحویل با موفقیت ثبت شد");
      setIsProvideConfirmOpen(false);
      setSelectedStudentForAction(null);
      
    } catch (error) {
      console.error("Error in handleConfirmProvideless:", error);
      const validationError = error as ValidationError;
      if (validationError.response?.data?.errors) {
        const errors = validationError.response.data.errors;
        Object.keys(errors).forEach((field) => {
          const errorMessage = errors[field][0];
          const persianMessage = errorMessage
            .replace("The date field is required.", "تاریخ الزامی است");
          toast.error(persianMessage);
        });
      } else {
        toast.error("خطا در ثبت عدم تحویل: " + validationError?.response?.data?.message || validationError?.message || "خطای نامشخص");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAbsent = (studentId: number) => {
    const student = students.find(s => s.student.id === studentId);
    if (student) {
      setSelectedStudentForAction(student.student);
      setIsAbsentConfirmOpen(true);
    } else {
      toast.error("دانش آموز یافت نشد");
    }
  };

  const handleConfirmAbsent = () => {
    if (selectedStudentForAction) {
      setAbsentStudent(selectedStudentForAction);
      setIsAbsentModalOpen(true);
      setIsAbsentConfirmOpen(false);
    }
  };

  const handleAbsentSubmit = async (reason: string) => {
    console.log("handleAbsentSubmit called with reason:", reason);
    console.log("accessToken:", !!accessToken);
    console.log("selectedClass:", selectedClass);
    console.log("masterData:", masterData);
    console.log("absentStudent:", absentStudent);
    
    if (!accessToken) {
      toast.error("توکن دسترسی موجود نیست");
      return;
    }
    
    if (!selectedClass) {
      toast.error("لطفا کلاس را انتخاب کنید");
      return;
    }
    
    if (!absentStudent) {
      toast.error("دانش آموز انتخاب نشده است");
      return;
    }

    try {
      setActionLoading(true);
      
      // Get master_id from multiple sources
      let masterId = 0;
      let userId = 0;
      
      if (masterData) {
        masterId = masterData.id;
        userId = masterData.user_id || user?.id || 0;
        console.log("📋 Using masterData - masterId:", masterId, "userId:", userId);
      } else {
        // Fallback to class master or current user
        const classMaster = selectedClass.optimized_class_masters?.[0];
        masterId = classMaster?.master?.id || classMaster?.user_id || 0;
        userId = user?.id || 0;
        
        // If user has master role and no masterId found, use user.id as masterId
        if (masterId === 0 && user?.app_roles?.some(role => role.name === 'master')) {
          masterId = user.id || 0;
        }
        
        console.log("📋 Using fallback - masterId:", masterId, "userId:", userId);
        console.log("📋 Class master data:", classMaster);
        
        if (masterId === 0) {
          toast.error("اطلاعات مربی یافت نشد. لطفا با مدیر سیستم تماس بگیرید.");
          return;
        }
      }
      
      const activityData: CreateStudentActivityDto = {
        student_id: absentStudent.id,
        master_id: masterId,
        classha_id: selectedClass.id,
        class_absent: true,
        provideless: false,
        reason: reason,
        user_id: userId,
      };

      console.log("activityData:", activityData);
      
      await studentActivityService.create(activityData, accessToken);
      console.log("Student activity created successfully");
      
      // Refresh students data to get updated activities
      if (selectedDate) {
        const jsDate = selectedDate.toDate();
        const jsDateStr = format(jsDate, "yyyy/MM/dd");
        try {
          const response = await optimizedClassService.getStudents(
            selectedClass.id,
            jsDateStr,
            accessToken
          );
          
          const uniqueStudents = Array.from(
            new Map(response.data.map(item => [item.student.id, item])).values()
          );
          setStudents(uniqueStudents);
        } catch (refreshError) {
          console.error("Error refreshing students:", refreshError);
        }
      }
      
      toast.success(`غیبت با دلیل "${reason}" ثبت شد`);
      setIsAbsentModalOpen(false);
      setAbsentStudent(null);
      setSelectedStudentForAction(null);
      
    } catch (error) {
      console.error("Error in handleAbsentSubmit:", error);
      toast.error("خطا در ثبت غیبت: " + (error as ValidationError)?.response?.data?.message || (error as ValidationError)?.message || "خطای نامشخص");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-4 min-h-[80vh]">
        {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg p-4 shadow-lg border-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-lg"></div>
          <h1 className="text-xl sm:text-2xl font-bold text-white relative z-10 flex items-center gap-2">
            <RotatingText
              texts={['ایجاد', 'ویرایش', 'حذف']}
              mainClassName="px-2 sm:px-2 md:px-3 bg-cyan-300 text-black overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
              staggerFrom="last"
              initial={{ y: "100%" }}
              splitBy="word"
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2000}
            />
            نمرات قرآن آموزان
          </h1>
        </div> */}

        <Card className="border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="text-zinc-900 dark:text-zinc-100">
              انتخاب کلاس و تاریخ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <ClassSelector
                  classes={classes}
                  selectedClass={selectedClass}
                  onChange={handleClassChange}
                />
              </div>
              <div className="flex-1 w-full mx-auto">
                <DateSelector
                  selectedDate={selectedDate}
                  onChange={setSelectedDate}
                />
              </div>
            </div>
            {selectedClass ? (
              <StudentCardList
                students={students}
                existingGrades={existingGrades}
                handleAddNumber={handleAddNumber}
                handleProvideless={handleProvideless}
                handleAbsent={handleAbsent}
                handleEditGrade={handleEditGrade}
                loading={loading}
                actionLoading={actionLoading}
                selectedStudentForAction={selectedStudentForAction as Student | null}
                isProvideConfirmOpen={isProvideConfirmOpen}
                isGradeWithin24Hours={isGradeWithin24Hours}
                formatLessonRange={formatLessonRange}
              />
            ) : null}
          </CardContent>
        </Card>
        {!selectedClass && <EmptyState message="لطفا کلاس و تاریخ را انتخاب کنید" />}

        {selectedStudent && (
          <>
            <SelectCourseModal
              isOpen={isCourseModalOpen}
              onOpenChange={setIsCourseModalOpen}
              onCourseSelect={handleCourseSelect}
              dars={selectedClass?.dars}
            />
            
            <AddGradeModal
              student={selectedStudent}
              onSubmit={handleModalSubmit}
              isOpen={isModalOpen}
              onOpenChange={setIsModalOpen}
              onFormRefsChange={setFormRefs}
              isLoading={loading}
            />
          </>
        )}

        {editModalOpen && editingGrade && (
          <EditGradeModal
            isOpen={editModalOpen}
            onOpenChange={setEditModalOpen}
            grade={editingGrade}
            onSubmit={handleEditModalSubmit}
            isLoading={loading}
          />
        )}

        {absentStudent && (
          <AbsentModal
            isOpen={isAbsentModalOpen}
            onOpenChange={setIsAbsentModalOpen}
            student={absentStudent}
            onSubmit={handleAbsentSubmit}
            isLoading={actionLoading}
          />
        )}

        {/* Confirmation Modals */}
        <ConfirmationModal
          isOpen={isProvideConfirmOpen}
          onOpenChange={setIsProvideConfirmOpen}
          title="تأیید ثبت عدم تحویل"
          description={`آیا مطمئن هستید که می‌خواهید عدم تحویل برای "${selectedStudentForAction?.name}" ثبت کنید؟`}
          confirmText="تأیید"
          cancelText="لغو"
          onConfirm={handleConfirmProvideless}
          isLoading={actionLoading}
          variant="warning"
        />

        <ConfirmationModal
          isOpen={isAbsentConfirmOpen}
          onOpenChange={setIsAbsentConfirmOpen}
          title="تأیید ثبت غیبت"
          description={`آیا مطمئن هستید که می‌خواهید غیبت برای "${selectedStudentForAction?.name}" ثبت کنید؟`}
          confirmText="تأیید"
          cancelText="لغو"
          onConfirm={handleConfirmAbsent}
          variant="destructive"
        />
      </div>
    </PageTransition>
  );
}
