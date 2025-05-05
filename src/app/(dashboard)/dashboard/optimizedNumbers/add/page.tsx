"use client";

import * as React from "react";
import { useAuth } from "@/lib/context/auth.context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/ui/page-transition";
import { optimizedNumberService } from "@/lib/services/number.service";
import { SurahService, Surah } from "@/lib/services/surah.service";
import {
  optimizedClassService,
  OptimizedClass,
  Grade,
  Dars
} from "@/lib/services/optimizedClass.service";
import { format, subHours } from "date-fns-jalali";
import { SingleSelectCombobox } from "@/components/ui/Combobox";
import DatePicker from "@/components/ui/DatePicker";
import { Edit2 } from "lucide-react";
import { motion } from "framer-motion";
import RotatingText from "@/components/reactbit/texts/RotatingText";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Image from "next/image";

interface Course {
  id: number;
  title: string;
  is_one_grade: boolean | null;
}

// Define the form schema for each tab
const pageBasedSchema = z.object({
  start_page: z.string().min(1, "صفحه شروع الزامی است"),
  end_page: z.string().min(1, "صفحه پایان الزامی است"),
  hefz: z.string().min(1, "نمره حفظ الزامی است"),
  tajvid: z.string().min(1, "نمره تجوید الزامی است"),
  sout: z.string().min(1, "نمره صوت الزامی است"),
  details: z.string().min(1, "نمره تفاصیل الزامی است"),
});

const oneGradeSchema = z.object({
  start_page: z.string().min(1, "صفحه شروع الزامی است"),
  end_page: z.string().min(1, "صفحه پایان الزامی است"),
  hefz: z.string().min(1, "نمره الزامی است"),
});

const surahBasedSchema = z.object({
  start_surah: z.string().min(1, "سوره شروع الزامی است"),
  start_verse: z.string().min(1, "آیه شروع الزامی است"),
  end_surah: z.string().min(1, "سوره پایان الزامی است"),
  end_verse: z.string().min(1, "آیه پایان الزامی است"),
  hefz: z.string().min(1, "نمره حفظ الزامی است"),
  tajvid: z.string().min(1, "نمره تجوید الزامی است"),
  sout: z.string().min(1, "نمره صوت الزامی است"),
  details: z.string().min(1, "نمره تفاصیل الزامی است"),
});

const partBasedSchema = z.object({
  start_part: z.string().min(1, "پاره شروع الزامی است"),
  end_part: z.string().min(1, "پاره پایان الزامی است"),
  hefz: z.string().min(1, "نمره حفظ الزامی است"),
  tajvid: z.string().min(1, "نمره تجوید الزامی است"),
  sout: z.string().min(1, "نمره صوت الزامی است"),
  details: z.string().min(1, "نمره تفاصیل الزامی است"),
});

interface StudentType {
  id: number;
  name: string;
  father_name: string;
  student_code: string;
  phone: string;
  parent_phone: string;
  aks?: string;
}

interface StudentWithGrades {
  student: StudentType;
  grades: Grade[];
}

interface AddGradeModalProps {
  student: StudentType;
  onSubmit: (data: Record<string, unknown>) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isOneGrade?: boolean;
  selectedCourse?: Course | null;
}

function AddGradeModal({ student, onSubmit, isOpen, onOpenChange, isOneGrade = false, selectedCourse }: AddGradeModalProps) {
  const [activeTab, setActiveTab] = React.useState("page");
  const [surahs, setSurahs] = React.useState<Surah[]>([]);
  const [startSurahVerses, setStartSurahVerses] = React.useState<number[]>([]);
  const [endSurahVerses, setEndSurahVerses] = React.useState<number[]>([]);
  const [isLoadingSurahs, setIsLoadingSurahs] = React.useState(true);
  const { accessToken } = useAuth();

  // const getVersesFromJuz = (juzString: string) => {
  //   try {
  //     const juzData = JSON.parse(juzString);
  //     const verses: number[] = [];
      
  //     juzData.forEach((juz: any) => {
  //       const startVerse = parseInt(juz.verse.start.replace('verse_', ''));
  //       const endVerse = parseInt(juz.verse.end.replace('verse_', ''));
  //       for (let i = startVerse; i <= endVerse; i++) {
  //         verses.push(i);
  //       }
  //     });
      
  //     return verses;
  //   } catch (error) {
  //     console.error('Error parsing juz data:', error);
  //     return [];
  //   }
  // };

  const oneGradeForm = useForm({
    resolver: zodResolver(oneGradeSchema),
    defaultValues: {
      start_page: "",
      end_page: "",
      hefz: "",
    },
  });

  const multiGradeForm = useForm({
    resolver: zodResolver(pageBasedSchema),
    defaultValues: {
      start_page: "",
      end_page: "",
      hefz: "",
      tajvid: "",
      sout: "",
      details: "",
    },
  });

  const surahForm = useForm({
    resolver: zodResolver(surahBasedSchema),
    defaultValues: {
      start_surah: "",
      start_verse: "",
      end_surah: "",
      end_verse: "",
      hefz: "",
      tajvid: "",
      sout: "",
      details: "",
    },
  });

  const partForm = useForm({
    resolver: zodResolver(partBasedSchema),
    defaultValues: {
      start_part: "",
      end_part: "",
      hefz: "",
      tajvid: "",
      sout: "",
      details: "",
    },
  });

  React.useEffect(() => {
    const fetchSurahs = async () => {
      if (!accessToken) return;
      try {
        setIsLoadingSurahs(true);
        const response = await SurahService.getAllSurahs(accessToken);
        // Check if response and data exist
        if (response && Array.isArray(response)) {
          // Sort surahs by their index
          const sortedSurahs = response.sort((a: Surah, b: Surah) => a.index - b.index);
          setSurahs(sortedSurahs);
        } else {
          console.error("Invalid response format from SurahService:", response);
          toast.error("خطا در دریافت سوره‌ها");
        }
      } catch (error) {
        console.error("Error fetching surahs:", error);
        toast.error("خطا در دریافت سوره‌ها");
      } finally {
        setIsLoadingSurahs(false);
      }
    };
    fetchSurahs();
  }, [accessToken]);
  const handleStartSurahChange = (surahId: string) => {
    const selectedSurah = surahs.find(s => s.id.toString() === surahId);
    if (selectedSurah) {
      const verses = Array.from({ length: selectedSurah.count }, (_, i) => i + 1);
      setStartSurahVerses(verses);
      // Set the end surah to match the start surah
      surahForm.setValue("end_surah", surahId);
      handleEndSurahChange(surahId);
    }
  };

  const handleEndSurahChange = (surahId: string) => {
    const selectedSurah = surahs.find(s => s.id.toString() === surahId);
    if (selectedSurah) {
      const verses = Array.from({ length: selectedSurah.count }, (_, i) => i + 1);
      setEndSurahVerses(verses);
    }
  };

  const handleSubmit = (data: Record<string, unknown>) => {
    onSubmit({ ...data, type: activeTab });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <DialogTitle className="text-xl font-bold text-center">
              ثبت نمره برای {student.name}
              <motion.p 
                className="text-emerald-500 dark:text-emerald-400 font-medium"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                {selectedCourse?.title}
              </motion.p>
            </DialogTitle>
            <DialogDescription className="text-center">
              لطفا نوع درس و نمرات را وارد کنید
            </DialogDescription>
          </motion.div>
        </DialogHeader>
        {isOneGrade ? (
          <Form {...oneGradeForm}>
            <form onSubmit={oneGradeForm.handleSubmit(handleSubmit)} className="space-y-4" dir="rtl">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={oneGradeForm.control}
                  name="start_page"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>صفحه شروع</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} dir="rtl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={oneGradeForm.control}
                  name="end_page"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>صفحه پایان</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} dir="rtl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={oneGradeForm.control}
                  name="hefz"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نمره</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} dir="rtl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full">ثبت نمره</Button>
            </form>
          </Form>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="page">صفحه ای</TabsTrigger>
              <TabsTrigger value="surah">سوره و آیه</TabsTrigger>
              <TabsTrigger value="part">پاره ای</TabsTrigger>
            </TabsList>
            
            <TabsContent value="page">
              <Form {...multiGradeForm}>
                <form onSubmit={multiGradeForm.handleSubmit(handleSubmit)} className="space-y-4" dir="rtl">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={multiGradeForm.control}
                      name="start_page"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>صفحه شروع</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} dir="rtl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={multiGradeForm.control}
                      name="end_page"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>صفحه پایان</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} dir="rtl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={multiGradeForm.control}
                      name="hefz"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نمره حفظ</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} dir="rtl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={multiGradeForm.control}
                      name="tajvid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نمره تجوید</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} dir="rtl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={multiGradeForm.control}
                      name="sout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نمره صوت</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} dir="rtl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={multiGradeForm.control}
                      name="details"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نمره تفاصیل</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} dir="rtl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full">ثبت نمره</Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="surah">
              <Form {...surahForm}>
                <form onSubmit={surahForm.handleSubmit(handleSubmit)} className="space-y-4" dir="rtl">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={surahForm.control}
                      name="start_surah"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>سوره شروع</FormLabel>
                          <FormControl>
                            {isLoadingSurahs ? (
                              <div className="h-10 w-full animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-md" />
                            ) : (
                              <SingleSelectCombobox
                                options={surahs?.map(surah => ({
                                  value: surah.id.toString(),
                                  label: `${surah.titleAr}`
                                })) || []}
                                value={field.value}
                                onChange={(value) => {
                                  field.onChange(value);
                                  handleStartSurahChange(value);
                                }}
                                placeholder="انتخاب سوره"
                                className="w-full"
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={surahForm.control}
                      name="start_verse"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>آیه شروع</FormLabel>
                          <FormControl>
                            <SingleSelectCombobox
                              options={startSurahVerses?.map(verse => ({
                                value: verse.toString(),
                                label: verse.toString()
                              })) || []}
                              value={field.value}
                              onChange={(value) => field.onChange(value)}
                              placeholder="انتخاب آیه"
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={surahForm.control}
                      name="end_surah"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>سوره پایان</FormLabel>
                          <FormControl>
                            {isLoadingSurahs ? (
                              <div className="h-10 w-full animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-md" />
                            ) : (
                              <SingleSelectCombobox
                                options={surahs?.map(surah => ({
                                  value: surah.id.toString(),
                                  label: `${surah.titleAr}`
                                })) || []}
                                value={field.value}
                                onChange={handleEndSurahChange}
                                placeholder="انتخاب سوره"
                                className="w-full"
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={surahForm.control}
                      name="end_verse"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>آیه پایان</FormLabel>
                          <FormControl>
                            <SingleSelectCombobox
                              options={endSurahVerses?.map(verse => ({
                                value: verse.toString(),
                                label: verse.toString()
                              })) || []}
                              value={field.value}
                              onChange={(value) => field.onChange(value)}
                              placeholder="انتخاب آیه"
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={surahForm.control}
                      name="hefz"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نمره حفظ</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} dir="rtl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={surahForm.control}
                      name="tajvid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نمره تجوید</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} dir="rtl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={surahForm.control}
                      name="sout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نمره صوت</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} dir="rtl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={surahForm.control}
                      name="details"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نمره تفاصیل</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} dir="rtl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full">ثبت نمره</Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="part">
              <Form {...partForm}>
                <form onSubmit={partForm.handleSubmit(handleSubmit)} className="space-y-4" dir="rtl">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={partForm.control}
                      name="start_part"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>پاره شروع</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} dir="rtl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={partForm.control}
                      name="end_part"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>پاره پایان</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={partForm.control}
                      name="hefz"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نمره حفظ</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} dir="rtl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={partForm.control}
                      name="tajvid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نمره تجوید</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={partForm.control}
                      name="sout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نمره صوت</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={partForm.control}
                      name="details"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نمره تفاصیل</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full">ثبت نمره</Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface SelectCourseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseSelect: (course: Course) => void;
  dars?: Dars & {
    children?: Array<Dars>;
  };
}

function SelectCourseModal({ isOpen, onOpenChange, onCourseSelect, dars }: SelectCourseModalProps) {
  // Combine parent course and its children, removing duplicates by title
  const allCourses = React.useMemo(() => {
    const courses: Course[] = [];
    
    // First add all children courses
    if (dars?.children && dars.children.length > 0) {
      dars.children.forEach((child) => {
        // Only add if there's no course with the same title
        if (!courses.some(course => course.title === child.title)) {
          courses.push({
            id: child.id,
            title: child.title,
            is_one_grade: child.is_one_grade || null
          });
        }
      });
    }
    
    // Add parent course only if its title is not already in children
    if (dars && !courses.some(course => course.title.includes(dars.title))) {
      courses.push({
        id: dars.id,
        title: dars.title,
        is_one_grade: dars.is_one_grade || null
      });
    }
    
    return courses;
  }, [dars]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            انتخاب درس
          </DialogTitle>
          <DialogDescription className="text-center">
            لطفا درس مورد نظر را انتخاب کنید
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {allCourses.map((course) => (
            <Button
              key={course.id}
              onClick={() => {
                onCourseSelect(course);
                onOpenChange(false);
              }}
              className="w-full text-right justify-between px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
              variant="outline"
            >
              <span className="text-base">{course.title}</span>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-2 h-2 rounded-full bg-emerald-500"
              />
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AddNumberPage() {
  const { accessToken } = useAuth();
  const [classes, setClasses] = React.useState<OptimizedClass[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<OptimizedClass | null>(null);
  const [students, setStudents] = React.useState<StudentWithGrades[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [existingGrades, setExistingGrades] = React.useState<Record<number, Grade[]>>({});
  const [selectedStudent, setSelectedStudent] = React.useState<StudentType | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isOneGrade, setIsOneGrade] = React.useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = React.useState(false);
  const [selectedCourse, setSelectedCourse] = React.useState<Course | null>(null);

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
      if (!accessToken || !selectedClass || !selectedDate) return;

      try {
        const response = await optimizedClassService.getStudents(
          selectedClass.id,
          selectedDate,
          accessToken
        );

        // Create a map to track students' grades for the selected date
        const gradesMap: Record<number, Grade[]> = {};
        const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

        response.data.forEach((student) => {
          const todayGrades = student.grades.filter(
            (grade) => format(new Date(grade.created_at), "yyyy-MM-dd") === selectedDateStr
          );
          if (todayGrades.length > 0) {
            gradesMap[student.student.id] = todayGrades;
          }
        });

        // Remove duplicate students while preserving their grade information
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

      // Define the type for the payload
      type PayloadType = {
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
        lesson_area_id: number;
        user_id: number;
        tenant_id: number;
        start_page?: number;
        end_page?: number;
        start_surah?: string;
        start_verse?: number;
        end_surah?: string;
        end_verse?: number;
        start_part?: number;
        end_part?: number;
      };

      // Create the base payload
      const payload: PayloadType = {
        class_id: selectedClass.id,
        master_id: selectedClass.optimized_class_masters?.[0]?.user_id || 0,
        student_id: selectedStudent.id,
        droos_id: selectedCourse.id,
        hefz: parseFloat(data.hefz as string),
        details: parseFloat(data.details as string),
        tajvid: parseFloat(data.tajvid as string),
        sout: parseFloat(data.sout as string),
        number: 0,
        practice_count: 0,
        lesson_area_id: 0,
        user_id: 0,
        tenant_id: 0,
      };

      // Add type-specific fields
      if (data.type === 'page') {
        payload.start_page = parseInt(data.start_page as string);
        payload.end_page = parseInt(data.end_page as string);
      } else if (data.type === 'surah') {
        payload.start_surah = data.start_surah as string;
        payload.start_verse = parseInt(data.start_verse as string);
        payload.end_surah = data.end_surah as string;
        payload.end_verse = parseInt(data.end_verse as string);
      } else if (data.type === 'part') {
        payload.start_part = parseInt(data.start_part as string);
        payload.end_part = parseInt(data.end_part as string);
      }

      await optimizedNumberService.create(payload, accessToken);
      toast.success("نمره با موفقیت ثبت شد");
      setIsModalOpen(false);
      setSelectedCourse(null);
      
      // Refresh the student data to get the updated grades
      const response = await optimizedClassService.getStudents(
        selectedClass.id,
        selectedDate,
        accessToken
      );
      
      // Update the grades for this student
      const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
      const student = response.data.find(s => s.student.id === selectedStudent.id);
      if (student) {
        const todayGrades = student.grades.filter(
          (grade) => format(new Date(grade.created_at), "yyyy-MM-dd") === selectedDateStr
        );
        setExistingGrades(prev => ({
          ...prev,
          [selectedStudent.id]: todayGrades
        }));
      }
    } catch (error) {
      console.error(error);
      toast.error("خطا در ثبت نمره");
    } finally {
      setLoading(false);
    }
  };

  const isWithin24Hours = (date: string) => {
    const gradeDate = new Date(date);
    const twentyFourHoursAgo = subHours(new Date(), 24);
    return gradeDate > twentyFourHoursAgo;
  };

  const handleEditGrade = async (studentId: number, grade: Grade) => {
    // TODO: Implement grade editing functionality
    console.log("Editing grade for student", studentId, grade);
  };
  
  return (
    <PageTransition>
      <div className="space-y-4 min-h-[80vh]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg p-4 shadow-lg border-0 relative overflow-hidden">
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
                <SingleSelectCombobox
                  options={classes.map((classItem) => ({
                    value: classItem.id.toString(),
                    label: `${classItem.dars?.title || "بدون نام"} - ${
                      classItem.optimized_class_masters?.[0]?.master?.fullname ||
                      classItem.optimized_class_masters?.[0]?.users?.fullname ||
                      "بدون استاد"
                    }-${classItem.id || "بدون درس"}`,
                  }))}
                  value={selectedClass?.id.toString()}
                  onChange={(value: string) => handleClassChange(value)}
                  placeholder="انتخاب کلاس"
                  className="w-full"
                />
              </div>
              <div className="flex-1 w-full mx-auto">
                <DatePicker onChange={(date: Date) => setSelectedDate(date)} />
              </div>
            </div>

            {selectedClass ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map((studentData, index) => (
                    <motion.div
                      key={studentData.student.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
                      transition={{ 
                        duration: 0.5,
                        delay: index * 0.1,
                        ease: [0.4, 0, 0.2, 1],
                        opacity: { duration: 0.3 },
                        y: { duration: 0.3 }
                      }}
                      className="flex flex-col p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:shadow-lg hover:border-emerald-500/20 dark:hover:border-emerald-500/30 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <motion.div 
                            className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center overflow-hidden"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.2 }}
                          >
                            {studentData.student.aks ? (
                              <Image 
                                src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${studentData.student.aks}`} 
                                alt={studentData.student.name}
                                className="w-full h-full object-cover"
                                width={40}
                                height={40}
                              />
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                {studentData.student.name.charAt(0)}
                              </span>
                            )}
                          </motion.div>
                          <motion.div 
                            className="flex flex-col"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 + 0.3 }}
                          >
                            <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                              {studentData.student.name}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {studentData.student.student_code}
                            </span>
                          </motion.div>
                        </div>
                        {!existingGrades[studentData.student.id] && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.4 }}
                          >
                            {isWithin24Hours(new Date().toString()) ? (
                              <Button
                                onClick={() => handleAddNumber(studentData.student.id)}
                                disabled={loading}
                                size="sm"
                                className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-zinc-900 dark:hover:bg-emerald-400 transition-colors duration-200"
                              >
                                افزودن نمره
                              </Button>
                            ) : (
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                زمان افزودن نمره به پایان رسیده است
                              </span>
                            )}
                          </motion.div>
                        )}
                      </div>
                      
                      {existingGrades[studentData.student.id] && (
                        <div className="grid grid-cols-1 gap-2">
                          {existingGrades[studentData.student.id].map((grade, gradeIndex) => (
                            <motion.div 
                              key={gradeIndex} 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ 
                                duration: 0.4,
                                delay: (index * 0.1) + (gradeIndex * 0.1) + 0.5,
                                ease: [0.4, 0, 0.2, 1]
                              }}
                              className="group relative bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800/50 dark:to-zinc-900/50 p-2 rounded-md hover:shadow-md transition-all duration-300"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                  {grade.dars?.title || "بدون نام"}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                    {(grade.hefz + grade.tajvid + grade.sout + grade.details)}
                                  </span>
                                  {isWithin24Hours(grade.created_at) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditGrade(studentData.student.id, grade)}
                                      className="h-6 px-1 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
                                    >
                                      <Edit2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              
                              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white dark:bg-zinc-900 p-3 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 z-10 w-full left-0 top-full mt-1">
                                <div className="grid grid-cols-4 gap-2 text-xs">
                                  <div className="flex flex-col">
                                    <span className="text-zinc-500 dark:text-zinc-400">حفظ</span>
                                    <span className="font-medium text-emerald-700 dark:text-emerald-400">{grade.hefz}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-zinc-500 dark:text-zinc-400">تجوید</span>
                                    <span className="font-medium text-emerald-700 dark:text-emerald-400">{grade.tajvid}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-zinc-500 dark:text-zinc-400">صوت</span>
                                    <span className="font-medium text-emerald-700 dark:text-emerald-400">{grade.sout}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-zinc-500 dark:text-zinc-400">تفاصیل</span>
                                    <span className="font-medium text-emerald-700 dark:text-emerald-400">{grade.details}</span>
                                  </div>
                                </div>
                                {grade.lesson_area && (
                                  <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                                    {grade.lesson_area.start_page && grade.lesson_area.end_page ? (
                                      <span>صفحه {grade.lesson_area.start_page} تا {grade.lesson_area.end_page}</span>
                                    ) : grade.lesson_area.start_surah?.titleAr && grade.lesson_area.end_surah?.titleAr ? (
                                      <span>
                                        سوره <span className="text-amber-600 dark:text-amber-400 mx-1">{grade.lesson_area.start_surah.titleAr}</span> آیه {grade.lesson_area.start_verse} تا سوره <span className="text-amber-600 dark:text-amber-400 mx-1">{grade.lesson_area.end_surah.titleAr}</span> آیه {grade.lesson_area.end_verse}
                                      </span>
                                    ) : null}
                                  </div>
                                )}
                                <div className="mt-2 text-[10px] text-zinc-400 dark:text-zinc-500">
                                  {format(new Date(grade.created_at), "HH:mm - yyyy/MM/dd")}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center p-4">
                <TextEffect preset='fade-in-blur' className=" max-w-fit  p-2 rounded-lg" speedReveal={0.7} speedSegment={0.7}>
                  لطفا کلاس و تاریخ را انتخاب کنید
                </TextEffect>
              </div>
            )}
          </CardContent>
        </Card>
       
      </div>

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
            isOneGrade={isOneGrade}
            selectedCourse={selectedCourse}
          />
        </>
      )}
    </PageTransition>
  );
}
