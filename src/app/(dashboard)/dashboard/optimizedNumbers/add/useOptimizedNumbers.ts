import { Master, MasterService } from '@/lib/services/master.service';
import { optimizedNumberService } from '@/lib/services/number.service';
import { optimizedClassService, OptimizedClass, Student, Grade, StudentsResponse } from '@/lib/services/optimizedClass.service';
import { toast } from 'sonner';
import { format } from 'date-fns-jalali';
import { isReadingClass } from '@/lib/utils';
import { ValidationError } from '@/lib/types';
import { studentActivityService, CreateStudentActivityDto } from '@/lib/services/studentActivity.service';
import { User } from '@/lib/types/auth.types';
import { DateObject } from 'react-multi-date-picker';

// Fetch master data for the current user
export async function fetchMasterData({ accessToken, user, setMasterData }: { accessToken: string, user: User, setMasterData: (data: Master | null) => void }) {
  if (!accessToken || !user) return;
  try {
    const allMasters = await MasterService.getAllMasters(accessToken);
    let foundMaster: Master | null = null;
    if (user.id) {
      foundMaster = allMasters.find((master: Master) => master.user_id === user.id) || null;
    }
    if (!foundMaster && user.username) {
      foundMaster = allMasters.find((master: Master) => master.mellicode === user.username) || null;
    }
    if (!foundMaster && user.name) {
      foundMaster = allMasters.find((master: Master) => master.fullname === user.name) || null;
    }
    if (!foundMaster && user.username) {
      foundMaster = allMasters.find((master: Master) => master.mellicode?.toString() === user.username?.toString()) || null;
    }
    if (!foundMaster && user.id) {
      foundMaster = allMasters.find((master: Master) => master.user_id?.toString() === user.id?.toString()) || null;
    }
    if (!foundMaster && user.phone) {
      foundMaster = allMasters.find((master: Master) => master.phone === user.phone) || null;
    }
    if (!foundMaster && user.fname && user.lname) {
      foundMaster = allMasters.find((master: Master) => master.fullname.includes(String(user.fname)) && master.fullname.includes(String(user.lname))) || null;
    }
    setMasterData(foundMaster);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('Network Error')) {
        toast.error('خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.');
      } else if (error.message.includes('timeout')) {
        toast.error('زمان انتظار تمام شد. لطفاً دوباره تلاش کنید.');
      } else {
        toast.error(`خطا در دریافت اطلاعات مربی: ${error.message}`);
      }
    } else {
      toast.error('خطا در دریافت اطلاعات مربی');
    }
  }
}

// Fetch all classes for the current user
export async function fetchClasses({ accessToken, setClasses, setLoading }: { accessToken: string, setClasses: (classes: OptimizedClass[]) => void, setLoading: (loading: boolean) => void }) {
  if (!accessToken) return;
  try {
    setLoading(true);
    const response = await optimizedClassService.getAllSimple(accessToken);
    if (Array.isArray(response)) {
      setClasses(response);
    } else {
      setClasses([]);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('Network Error') || error.message.includes('ERR_CONNECTION_RESET')) {
        toast.error('خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.');
      } else if (error.message.includes('timeout')) {
        toast.error('زمان انتظار تمام شد. لطفاً دوباره تلاش کنید.');
      } else if (error.message.includes('401')) {
        toast.error('احراز هویت ناموفق. لطفاً دوباره وارد شوید.');
      } else if (error.message.includes('403')) {
        toast.error('شما دسترسی لازم برای این عملیات را ندارید.');
      } else if (error.message.includes('500')) {
        toast.error('خطای سرور. لطفاً بعداً تلاش کنید.');
      } else {
        toast.error(`خطا در بارگذاری کلاس‌ها: ${error.message}`);
      }
    } else {
      toast.error('خطا در بارگذاری کلاس‌ها');
    }
    setClasses([]);
  } finally {
    setLoading(false);
  }
}

// Fetch students and their grades for a class and date
export async function fetchStudents({ accessToken, selectedClass, selectedDate, setStudents, setExistingGrades }: { accessToken: string, selectedClass: OptimizedClass, selectedDate: DateObject, setStudents: (students: Student[]) => void, setExistingGrades: (grades: Record<number, Grade[]>) => void }) {
  if (!accessToken || !selectedClass || !selectedDate) return;
  try {
    const jsDate = selectedDate.toDate();
    const jsDateStr = jsDate ? format(jsDate, 'yyyy/MM/dd') : null;
    if (!jsDate || !jsDateStr) return;
    const response: StudentsResponse = await optimizedClassService.getStudents(selectedClass.id, jsDateStr, accessToken);

    const gradesMap: Record<number, Grade[]> = {};
    const selectedDateGregorianStr = jsDate ? format(jsDate, 'yyyy-MM-dd') : '';
    response.data.forEach((student: Student) => {
      const todayGrades = student.grades.filter((grade: Grade) => {
        const dateToUse = grade.date || grade.created_at;
        if (!dateToUse) return false;
        try {
          const gradeDateGregorian = format(new Date(dateToUse), 'yyyy-MM-dd');
          return gradeDateGregorian === selectedDateGregorianStr && grade.lesson_area?.id === selectedClass.lesson_area?.id;
        } catch {
          return false;
        }
      });
      if (todayGrades.length > 0) {
        gradesMap[student.student.id] = todayGrades;
      }
    });
    const uniqueStudents = Array.from(new Map(response.data.map((item: Student) => [item.student.id, item])).values());
    setStudents(uniqueStudents);
    setExistingGrades(gradesMap);
  } catch {
    toast.error('Error loading students');
  }
}

export async function handleModalSubmit({
  data,
  accessToken,
  selectedClass,
  selectedStudent,
  selectedCourse,
  selectedDate,
  masterData,
  isOneGrade,
  setLoading,
  setIsModalOpen,
  setSelectedCourse,
  setExistingGrades,
  formRefs,
  pageBasedSchema,
  surahBasedSchema,
  partBasedSchema,
  user
}: {
  data: Record<string, unknown>;
  accessToken: string;
  selectedClass: OptimizedClass;
  selectedStudent: Student;
  selectedCourse: { id: number; title: string; is_one_grade?: boolean };
  selectedDate: DateObject;
  masterData: Master | null;
  isOneGrade: boolean;
  setLoading: (loading: boolean) => void;
  setIsModalOpen: (open: boolean) => void;
  setSelectedCourse: (course: { id: number; title: string; is_one_grade?: boolean } | null) => void;
  setExistingGrades: (updater: (prev: Record<number, Grade[]>) => Record<number, Grade[]>) => void;
  formRefs: { activeTab: string; multiGradeForm: { setError: (field: string, error: { message: string }) => void }; surahForm: { setError: (field: string, error: { message: string }) => void }; partForm: { setError: (field: string, error: { message: string }) => void } } | null;
  pageBasedSchema: { shape: Record<string, unknown> };
  surahBasedSchema: { shape: Record<string, unknown> };
  partBasedSchema: { shape: Record<string, unknown> };
  user: User;
}) {
  if (!accessToken || !selectedClass || !selectedStudent || !selectedCourse || !selectedDate) return;
  try {
    setLoading(true);
    let masterId = 0;
    let userId = 0;
    if (masterData) {
      masterId = masterData.id;
      userId = masterData.user_id || user?.id || 0;
    } else {
      const classMaster = selectedClass.optimized_class_masters?.[0];
      masterId = classMaster?.master?.id || classMaster?.user_id || 0;
      userId = user?.id || 0;
      if (masterId === 0 && user?.app_roles?.some((role) => role.name === 'master')) {
        masterId = user.id || 0;
      }
    }
    const isReadingClassType = isReadingClass(selectedCourse.title);
    const isHefzClass = selectedCourse.title?.toLowerCase().includes('حفظ') || false;
    const jsDate = selectedDate.toDate();
    const jsDateStr = jsDate ? format(jsDate, 'yyyy/MM/dd') : null;
    if (!jsDate) return;
    const payload = {
      class_id: selectedClass.id,
      master_id: masterId,
      student_id: selectedStudent.student.id,
      droos_id: selectedCourse.id,
      hefz: 0,
      details: 0,
      tajvid: 0,
      sout: 0,
      number: 0,
      practice_count: 0,
      user_id: userId,
      tenant_id: 0,
      date: jsDate.toISOString(),
    };
    if (isOneGrade) {
      if (isHefzClass) {
        payload.number = parseFloat(data.number as string);
        if (data.type === 'surah') {
          Object.assign(payload, {
            start_surah: data.start_surah as string,
            start_verse: parseInt(data.start_verse as string),
            end_surah: data.end_surah as string,
            end_verse: parseInt(data.end_verse as string)
          });
        } else if (data.type === 'page') {
          Object.assign(payload, {
            start_page: parseInt(data.start_page as string),
            end_page: parseInt(data.end_page as string)
          });
        }
      } else if (isReadingClassType) {
        payload.number = parseFloat(data.number as string);
        Object.assign(payload, {
          start_page: parseInt(data.start_page as string),
          end_page: parseInt(data.end_page as string)
        });
      } else {
        payload.hefz = parseFloat(data.hefz as string);
        Object.assign(payload, {
          start_page: parseInt(data.start_page as string),
          end_page: parseInt(data.end_page as string)
        });
      }
    } else {
      payload.hefz = parseFloat(data.hefz as string);
      payload.details = parseFloat(data.details as string);
      payload.tajvid = parseFloat(data.tajvid as string);
      payload.sout = parseFloat(data.sout as string);
      if (data.type === 'page') {
        Object.assign(payload, {
          start_page: parseInt(data.start_page as string),
          end_page: parseInt(data.end_page as string)
        });
      } else if (data.type === 'surah') {
        Object.assign(payload, {
          start_surah: data.start_surah as string,
          start_verse: parseInt(data.start_verse as string),
          end_surah: data.end_surah as string,
          end_verse: parseInt(data.end_verse as string)
        });
      } else if (data.type === 'part') {
        Object.assign(payload, {
          start_joze: parseInt(data.start_joze as string),
          end_joze: parseInt(data.end_joze as string)
        });
      }
    }
    Object.assign(payload, { created_at: format(jsDate, 'yyyy-MM-dd HH:mm:ss') });
    await optimizedNumberService.create(payload, accessToken);
    toast.success('نمره با موفقیت ثبت شد');
    setIsModalOpen(false);
    setSelectedCourse(null);
    const response = await optimizedClassService.getStudents(selectedClass.id, jsDateStr!, accessToken);
    const selectedDateStr = jsDate ? format(jsDate, 'yyyy-MM-dd') : '';
    const student = response.data.find((s: Student) => s.student.id === selectedStudent.student.id);
    if (student) {
      const todayGrades = student.grades.filter((grade: Grade) => {
        const dateToUse = grade.date || grade.created_at;
        if (!dateToUse) return false;
        try {
          const gradeDate = format(new Date(dateToUse), 'yyyy-MM-dd');
          return gradeDate === selectedDateStr;
        } catch {
          return false;
        }
      });
      setExistingGrades(prev => ({ ...prev, [selectedStudent.student.id]: todayGrades }));
    }
  } catch (error: unknown) {
    const validationError = error as ValidationError;
    if (validationError.response?.data?.errors) {
      const errors = validationError.response.data.errors;
      Object.keys(errors).forEach((field) => {
        const errorMessage = errors[field][0];
        const persianMessage = errorMessage
          .replace('The tajvid field must not be greater than 10.', 'نمره تجوید نباید بیشتر از 10 باشد')
          .replace('The hefz field must not be greater than 70.', 'نمره حفظ نباید بیشتر از 70 باشد')
          .replace('The sout field must not be greater than 10.', 'نمره صوت نباید بیشتر از 10 باشد')
          .replace('The details field must not be greater than 10.', 'نمره مشخصات نباید بیشتر از 10 باشد')
          .replace('The date field is required.', 'تاریخ الزامی است');
        if (isOneGrade || isReadingClass(selectedCourse?.title || '')) {
          toast.error(persianMessage);
        } else if (formRefs) {
          const fieldName = field as string;
          switch (formRefs.activeTab) {
            case 'page':
              if (fieldName in pageBasedSchema.shape) {
                formRefs.multiGradeForm.setError(fieldName, { message: persianMessage });
              }
              break;
            case 'surah':
              if (fieldName in surahBasedSchema.shape) {
                formRefs.surahForm.setError(fieldName, { message: persianMessage });
              }
              break;
            case 'part':
              if (fieldName in partBasedSchema.shape) {
                formRefs.partForm.setError(fieldName, { message: persianMessage });
              }
              break;
          }
        }
      });
    } else {
      toast.error('خطا در ثبت نمره');
    }
  } finally {
    setLoading(false);
  }
}

export async function handleEditModalSubmit({
  form,
  editingGrade,
  setLoading,
  selectedClass,
  masterData,
  user,
  selectedDate,
  setExistingGrades,
  setEditModalOpen,
  setEditingGrade,
  accessToken
}: {
  form: Record<string, string | number>;
  editingGrade: { id: number; studentId: number; number: number; hefz: number; tajvid: number; sout: number; details: number; droos_id?: { id: number }; dars?: { id: number }; lesson_area?: { id: number }; practice_count?: number };
  setLoading: (loading: boolean) => void;
  selectedClass: OptimizedClass;
  masterData: Master | null;
  user: User;
  selectedDate: DateObject;
  setExistingGrades: (updater: (prev: Record<number, Grade[]>) => Record<number, Grade[]>) => void;
  setEditModalOpen: (open: boolean) => void;
  setEditingGrade: (grade: null) => void;
  accessToken: string;
}) {
  if (!editingGrade) return;
  try {
    setLoading(true);
    const isReadingGrade = Number(editingGrade.number) > 0 && Number(editingGrade.hefz) === 0 && Number(editingGrade.tajvid) === 0 && Number(editingGrade.sout) === 0 && Number(editingGrade.details) === 0;
    const isHefzGrade = Number(editingGrade.number) > 0 && Number(editingGrade.hefz) === 0 && Number(editingGrade.tajvid) === 0 && Number(editingGrade.sout) === 0 && Number(editingGrade.details) === 0;
    const isProvidelessGrade = Number(editingGrade.hefz) === 55 && Number(editingGrade.tajvid) === 0 && Number(editingGrade.sout) === 0 && Number(editingGrade.details) === 0;
    const class_id = selectedClass?.id;
    const master_id = masterData?.id;
    const student_id = editingGrade.studentId;
    const droos_id = editingGrade.droos_id?.id || editingGrade.dars?.id;
    const lesson_area_id = editingGrade.lesson_area?.id;
    const user_id = user?.id || masterData?.user_id;
    const tenant_id = selectedClass?.tenant_id || user?.tenant_id || 0;
    const practice_count = editingGrade.practice_count || 0;
    const updateDate = selectedDate.toDate();
    const updateData = {
      class_id: class_id ?? 0,
      master_id: master_id ?? 0,
      student_id: student_id,
      droos_id: droos_id ?? 0,
      lesson_area_id: lesson_area_id ?? 0,
      user_id: user_id ?? 0,
      tenant_id: tenant_id ?? 0,
      practice_count,
      date: updateDate.toISOString(),
      created_at: format(updateDate, 'yyyy-MM-dd HH:mm:ss'),
      hefz: 0,
      tajvid: 0,
      sout: 0,
      details: 0,
      number: 0,
      start_page: undefined as number | undefined,
      end_page: undefined as number | undefined,
      start_surah: undefined as string | undefined,
      start_verse: undefined as number | undefined,
      end_surah: undefined as string | undefined,
      end_verse: undefined as number | undefined,
      start_joze: undefined as number | undefined,
      end_joze: undefined as number | undefined,
    };
    if (isReadingGrade || isHefzGrade) {
      updateData.number = parseFloat(form.number as string);
      updateData.start_page = form.start_page ? parseInt(form.start_page as string) : undefined;
      updateData.end_page = form.end_page ? parseInt(form.end_page as string) : undefined;
      updateData.start_surah = form.start_surah ? form.start_surah.toString() : undefined;
      updateData.start_verse = form.start_verse ? parseInt(form.start_verse as string) : undefined;
      updateData.end_surah = form.end_surah ? form.end_surah.toString() : undefined;
      updateData.end_verse = form.end_verse ? parseInt(form.end_verse as string) : undefined;
      updateData.start_joze = form.start_joze ? parseInt(form.start_joze as string) : undefined;
      updateData.end_joze = form.end_joze ? parseInt(form.end_joze as string) : undefined;
    } else if (isProvidelessGrade) {
      updateData.hefz = parseFloat(form.hefz as string);
      updateData.start_page = form.start_page ? parseInt(form.start_page as string) : undefined;
      updateData.end_page = form.end_page ? parseInt(form.end_page as string) : undefined;
      updateData.start_surah = form.start_surah ? form.start_surah.toString() : undefined;
      updateData.start_verse = form.start_verse ? parseInt(form.start_verse as string) : undefined;
      updateData.end_surah = form.end_surah ? form.end_surah.toString() : undefined;
      updateData.end_verse = form.end_verse ? parseInt(form.end_verse as string) : undefined;
      updateData.start_joze = form.start_joze ? parseInt(form.start_joze as string) : undefined;
      updateData.end_joze = form.end_joze ? parseInt(form.end_joze as string) : undefined;
    } else {
      updateData.hefz = parseFloat(form.hefz as string);
      updateData.tajvid = parseFloat(form.tajvid as string);
      updateData.sout = parseFloat(form.sout as string);
      updateData.details = parseFloat(form.details as string);
      updateData.start_page = form.start_page ? parseInt(form.start_page as string) : undefined;
      updateData.end_page = form.end_page ? parseInt(form.end_page as string) : undefined;
      updateData.start_surah = form.start_surah ? form.start_surah.toString() : undefined;
      updateData.start_verse = form.start_verse ? parseInt(form.start_verse as string) : undefined;
      updateData.end_surah = form.end_surah ? form.end_surah.toString() : undefined;
      updateData.end_verse = form.end_verse ? parseInt(form.end_verse as string) : undefined;
      updateData.start_joze = form.start_joze ? parseInt(form.start_joze as string) : undefined;
      updateData.end_joze = form.end_joze ? parseInt(form.end_joze as string) : undefined;
    }
    await optimizedNumberService.update(editingGrade.id, updateData, accessToken);
    toast.success('نمره با موفقیت ویرایش شد');
    setExistingGrades(prev => {
      const grades = prev[editingGrade.studentId]?.map((g: Grade) => {
        if (g.id === editingGrade.id) {
          return {
            ...g,
            hefz: updateData.hefz ?? g.hefz,
            tajvid: updateData.tajvid ?? g.tajvid,
            sout: updateData.sout ?? g.sout,
            details: updateData.details ?? g.details,
            number: updateData.number ?? g.number,
            practice_count: updateData.practice_count,
            start_page: updateData.start_page,
            end_page: updateData.end_page,
            start_surah: updateData.start_surah,
            start_verse: updateData.start_verse,
            end_surah: updateData.end_surah,
            end_verse: updateData.end_verse,
            start_joze: updateData.start_joze,
            end_joze: updateData.end_joze,
          };
        }
        return g;
      }) || [];
      return { ...prev, [editingGrade.studentId]: grades };
    });
    setEditModalOpen(false);
    setEditingGrade(null);
  } catch {
    toast.error('خطا در ویرایش نمره');
  } finally {
    setLoading(false);
  }
}

export function handleProvideless({ studentId, students, setSelectedStudentForAction, setIsProvideConfirmOpen }: {
  studentId: number;
  students: Student[];
  setSelectedStudentForAction: (student: Student | null) => void;
  setIsProvideConfirmOpen: (open: boolean) => void;
}) {
  const student = students.find((s: Student) => s.student.id === studentId);
  if (student) {
    setSelectedStudentForAction(student);
    setIsProvideConfirmOpen(true);
  } else {
    toast.error('دانش آموز یافت نشد');
  }
}

export async function handleConfirmProvideless({ selectedStudentForAction, accessToken, selectedClass, masterData, user, selectedDate, setActionLoading, setStudents, setIsProvideConfirmOpen, setSelectedStudentForAction, optimizedNumberService }: {
  selectedStudentForAction: Student;
  accessToken: string;
  selectedClass: OptimizedClass;
  masterData: Master | null;
  user: User;
  selectedDate: DateObject;
  setActionLoading: (loading: boolean) => void;
  setStudents: (students: Student[]) => void;
  setIsProvideConfirmOpen: (open: boolean) => void;
  setSelectedStudentForAction: (student: Student | null) => void;
  optimizedNumberService: { create: (data: unknown, token: string) => Promise<unknown> };
}) {
  if (!selectedStudentForAction || !accessToken || !selectedClass) {
    toast.error('اطلاعات لازم موجود نیست');
    return;
  }
  const studentId = selectedStudentForAction.student.id;
  try {
    setActionLoading(true);
    let masterId = 0;
    let userId = 0;
    if (masterData) {
      masterId = masterData.id;
      userId = masterData.user_id || user?.id || 0;
    } else {
      const classMaster = selectedClass.optimized_class_masters?.[0];
      masterId = classMaster?.master?.id || classMaster?.user_id || 0;
      userId = user?.id || 0;
      if (masterId === 0 && user?.app_roles?.some((role) => role.name === 'master')) {
        masterId = user.id || 0;
      }
      if (masterId === 0) {
        toast.error('اطلاعات مربی یافت نشد. لطفا با مدیر سیستم تماس بگیرید.');
        return;
      }
    }
    if (!selectedDate) {
      toast.error('لطفا تاریخ را انتخاب کنید');
      return;
    }

    const dateValue = selectedDate.toDate();
    if (!dateValue || isNaN(dateValue.getTime())) {
      toast.error('تاریخ انتخابی معتبر نیست');
      return;
    }

    const activityData: CreateStudentActivityDto = {
      student_id: studentId,
      master_id: masterId,
      classha_id: selectedClass.id,
      class_absent: false,
      provideless: true,
      user_id: userId,
      date: dateValue.toISOString(), // تاریخ انتخابی ارسال می‌شود
    };

    // اضافه کردن console.log برای بررسی payload
    console.log('Activity Data being sent:', activityData);
    console.log('Date value:', dateValue.toISOString());

    await studentActivityService.create(activityData, accessToken);
    const gradeDate = selectedDate.toDate();
    const gradePayload = {
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
      date: gradeDate.toISOString(), // تاریخ انتخابی به صورت ISO string
      created_at: format(gradeDate, 'yyyy-MM-dd HH:mm:ss'),
    };
    await optimizedNumberService.create(gradePayload, accessToken);
    const jsDate = selectedDate.toDate();
    const jsDateStr = format(jsDate, 'yyyy/MM/dd');
    try {
      const response = await optimizedClassService.getStudents(selectedClass.id, jsDateStr, accessToken);
      const uniqueStudents = Array.from(new Map((Array.isArray(response.data) ? response.data : []).map((item: Student) => [item.student.id, item])).values()) as Student[];
      setStudents(uniqueStudents);
    } catch { }
    toast.success('عدم تحویل با موفقیت ثبت شد');
    setIsProvideConfirmOpen(false);
    setSelectedStudentForAction(null);
  } catch (error: unknown) {
    const validationError = error as ValidationError;
    if (validationError.response?.data?.errors) {
      const errors = validationError.response.data.errors;
      Object.keys(errors).forEach((field) => {
        const errorMessage = errors[field][0];
        const persianMessage = errorMessage.replace('The date field is required.', 'تاریخ الزامی است');
        toast.error(persianMessage);
      });
    } else {
      toast.error('خطا در ثبت عدم تحویل: ' + (validationError?.response?.data?.message || validationError?.message || 'خطای نامشخص'));
    }
  } finally {
    setActionLoading(false);
  }
}

export function handleAbsent({ studentId, students, setSelectedStudentForAction, setIsAbsentConfirmOpen }: {
  studentId: number;
  students: Student[];
  setSelectedStudentForAction: (student: Student | null) => void;
  setIsAbsentConfirmOpen: (open: boolean) => void;
}) {
  const student = students.find((s: Student) => s.student.id === studentId);
  if (student) {
    setSelectedStudentForAction(student);
    setIsAbsentConfirmOpen(true);
  } else {
    toast.error('دانش آموز یافت نشد');
  }
}

export function handleConfirmAbsent({ selectedStudentForAction, setAbsentStudent, setIsAbsentModalOpen, setIsAbsentConfirmOpen }: {
  selectedStudentForAction: Student;
  setAbsentStudent: (student: Student | null) => void;
  setIsAbsentModalOpen: (open: boolean) => void;
  setIsAbsentConfirmOpen: (open: boolean) => void;
}) {
  if (selectedStudentForAction) {
    setAbsentStudent(selectedStudentForAction);
    setIsAbsentModalOpen(true);
    setIsAbsentConfirmOpen(false);
  }
}

export async function handleAbsentSubmit({ reason, accessToken, selectedClass, absentStudent, masterData, user, setActionLoading, selectedDate, setStudents, setAbsentStudent, setSelectedStudentForAction, setIsAbsentModalOpen }: {
  reason: string;
  accessToken: string;
  selectedClass: OptimizedClass;
  absentStudent: Student;
  masterData: Master | null;
  user: User;
  setActionLoading: (loading: boolean) => void;
  selectedDate: DateObject;
  setStudents: (students: Student[]) => void;
  setAbsentStudent: (student: Student | null) => void;
  setSelectedStudentForAction: (student: Student | null) => void;
  setIsAbsentModalOpen: (open: boolean) => void;
}) {
  if (!accessToken) {
    toast.error('توکن دسترسی موجود نیست');
    return;
  }
  if (!selectedClass) {
    toast.error('لطفا کلاس را انتخاب کنید');
    return;
  }
  if (!absentStudent) {
    toast.error('دانش آموز انتخاب نشده است');
    return;
  }
  try {
    setActionLoading(true);
    let masterId = 0;
    let userId = 0;
    if (masterData) {
      masterId = masterData.id;
      userId = masterData.user_id || user?.id || 0;
    } else {
      const classMaster = selectedClass.optimized_class_masters?.[0];
      masterId = classMaster?.master?.id || classMaster?.user_id || 0;
      userId = user?.id || 0;
      if (masterId === 0 && user?.app_roles?.some((role) => role.name === 'master')) {
        masterId = user.id || 0;
      }
      if (masterId === 0) {
        toast.error('اطلاعات مربی یافت نشد. لطفا با مدیر سیستم تماس بگیرید.');
        return;
      }
    }
    const activityData: CreateStudentActivityDto = {
      student_id: absentStudent.student.id,
      master_id: masterId,
      classha_id: selectedClass.id,
      class_absent: true,
      provideless: false,
      reason: reason,
      user_id: userId,
      date: selectedDate.toDate().toISOString(), // تاریخ انتخابی اضافه شده
    };
    await studentActivityService.create(activityData, accessToken);
    const jsDate = selectedDate.toDate();
    const jsDateStr = format(jsDate, 'yyyy/MM/dd');
    try {
      const response = await optimizedClassService.getStudents(selectedClass.id, jsDateStr, accessToken);
      const uniqueStudents = Array.from(new Map((Array.isArray(response.data) ? response.data : []).map((item: Student) => [item.student.id, item])).values()) as Student[];
      setStudents(uniqueStudents);
    } catch { }
    toast.success(`غیبت با دلیل "${reason}" ثبت شد`);
    setIsAbsentModalOpen(false);
    setAbsentStudent(null);
    setSelectedStudentForAction(null);
  } catch (error: unknown) {
    const errorObj = error as { response?: { data?: { message?: string } }; message?: string };
    toast.error('خطا در ثبت غیبت: ' + (errorObj?.response?.data?.message || errorObj?.message || 'خطای نامشخص'));
  } finally {
    setActionLoading(false);
  }
}

export async function handleRemoveAbsent({ activityId, accessToken, selectedClass, selectedDate, setActionLoading, setStudents }: {
  activityId: number;
  accessToken: string;
  selectedClass: OptimizedClass;
  selectedDate: DateObject;
  setActionLoading: (loading: boolean) => void;
  setStudents: (students: Student[]) => void;
}) {
  if (!accessToken || !selectedClass) {
    toast.error('دسترسی لازم موجود نیست');
    return;
  }
  try {
    setActionLoading(true);
    await studentActivityService.delete(activityId, accessToken);
    const jsDate = selectedDate.toDate();
    const jsDateStr = format(jsDate, 'yyyy/MM/dd');
    try {
      const response = await optimizedClassService.getStudents(selectedClass.id, jsDateStr, accessToken);
      const uniqueStudents = Array.from(new Map((Array.isArray(response.data) ? response.data : []).map((item: Student) => [item.student.id, item])).values()) as Student[];
      setStudents(uniqueStudents);
    } catch { }
    toast.success('غیبت با موفقیت حذف شد');
  } catch (error: unknown) {
    const errorObj = error as { response?: { data?: { message?: string } }; message?: string };
    toast.error('خطا در حذف غیبت: ' + (errorObj?.response?.data?.message || errorObj?.message || 'خطای نامشخص'));
  } finally {
    setActionLoading(false);
  }
}

export async function handleRemoveProvideless({ studentId, activityId, accessToken, selectedClass, selectedDate, setActionLoading, setStudents, setExistingGrades, existingGrades, optimizedNumberService }: {
  studentId: number;
  activityId: number;
  accessToken: string;
  selectedClass: OptimizedClass;
  selectedDate: DateObject;
  setActionLoading: (loading: boolean) => void;
  setStudents: (students: Student[]) => void;
  setExistingGrades: (grades: Record<number, Grade[]>) => void;
  existingGrades: Record<number, Grade[]>;
  optimizedNumberService: { delete: (id: number, token: string) => Promise<void> };
}) {
  if (!accessToken || !selectedClass) {
    toast.error('دسترسی لازم موجود نیست');
    return;
  }
  try {
    setActionLoading(true);
    const studentGrades = existingGrades[studentId];
    if (studentGrades) {
      const provideGrade = studentGrades.find((grade: Grade) => Number(grade.hefz) === 55 && Number(grade.tajvid) === 0 && Number(grade.sout) === 0 && Number(grade.details) === 0);
      if (provideGrade) {
        try {
          await optimizedNumberService.delete(provideGrade.id, accessToken);
        } catch { }
      }
    }
    await studentActivityService.delete(activityId, accessToken);
    const jsDate = selectedDate.toDate();
    const jsDateStr = format(jsDate, 'yyyy/MM/dd');
    try {
      const response = await optimizedClassService.getStudents(selectedClass.id, jsDateStr, accessToken);
      const uniqueStudents = Array.from(new Map((Array.isArray(response.data) ? response.data : []).map((item: Student) => [item.student.id, item])).values()) as Student[];
      setStudents(uniqueStudents);
      const selectedDateStr = jsDate ? format(jsDate, 'yyyy-MM-dd') : '';
      const gradesMap: Record<number, Grade[]> = {};
      response.data.forEach((student: Student) => {
        const todayGrades = student.grades.filter((grade: Grade) => {
          const dateToUse = grade.date || grade.created_at;
          if (!dateToUse) return false;
          try {
            const gradeDate = format(new Date(dateToUse), 'yyyy-MM-dd');
            return gradeDate === selectedDateStr && grade.lesson_area?.id === selectedClass.lesson_area?.id;
          } catch {
            return false;
          }
        });
        if (todayGrades.length > 0) {
          gradesMap[student.student.id] = todayGrades;
        }
      });
      setExistingGrades(gradesMap);
    } catch { }
    toast.success('عدم تحویل و نمره مربوطه با موفقیت حذف شد');
  } catch (error: unknown) {
    const errorObj = error as { response?: { data?: { message?: string } }; message?: string };
    toast.error('خطا در حذف عدم تحویل: ' + (errorObj?.response?.data?.message || errorObj?.message || 'خطای نامشخص'));
  } finally {
    setActionLoading(false);
  }
}