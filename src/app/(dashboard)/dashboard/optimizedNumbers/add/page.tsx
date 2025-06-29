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
import { MasterService, Master } from "@/lib/services/master.service";
import { studentActivityService, CreateStudentActivityDto } from "@/lib/services/studentActivity.service";
import { format, subHours } from "date-fns-jalali";
import { SingleSelectCombobox } from "@/components/ui/Combobox";
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
import { UseFormReturn } from "react-hook-form";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { useState } from "react";

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
    .min(1, "نمره تفاصیل الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10, {
      message: "نمره تفاصیل باید بین 0 تا 10 باشد"
    }),
});

const oneGradeSchema = z.object({
  start_page: z.string().min(1, "صفحه شروع الزامی است"),
  end_page: z.string().min(1, "صفحه پایان الزامی است"),
  hefz: z.string()
    .min(1, "نمره الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 70, {
      message: "نمره باید بین 0 تا 70 باشد"
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
    .min(1, "نمره تفاصیل الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10, {
      message: "نمره تفاصیل باید بین 0 تا 10 باشد"
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
    .min(1, "نمره تفاصیل الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10, {
      message: "نمره تفاصیل باید بین 0 تا 10 باشد"
    }),
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

interface FormRefs {
  multiGradeForm: UseFormReturn<z.infer<typeof pageBasedSchema>>;
  surahForm: UseFormReturn<z.infer<typeof surahBasedSchema>>;
  partForm: UseFormReturn<z.infer<typeof partBasedSchema>>;
  activeTab: string;
}

interface AddGradeModalProps {
  student: StudentType;
  onSubmit: (data: Record<string, unknown>) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isOneGrade?: boolean;
  selectedCourse?: Course | null;
  onFormRefsChange?: (refs: FormRefs) => void;
}

function AddGradeModal({ student, onSubmit, isOpen, onOpenChange, isOneGrade = false, selectedCourse, onFormRefsChange }: AddGradeModalProps) {
  const [activeTab, setActiveTab] = React.useState("page");
  const [surahs, setSurahs] = React.useState<Surah[]>([]);
  const [startSurahVerses, setStartSurahVerses] = React.useState<number[]>([]);
  const [endSurahVerses, setEndSurahVerses] = React.useState<number[]>([]);
  const [isLoadingSurahs, setIsLoadingSurahs] = React.useState(true);
  const { accessToken } = useAuth();
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
      start_joze: "",
      end_joze: "",
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
        if (response && Array.isArray(response)) {
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
      surahForm.setValue("end_surah", surahId);
      handleEndSurahChange(surahId);
    }
  };
  const handleEndSurahChange = (surahId: string) => {
    const selectedSurah = surahs.find(s => s.id.toString() === surahId);
    if (selectedSurah) {
      const verses = Array.from({ length: selectedSurah.count }, (_, i) => i + 1);
      setEndSurahVerses(verses);
      surahForm.setValue("end_surah", surahId);
    }
  };

  const handleSubmit = (data: Record<string, unknown>) => {
    onSubmit({ ...data, type: activeTab });
  };

  React.useEffect(() => {
    if (onFormRefsChange) {
      onFormRefsChange({
        multiGradeForm,
        surahForm,
        partForm,
        activeTab
      });
    }
  }, [multiGradeForm, surahForm, partForm, activeTab, onFormRefsChange]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => {
          // Look for combobox elements
          let targetElement = e.target as HTMLElement;
          while (targetElement && targetElement !== document.body) {
            // Check for any popover or command related attributes
            if (
              targetElement.hasAttribute('data-radix-popper-content-wrapper') || 
              targetElement.hasAttribute('data-popover-content') ||
              targetElement.hasAttribute('cmdk-list') ||
              targetElement.hasAttribute('cmdk-group') ||
              targetElement.hasAttribute('cmdk-item') ||
              targetElement.getAttribute('role') === 'listbox' ||
              targetElement.getAttribute('role') === 'option'
            ) {
              e.preventDefault();
              return;
            }
            targetElement = targetElement.parentElement as HTMLElement;
          }
        }}
      >
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
              <TabsTrigger value="part">جز ای</TabsTrigger>
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
                      name="start_joze"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>جز شروع</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} dir="rtl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={partForm.control}
                      name="end_joze"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>جز پایان</FormLabel>
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
  const allCourses = React.useMemo(() => {
    const courses: Course[] = [];
    
    if (dars?.children && dars.children.length > 0) {
      dars.children.forEach((child) => {
        if (!courses.some(course => course.title === child.title)) {
          courses.push({
            id: child.id,
            title: child.title,
            is_one_grade: child.is_one_grade || null
          });
        }
      });
    }
    
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

interface ValidationError {
  response?: {
    data?: {
      errors?: Record<string, string[]>;
    };
  };
}

interface FormField {
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
}

interface EditingGrade extends Grade {
  studentId: number;
}

interface EditGradeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  grade: Grade;
  onSubmit: (form: Record<string, string | number>) => void;
}

function EditGradeModal({ isOpen, onOpenChange, grade, onSubmit }: EditGradeModalProps) {
  const [form, setForm] = React.useState({
    hefz: grade.hefz,
    tajvid: grade.tajvid,
    sout: grade.sout,
    details: grade.details,
    start_page: grade.lesson_area?.start_page || '',
    end_page: grade.lesson_area?.end_page || '',
    start_surah: grade.lesson_area?.start_surah?.id?.toString() || '',
    start_verse: grade.lesson_area?.start_verse || '',
    end_surah: grade.lesson_area?.end_surah?.id?.toString() || '',
    end_verse: grade.lesson_area?.end_verse || '',
    start_joze: grade.lesson_area?.start_joze || '',
    end_joze: grade.lesson_area?.end_joze || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">ویرایش نمره</DialogTitle>
          <DialogDescription className="text-center">مقادیر را ویرایش و ذخیره کنید</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
          <div className="grid grid-cols-2 gap-4">
            <Input name="hefz" type="number" value={form.hefz} onChange={handleChange} placeholder="نمره حفظ" />
            <Input name="tajvid" type="number" value={form.tajvid} onChange={handleChange} placeholder="نمره تجوید" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input name="sout" type="number" value={form.sout} onChange={handleChange} placeholder="نمره صوت" />
            <Input name="details" type="number" value={form.details} onChange={handleChange} placeholder="نمره تفاصیل" />
          </div>
          {/* Optionally add fields for page/surah/joze if needed */}
          <Button type="submit" className="w-full">ذخیره تغییرات</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface AbsentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentType;
  onSubmit: (reason: string) => void;
}

function AbsentModal({ isOpen, onOpenChange, student, onSubmit }: AbsentModalProps) {
  const absentReasons = [
    { value: "مرخصی", label: "مرخصی" },
    { value: "بدون هماهنگی", label: "بدون هماهنگی" },
    { value: "مریض", label: "مریض" }
  ];

  const handleReasonSelect = (reason: string) => {
    onSubmit(reason);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            ثبت غیبت برای {student.name}
          </DialogTitle>
          <DialogDescription className="text-center">
            لطفا دلیل غیبت را انتخاب کنید
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {absentReasons.map((reason) => (
            <Button
              key={reason.value}
              onClick={() => handleReasonSelect(reason.value)}
              className="w-full text-right justify-between px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              variant="outline"
            >
              <span className="text-base">{reason.label}</span>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-2 h-2 rounded-full bg-red-500"
              />
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}



export default function AddNumberPage() {
  const { accessToken, user } = useAuth();
  const [classes, setClasses] = React.useState<OptimizedClass[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<OptimizedClass | null>(null);
  const [students, setStudents] = React.useState<StudentWithGrades[]>([]);
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<EditingGrade | null>(null);
  const [isAbsentModalOpen, setIsAbsentModalOpen] = React.useState(false);
  const [absentStudent, setAbsentStudent] = React.useState<StudentType | null>(null);

  React.useEffect(() => {
    const fetchMasterData = async () => {
      if (!accessToken || !user?.username) return;
      
      try {
        console.log("Fetching master data...");
        console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
        console.log("User username:", user.username);
        
        const response = await MasterService.getMasters({}, accessToken);
        const foundMaster = response.data.data.find(
          (master) => master.mellicode === user.username
        );
        setMasterData(foundMaster || null);
        console.log("Master data fetched successfully:", foundMaster);
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
  }, [accessToken, user?.username]);

  React.useEffect(() => {
    const fetchClasses = async () => {
      if (!accessToken) return;
      try {
        setLoading(true);
        console.log("Fetching classes with token:", accessToken ? "Present" : "Missing");
        
        // Use the simple method instead of paginated one
        const response = await optimizedClassService.getAllSimple(accessToken);
        console.log("Classes response:", response);
        
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

  React.useEffect(() => {
    const fetchStudents = async () => {
      if (!accessToken || !selectedClass || !selectedDate) return;

      try {
        const jsDate = selectedDate ? selectedDate.toDate() : null;
        const jsDateStr = jsDate ? format(jsDate, "yyyy/MM/dd") : null;
        if (!jsDate) return;
        const response = await optimizedClassService.getStudents(
          selectedClass.id,
          jsDateStr!,
          accessToken
        );

        const gradesMap: Record<number, Grade[]> = {};
        const selectedDateStr = jsDate ? format(jsDate, "yyyy-MM-dd") : "";

        response.data.forEach((student) => {
          const todayGrades = student.grades.filter(
            (grade) => format(new Date(grade.created_at), "yyyy-MM-dd") === selectedDateStr
          );
          if (todayGrades.length > 0) {
            gradesMap[student.student.id] = todayGrades;
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
        start_joze?: number;
        end_joze?: number;
      };

      const payload: PayloadType = {
        class_id: selectedClass.id,
        master_id: selectedClass.optimized_class_masters?.[0]?.master?.id || selectedClass.optimized_class_masters?.[0]?.user_id || 0,
        student_id: selectedStudent.id,
        droos_id: selectedCourse.id,
        hefz: parseFloat(data.hefz as string),
        details: parseFloat(data.details as string),
        tajvid: parseFloat(data.tajvid as string),
        sout: parseFloat(data.sout as string),
        number: 0,
        practice_count: 0,
        lesson_area_id: selectedClass.dars?.id || 0,
        user_id: 0,
        tenant_id: 0,
      };

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

      const jsDate = selectedDate ? selectedDate.toDate() : null;
      const jsDateStr = jsDate ? format(jsDate, "yyyy/MM/dd") : null;
      if (!jsDate) return;

      await optimizedNumberService.create(payload, accessToken);
      toast.success("نمره با موفقیت ثبت شد");
      setIsModalOpen(false);
      setSelectedCourse(null);
      
      const response = await optimizedClassService.getStudents(
        selectedClass.id,
        jsDateStr!,
        accessToken
      );
      
      const selectedDateStr = jsDate ? format(jsDate, "yyyy-MM-dd") : "";
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
            .replace("The details field must not be greater than 10.", "نمره تفاصیل نباید بیشتر از 10 باشد");
          
          if (isOneGrade) {
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

  const isWithin24Hours = (date: string) => {
    const gradeDate = new Date(date);
    const twentyFourHoursAgo = subHours(new Date(), 24);
    return gradeDate > twentyFourHoursAgo;
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
      const updated = await optimizedNumberService.update(editingGrade.id, {
        hefz: parseFloat(form.hefz as string),
        tajvid: parseFloat(form.tajvid as string),
        sout: parseFloat(form.sout as string),
        details: parseFloat(form.details as string),
        // Add other fields as needed
      }, accessToken!);
      toast.success("نمره با موفقیت ویرایش شد");
      // Update local state
      setExistingGrades(prev => {
        const grades = prev[editingGrade.studentId]?.map((g: Grade) => {
          if (g.id === updated.id) {
            // Only update the fields that are safe to update
            return {
              ...g,
              hefz: updated.hefz,
              tajvid: updated.tajvid,
              sout: updated.sout,
              details: updated.details,
            };
          }
          return g;
        }) || [];
        return { ...prev, [editingGrade.studentId]: grades };
      });
      setEditModalOpen(false);
      setEditingGrade(null);
    } catch {
      toast.error("خطا در ویرایش نمره");
    } finally {
      setLoading(false);
    }
  };

  const handleProvideless = async (studentId: number) => {
    console.log("🔄 Starting handleProvideless for student:", studentId);
    
    if (!accessToken) {
      console.log("❌ No access token");
      toast.error("توکن دسترسی موجود نیست");
      return;
    }
    
    if (!selectedClass) {
      console.log("❌ No selected class");
      toast.error("لطفا کلاس را انتخاب کنید");
      return;
    }
    
    if (!masterData) {
      console.log("❌ No master data:", masterData);
      toast.error("اطلاعات مربی یافت نشد");
      return;
    }
    
    const student = students.find(s => s.student.id === studentId);
    if (!student) {
      console.log("❌ Student not found");
      toast.error("دانش آموز یافت نشد");
      return;
    }

    try {
      setLoading(true);
      console.log("✅ All conditions passed, starting API calls...");
      
      // Get master_id from class or masterData
      const masterId = masterData.id || selectedClass.optimized_class_masters?.[0]?.master?.id || selectedClass.optimized_class_masters?.[0]?.user_id || 0;
      
      console.log("📋 masterId:", masterId);
      
      // Create student activity for provideless
      const activityData: CreateStudentActivityDto = {
        student_id: studentId,
        master_id: masterId,
        classha_id: selectedClass.id,
        class_absent: false,
        provideless: true,
        user_id: masterData.user_id || user?.id || 0,
      };

      console.log("activityData:", activityData);
      
      await studentActivityService.create(activityData, accessToken);
      console.log("Student activity created successfully");

      // Create a grade with score 55
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
        lesson_area_id: selectedClass.dars?.id || 0,
        user_id: masterData.user_id || user?.id || 0,
        tenant_id: 0,
      };

      console.log("gradePayload:", gradePayload);
      
      await optimizedNumberService.create(gradePayload, accessToken);
      console.log("Grade created successfully");
      
      toast.success("عدم تحویل با موفقیت ثبت شد");
      
      // Refresh students data
      if (selectedDate) {
        const jsDate = selectedDate.toDate();
        const jsDateStr = format(jsDate, "yyyy/MM/dd");
        const response = await optimizedClassService.getStudents(
          selectedClass.id,
          jsDateStr,
          accessToken
        );
        
        const selectedDateStr = format(jsDate, "yyyy-MM-dd");
        const updatedStudent = response.data.find(s => s.student.id === studentId);
        if (updatedStudent) {
          const todayGrades = updatedStudent.grades.filter(
            (grade) => format(new Date(grade.created_at), "yyyy-MM-dd") === selectedDateStr
          );
          setExistingGrades(prev => ({
            ...prev,
            [studentId]: todayGrades
          }));
        }
      }
    } catch (error) {
      console.error("Error in handleProvideless:", error);
      toast.error("خطا در ثبت عدم تحویل: " + (error as any)?.response?.data?.message || (error as any)?.message || "خطای نامشخص");
    } finally {
      setLoading(false);
    }
  };

  const handleAbsent = (studentId: number) => {
    console.log("handleAbsent called with studentId:", studentId);
    

    const student = students.find(s => s.student.id === studentId);
    if (student) {
      setAbsentStudent(student.student);
      setIsAbsentModalOpen(true);
      console.log("Absent modal opened for student:", student.student.name);
    } else {
      toast.error("دانش آموز یافت نشد");
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
    
    if (!masterData) {
      toast.error("اطلاعات مربی یافت نشد");
      return;
    }
    
    if (!absentStudent) {
      toast.error("دانش آموز انتخاب نشده است");
      return;
    }

    try {
      setLoading(true);
      
      // Get master_id from class or masterData
      const masterId = masterData.id || selectedClass.optimized_class_masters?.[0]?.master?.id || selectedClass.optimized_class_masters?.[0]?.user_id || 0;
      
      console.log("masterId:", masterId);
      
      const activityData: CreateStudentActivityDto = {
        student_id: absentStudent.id,
        master_id: masterId,
        classha_id: selectedClass.id,
        class_absent: true,
        provideless: false,
        reason: reason,
        user_id: masterData.user_id || user?.id || 0,
      };

      console.log("activityData:", activityData);
      
      await studentActivityService.create(activityData, accessToken);
      console.log("Student activity created successfully");
      
      toast.success(`غیبت با دلیل "${reason}" ثبت شد`);
      
    } catch (error) {
      console.error("Error in handleAbsentSubmit:", error);
      toast.error("خطا در ثبت غیبت: " + (error as any)?.response?.data?.message || (error as any)?.message || "خطای نامشخص");
    } finally {
      setLoading(false);
    }
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
                {user?.app_roles?.some(role => role.name === 'admin') ? (
                  <SingleSelectCombobox
                    options={classes.map((classItem) => ({
                      value: classItem.id.toString(),
                      label: `${classItem.dars?.title || "بدون نام"} - ${
                        classItem.optimized_class_masters?.[0]?.master?.fullname ||
                        classItem.optimized_class_masters?.[0]?.users?.fullname ||
                        "بدون استاد"
                      }`,
                    }))}
                    value={selectedClass?.id.toString()}
                    onChange={(value: string) => handleClassChange(value)}
                    placeholder="انتخاب کلاس"
                    className="w-full"
                  />
                ) :
                !user?.app_roles?.some(role => role.name === 'master') ? (
                  <div className="text-center text-red-500">شما نقش مربی ندارید</div>
                ) : !masterData ? (
                  <div className="text-center text-red-500">برای شما هیچ کلاسی ثبت نشده است</div>
                ) : (
                  <SingleSelectCombobox
                    options={classes
                      .filter(classItem =>
                        classItem.optimized_class_masters?.some(master =>
                          master.master?.id === masterData.id
                        )
                      )
                      .map((classItem) => ({
                        value: classItem.id.toString(),
                        label: `${classItem.dars?.title || "بدون نام"} - ${
                          classItem.optimized_class_masters?.[0]?.master?.fullname ||
                          classItem.optimized_class_masters?.[0]?.users?.fullname ||
                          "بدون استاد"
                        }`,
                      }))}
                    value={selectedClass?.id.toString()}
                    onChange={(value: string) => handleClassChange(value)}
                    placeholder="انتخاب کلاس"
                    className="w-full"
                  />
                )}
              </div>
              <div className="flex-1 w-full mx-auto">
                <DatePicker onChange={setSelectedDate} 
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  style={{ width: "100%" }}
                  inputClass="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 px-3 py-2"/>
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
                        {(!existingGrades[studentData.student.id] || existingGrades[studentData.student.id].length < 3) && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.4 }}
                          >
                            {isWithin24Hours(new Date().toString()) ? (
                              <div className="flex flex-col items-end gap-1">
                                <Button
                                  onClick={() => handleAddNumber(studentData.student.id)}
                                  disabled={loading}
                                  size="sm"
                                  className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-zinc-900 dark:hover:bg-emerald-400 transition-colors duration-200"
                                >
                                  افزودن نمره
                                </Button>
                                <div className="flex gap-1">
                                  <Button
                                    onClick={() => handleProvideless(studentData.student.id)}
                                    disabled={loading}
                                    size="sm"
                                    className="bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:text-zinc-900 dark:hover:bg-orange-400 transition-colors duration-200 text-xs px-2"
                                  >
                                    عدم تحویل
                                  </Button>
                                  <Button
                                    onClick={() => handleAbsent(studentData.student.id)}
                                    disabled={loading}
                                    size="sm"
                                    className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:text-zinc-900 dark:hover:bg-red-400 transition-colors duration-200 text-xs px-2"
                                  >
                                    غایب
                                  </Button>
                                </div>
                              </div>
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
                          {existingGrades[studentData.student.id].map((grade, gradeIndex) => {
                            const totalScore = Number(grade.hefz) + Number(grade.tajvid) + Number(grade.sout) + Number(grade.details);
                            const isNegative = totalScore < 80;
                            
                            return (
                              <motion.div 
                                key={gradeIndex} 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ 
                                  duration: 0.4,
                                  delay: (index * 0.1) + (gradeIndex * 0.1) + 0.5,
                                  ease: [0.4, 0, 0.2, 1]
                                }}
                                className={`group relative bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800/50 dark:to-zinc-900/50 p-2 rounded-md hover:shadow-md transition-all duration-300 ${
                                  isNegative ? 'hover:border-2 hover:border-red-500/50 dark:hover:border-red-500/30' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                    {grade.dars?.title || "بدون نام"}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <span className={`text-sm font-bold ${
                                        isNegative ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                                      }`}>
                                        {totalScore}
                                      </span>
                                      {isNegative && (
                                        <motion.span 
                                          initial={{ opacity: 0, scale: 0.8 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full"
                                        >
                                          منفی
                                        </motion.span>
                                      )}
                                    </div>
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
                              </motion.div>
                            );
                          })}
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
            onFormRefsChange={setFormRefs}
          />
        </>
      )}

      {editModalOpen && editingGrade && (
        <EditGradeModal
          isOpen={editModalOpen}
          onOpenChange={setEditModalOpen}
          grade={editingGrade}
          onSubmit={handleEditModalSubmit}
        />
      )}

      {absentStudent && (
        <AbsentModal
          isOpen={isAbsentModalOpen}
          onOpenChange={setIsAbsentModalOpen}
          student={absentStudent}
          onSubmit={handleAbsentSubmit}
        />
      )}
    </PageTransition>
  );
}
