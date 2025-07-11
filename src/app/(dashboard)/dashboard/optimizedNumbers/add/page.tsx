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
  Dars,
  Student
} from "@/lib/services/optimizedClass.service";
import { MasterService, Master } from "@/lib/services/master.service";
import { studentActivityService, CreateStudentActivityDto } from "@/lib/services/studentActivity.service";
import { format, subHours } from "date-fns-jalali";
import { SingleSelectCombobox } from "@/components/ui/Combobox";
import { Edit2, X, Loader2 } from "lucide-react";
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
import { useState, useEffect } from "react";

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

// New schema for is_one_grade droos with surah/verse fields
const oneGradeSurahSchema = z.object({
  start_surah: z.string().min(1, "سوره شروع الزامی است"),
  start_verse: z.string().min(1, "آیه شروع الزامی است"),
  end_surah: z.string().min(1, "سوره پایان الزامی است"),
  end_verse: z.string().min(1, "آیه پایان الزامی است"),
  number: z.string()
    .min(1, "نمره الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, {
      message: "نمره باید بین 0 تا 100 باشد"
    }),
});

// Schema for is_one_grade droos with page fields
const oneGradePageSchema = z.object({
  start_page: z.string().min(1, "صفحه شروع الزامی است"),
  end_page: z.string().min(1, "صفحه پایان الزامی است"),
  number: z.string()
    .min(1, "نمره الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, {
      message: "نمره باید بین 0 تا 100 باشد"
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

interface AddGradeModalProps {
  student: StudentType;
  onSubmit: (data: Record<string, unknown>) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isOneGrade?: boolean;
  selectedCourse?: Course | null;
  onFormRefsChange?: (refs: FormRefs) => void;
  isLoading?: boolean;
}

// Helper function to identify reading classes
const isReadingClass = (courseTitle: string): boolean => {
  const readingKeywords = ['روخوانی', 'قرائت', 'خواندن', 'reading'];
  return readingKeywords.some(keyword => 
    courseTitle.toLowerCase().includes(keyword.toLowerCase())
  );
};

function AddGradeModal({ student, onSubmit, isOpen, onOpenChange, isOneGrade = false, selectedCourse, onFormRefsChange, isLoading = false }: AddGradeModalProps) {
  const [activeTab, setActiveTab] = React.useState("page");
  const [surahs, setSurahs] = React.useState<Surah[]>([]);
  const [startSurahVerses, setStartSurahVerses] = React.useState<number[]>([]);
  const [endSurahVerses, setEndSurahVerses] = React.useState<number[]>([]);
  const [isLoadingSurahs, setIsLoadingSurahs] = React.useState(true);
  const { accessToken } = useAuth();
  
  // Determine if this is a reading class
  const isReadingClassType = selectedCourse ? isReadingClass(selectedCourse.title) : false;
  const shouldUseOneGrade = isOneGrade || isReadingClassType;
  
  // Check if this is a hefz class (new type for is_one_grade)
  const isHefzClass = selectedCourse?.title?.toLowerCase().includes('حفظ') || false;

  const oneGradeForm = useForm({
    resolver: zodResolver(oneGradeSchema),
    defaultValues: {
      start_page: "",
      end_page: "",
      hefz: "",
    },
  });

  // New forms for is_one_grade droos
  const oneGradeSurahForm = useForm({
    resolver: zodResolver(oneGradeSurahSchema),
    defaultValues: {
      start_surah: "",
      start_verse: "",
      end_surah: "",
      end_verse: "",
      number: "",
    },
  });

  const oneGradePageForm = useForm({
    resolver: zodResolver(oneGradePageSchema),
    defaultValues: {
      start_page: "",
      end_page: "",
      number: "",
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

  // Clear all forms when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      // Reset all forms when modal closes
      oneGradeForm.reset();
      oneGradeSurahForm.reset();
      oneGradePageForm.reset();
      multiGradeForm.reset();
      surahForm.reset();
      partForm.reset();
      setActiveTab("page");
      setStartSurahVerses([]);
      setEndSurahVerses([]);
    }
  }, [isOpen, oneGradeForm, oneGradeSurahForm, oneGradePageForm, multiGradeForm, surahForm, partForm]);

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
    
    // Clear forms after successful submission
    setTimeout(() => {
      oneGradeForm.reset();
      oneGradeSurahForm.reset();
      oneGradePageForm.reset();
      multiGradeForm.reset();
      surahForm.reset();
      partForm.reset();
      setActiveTab("page");
      setStartSurahVerses([]);
      setEndSurahVerses([]);
    }, 100);
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

  // Removed unused readingGradeSchema and readingGradeForm

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
                {isReadingClassType && (
                  <span className="text-blue-500 dark:text-blue-400 text-sm block mt-1">
                    (کلاس روخوانی - تک نمره)
                  </span>
                )}
           
              </motion.p>
            </DialogTitle>
            <DialogDescription className="text-center">
              {isReadingClassType 
                ? "لطفا نمره روخوانی را وارد کنید" 
                : isHefzClass
                ? "لطفا نمره حفظ را وارد کنید "
                : "لطفا نوع درس و نمرات را وارد کنید"
              }
            </DialogDescription>
          </motion.div>
        </DialogHeader>
        {shouldUseOneGrade ? (
          // Handle different types of is_one_grade droos
          isHefzClass ? (
            // Hefz class with surah/verse fields
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="surah">سوره و آیه</TabsTrigger>
                <TabsTrigger value="page">صفحه ای</TabsTrigger>
              </TabsList>
              
              <TabsContent value="surah">
                <Form {...oneGradeSurahForm}>
                  <form onSubmit={oneGradeSurahForm.handleSubmit(handleSubmit)} className="space-y-4" dir="rtl">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={oneGradeSurahForm.control}
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
                        control={oneGradeSurahForm.control}
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
                        control={oneGradeSurahForm.control}
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
                        control={oneGradeSurahForm.control}
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
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={oneGradeSurahForm.control}
                        name="number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نمره حفظ (0 تا 100)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" max="100" {...field} dir="rtl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>در حال ثبت...</span>
                        </div>
                      ) : (
                        "ثبت نمره"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="page">
                <Form {...oneGradePageForm}>
                  <form onSubmit={oneGradePageForm.handleSubmit(handleSubmit)} className="space-y-4" dir="rtl">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={oneGradePageForm.control}
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
                        control={oneGradePageForm.control}
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
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={oneGradePageForm.control}
                        name="number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نمره حفظ (0 تا 100)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" max="100" {...field} dir="rtl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>در حال ثبت...</span>
                        </div>
                      ) : (
                        "ثبت نمره"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          ) : isReadingClassType ? (
            // Reading class (existing logic)
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
                        <FormLabel>نمره روخوانی</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} dir="rtl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال ثبت...</span>
                    </div>
                  ) : (
                    "ثبت نمره"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            // Other is_one_grade droos (existing logic)
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال ثبت...</span>
                    </div>
                  ) : (
                    "ثبت نمره"
                  )}
                </Button>
              </form>
            </Form>
          )
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
                          <FormLabel>نمره مشخصات</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} dir="rtl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>در حال ثبت...</span>
                      </div>
                    ) : (
                      "ثبت نمره"
                    )}
                  </Button>
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
                          <FormLabel>نمره مشخصات</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} dir="rtl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>در حال ثبت...</span>
                      </div>
                    ) : (
                      "ثبت نمره"
                    )}
                  </Button>
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
                          <FormLabel>نمره مشخصات</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>در حال ثبت...</span>
                      </div>
                    ) : (
                      "ثبت نمره"
                    )}
                  </Button>
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
          {allCourses.map((course) => {
            const isReadingClassType = isReadingClass(course.title);
            const isHefzClass = course.title?.toLowerCase().includes('حفظ') || false;
            return (
              <Button
                key={course.id}
                onClick={() => {
                  onCourseSelect(course);
                  onOpenChange(false);
                }}
                className="w-full text-right justify-between px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                variant="outline"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{course.title}</span>
                  {isReadingClassType && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                      روخوانی
                    </span>
                  )}
                  {isHefzClass && !isReadingClassType && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full">
                      حفظ
                    </span>
                  )}
                </div>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-2 h-2 rounded-full bg-emerald-500"
                />
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}



interface ValidationError {
  response?: {
    data?: {
      errors?: Record<string, string[]>;
      message?: string;
    };
  };
  message?: string;
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
  isLoading?: boolean;
}

function EditGradeModal({ isOpen, onOpenChange, grade, onSubmit, isLoading = false }: EditGradeModalProps) {
  const [form, setForm] = React.useState({
    hefz: grade.hefz ?? 0,
    tajvid: grade.tajvid ?? 0,
    sout: grade.sout ?? 0,
    details: grade.details ?? 0,
    start_page: grade.lesson_area?.start_page || '',
    end_page: grade.lesson_area?.end_page || '',
    start_surah: grade.lesson_area?.start_surah?.id ? grade.lesson_area.start_surah.id.toString() : '',
    start_verse: grade.lesson_area?.start_verse || '',
    end_surah: grade.lesson_area?.end_surah?.id ? grade.lesson_area.end_surah.id.toString() : '',
    end_verse: grade.lesson_area?.end_verse || '',
    start_joze: grade.lesson_area?.start_joze || '',
    end_joze: grade.lesson_area?.end_joze || '',
    number: grade.number ?? 0,
  });

  // سوره‌ها و آیه‌ها
  const [surahs, setSurahs] = React.useState<Surah[]>([]);
  const [startSurahVerses, setStartSurahVerses] = React.useState<number[]>([]);
  const [endSurahVerses, setEndSurahVerses] = React.useState<number[]>([]);
  const [isLoadingSurahs, setIsLoadingSurahs] = React.useState(true);
  const { accessToken } = useAuth();

  useEffect(() => {
    const fetchSurahs = async () => {
      if (!accessToken) return;
      try {
        setIsLoadingSurahs(true);
        const response = await SurahService.getAllSurahs(accessToken);
        if (response && Array.isArray(response)) {
          const sortedSurahs = response.sort((a: Surah, b: Surah) => a.index - b.index);
          setSurahs(sortedSurahs);
        }
      } finally {
        setIsLoadingSurahs(false);
      }
    };
    fetchSurahs();
  }, [accessToken]);

  useEffect(() => {
    // مقداردهی اولیه آیه‌ها بر اساس سوره انتخابی
    if (form.start_surah) {
      const selectedSurah = surahs.find(s => s.id.toString() === form.start_surah);
      if (selectedSurah) {
        setStartSurahVerses(Array.from({ length: selectedSurah.count }, (_, i) => i + 1));
      }
    }
    if (form.end_surah) {
      const selectedSurah = surahs.find(s => s.id.toString() === form.end_surah);
      if (selectedSurah) {
        setEndSurahVerses(Array.from({ length: selectedSurah.count }, (_, i) => i + 1));
      }
    }
  }, [form.start_surah, form.end_surah, surahs]);

  // مقداردهی مجدد فرم هنگام تغییر grade
  useEffect(() => {
    setForm({
      hefz: grade.hefz ?? 0,
      tajvid: grade.tajvid ?? 0,
      sout: grade.sout ?? 0,
      details: grade.details ?? 0,
      start_page: grade.lesson_area?.start_page || '',
      end_page: grade.lesson_area?.end_page || '',
      start_surah: grade.lesson_area?.start_surah?.id ? grade.lesson_area.start_surah.id.toString() : '',
      start_verse: grade.lesson_area?.start_verse || '',
      end_surah: grade.lesson_area?.end_surah?.id ? grade.lesson_area.end_surah.id.toString() : '',
      end_verse: grade.lesson_area?.end_verse || '',
      start_joze: grade.lesson_area?.start_joze || '',
      end_joze: grade.lesson_area?.end_joze || '',
      number: grade.number ?? 0,
    });
  }, [grade]);

  // Check if this is a reading grade
  const isReadingGrade = Number(grade.number) > 0 && 
                       Number(grade.hefz) === 0 && 
                       Number(grade.tajvid) === 0 && 
                       Number(grade.sout) === 0 && 
                       Number(grade.details) === 0;
  
  // Check if this is a hefz grade
  const isHefzGrade = Number(grade.number) > 0 && 
                    Number(grade.hefz) === 0 && 
                    Number(grade.tajvid) === 0 && 
                    Number(grade.sout) === 0 && 
                    Number(grade.details) === 0;

  // Check if this is a provideless grade (55 hefz score)
  const isProvidelessGrade = Number(grade.hefz) === 55 && 
                           Number(grade.tajvid) === 0 && 
                           Number(grade.sout) === 0 && 
                           Number(grade.details) === 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value === '' ? 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => {
        // Prevent closing when clicking on form elements
        let targetElement = e.target as HTMLElement;
        while (targetElement && targetElement !== document.body) {
          if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'BUTTON') {
            e.preventDefault();
            return;
          }
          targetElement = targetElement.parentElement as HTMLElement;
        }
      }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {isReadingGrade ? "ویرایش نمره روخوانی" : 
             isHefzGrade ? "ویرایش نمره حفظ" : 
             isProvidelessGrade ? "ویرایش نمره عدم تحویل" : 
             "ویرایش نمره"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isReadingGrade ? "نمره روخوانی را ویرایش کنید" : 
             isHefzGrade ? "نمره حفظ را ویرایش کنید" : 
             isProvidelessGrade ? "نمره عدم تحویل را ویرایش کنید" : 
             "مقادیر را ویرایش و ذخیره کنید"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
          <div className="grid grid-cols-1 gap-4">
            {/* نمره */}
            {isReadingGrade || isHefzGrade ? (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  {isReadingGrade ? "نمره روخوانی" : "نمره حفظ"}
                </label>
                <Input 
                  name="number" 
                  type="number" 
                  min="0"
                  max="100"
                  value={form.number || ''} 
                  onChange={handleChange} 
                  placeholder={isReadingGrade ? "نمره روخوانی (0 تا 100)" : "نمره حفظ (0 تا 100)"}
                  className="text-center text-lg"
                />
              </div>
            ) : isProvidelessGrade ? (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  نمره عدم تحویل
                </label>
                <Input 
                  name="hefz" 
                  type="number" 
                  min="0"
                  max="100"
                  value={form.hefz || ''} 
                  onChange={handleChange} 
                  placeholder="نمره عدم تحویل (0 تا 100)"
                  className="text-center text-lg"
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      نمره حفظ
                    </label>
                    <Input 
                      name="hefz" 
                      type="number" 
                      min="0"
                      max="70"
                      value={form.hefz || ''} 
                      onChange={handleChange} 
                      placeholder="نمره حفظ (0 تا 70)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      نمره تجوید
                    </label>
                    <Input 
                      name="tajvid" 
                      type="number" 
                      min="0"
                      max="10"
                      value={form.tajvid || ''} 
                      onChange={handleChange} 
                      placeholder="نمره تجوید (0 تا 10)"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      نمره صوت
                    </label>
                    <Input 
                      name="sout" 
                      type="number" 
                      min="0"
                      max="10"
                      value={form.sout || ''} 
                      onChange={handleChange} 
                      placeholder="نمره صوت (0 تا 10)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      نمره مشخصات
                    </label>
                    <Input 
                      name="details" 
                      type="number" 
                      min="0"
                      max="10"
                      value={form.details || ''} 
                      onChange={handleChange} 
                      placeholder="نمره مشخصات (0 تا 10)"
                    />
                  </div>
                </div>
              </>
            )}
            {/* محدوده درسی */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">صفحه شروع</label>
                <Input name="start_page" type="number" value={form.start_page || ''} onChange={handleChange} placeholder="صفحه شروع" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">صفحه پایان</label>
                <Input name="end_page" type="number" value={form.end_page || ''} onChange={handleChange} placeholder="صفحه پایان" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">سوره شروع</label>
                {isLoadingSurahs ? (
                  <div className="h-10 w-full animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-md" />
                ) : (
                  <SingleSelectCombobox
                    options={surahs?.map(surah => ({
                      value: surah.id.toString(),
                      label: `${surah.titleAr}`
                    })) || []}
                    value={form.start_surah}
                    onChange={value => setForm(prev => ({ ...prev, start_surah: value }))}
                    placeholder="انتخاب سوره"
                    className="w-full"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">آیه شروع</label>
                <SingleSelectCombobox
                  options={startSurahVerses?.map(verse => ({
                    value: verse.toString(),
                    label: verse.toString()
                  })) || []}
                  value={form.start_verse?.toString()}
                  onChange={value => setForm(prev => ({ ...prev, start_verse: value }))}
                  placeholder="انتخاب آیه"
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">سوره پایان</label>
                {isLoadingSurahs ? (
                  <div className="h-10 w-full animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-md" />
                ) : (
                  <SingleSelectCombobox
                    options={surahs?.map(surah => ({
                      value: surah.id.toString(),
                      label: `${surah.titleAr}`
                    })) || []}
                    value={form.end_surah}
                    onChange={value => setForm(prev => ({ ...prev, end_surah: value }))}
                    placeholder="انتخاب سوره"
                    className="w-full"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">آیه پایان</label>
                <SingleSelectCombobox
                  options={endSurahVerses?.map(verse => ({
                    value: verse.toString(),
                    label: verse.toString()
                  })) || []}
                  value={form.end_verse?.toString()}
                  onChange={value => setForm(prev => ({ ...prev, end_verse: value }))}
                  placeholder="انتخاب آیه"
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">جز شروع</label>
                <Input name="start_joze" type="number" value={form.start_joze || ''} onChange={handleChange} placeholder="جز شروع" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">جز پایان</label>
                <Input name="end_joze" type="number" value={form.end_joze || ''} onChange={handleChange} placeholder="جز پایان" />
              </div>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال ذخیره...</span>
              </div>
            ) : (
              "ذخیره تغییرات"
            )}
          </Button>
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
  isLoading?: boolean;
}

function AbsentModal({ isOpen, onOpenChange, student, onSubmit, isLoading = false }: AbsentModalProps) {
  const absentReasons = [
    { value: "مرخصی", label: "مرخصی" },
    { value: "بدون هماهنگی", label: "بدون هماهنگی" },
    { value: "مریض", label: "مریض" }
  ];

  const handleReasonSelect = (reason: string) => {
    onSubmit(reason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={!isLoading ? onOpenChange : () => {}}>
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
              disabled={isLoading}
              className="w-full text-right justify-between px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              variant="outline"
            >
              {isLoading ? (
                <div className="flex items-center gap-2 w-full justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال ثبت...</span>
                </div>
              ) : (
                <>
                  <span className="text-base">{reason.label}</span>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-2 h-2 rounded-full bg-red-500"
                  />
                </>
              )}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: "default" | "destructive" | "warning";
}

function ConfirmationModal({ 
  isOpen, 
  onOpenChange, 
  title, 
  description, 
  confirmText, 
  cancelText, 
  onConfirm, 
  isLoading = false,
  variant = "default"
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return {
          button: "bg-red-600 hover:bg-red-700 text-white",
          icon: "text-red-500"
        };
      case "warning":
        return {
          button: "bg-orange-600 hover:bg-orange-700 text-white",
          icon: "text-orange-500"
        };
      default:
        return {
          button: "bg-blue-600 hover:bg-blue-700 text-white",
          icon: "text-blue-500"
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-4 py-4">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            className={`flex-1 ${styles.button}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال انجام...
              </div>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to format lesson range
const formatLessonRange = (grade: Grade): string => {
  const lessonArea = grade.lesson_area;
  
  if (!lessonArea) return "";
  
  // Page-based range
  if (lessonArea.start_page && lessonArea.end_page) {
    return `صفحات ${lessonArea.start_page} تا ${lessonArea.end_page}`;
  }
  
  // Surah and verse range
  if (lessonArea.start_surah && lessonArea.end_surah) {
    const startSurahName = lessonArea.start_surah.titleAr || lessonArea.start_surah.title;
    const endSurahName = lessonArea.end_surah.titleAr || lessonArea.end_surah.title;
    
    if (lessonArea.start_verse && lessonArea.end_verse) {
      if (lessonArea.start_surah.id === lessonArea.end_surah.id) {
        return `${startSurahName} آیات ${lessonArea.start_verse} تا ${lessonArea.end_verse}`;
      } else {
        return `${startSurahName} آیه ${lessonArea.start_verse} تا ${endSurahName} آیه ${lessonArea.end_verse}`;
      }
    } else {
      if (lessonArea.start_surah.id === lessonArea.end_surah.id) {
        return `${startSurahName}`;
      } else {
        return `${startSurahName} تا ${endSurahName}`;
      }
    }
  }
  
  // Joze (part) range
  if (lessonArea.start_joze && lessonArea.end_joze) {
    if (lessonArea.start_joze === lessonArea.end_joze) {
      return `جز ${lessonArea.start_joze}`;
    } else {
      return `جز ${lessonArea.start_joze} تا ${lessonArea.end_joze}`;
    }
  }
  
  return "";
};

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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<EditingGrade | null>(null);
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

  React.useEffect(() => {
    const fetchStudents = async () => {
      if (!accessToken || !selectedClass || !selectedDate) return;

      try {
        const jsDate = selectedDate ? selectedDate.toDate() : null;
        const jsDateStr = jsDate ? format(jsDate, "yyyy/MM/dd") : null;
        if (!jsDate) return;
        
        // Fetch students and their grades
        const response = await optimizedClassService.getStudents(
          selectedClass.id,
          jsDateStr!,
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
        console.log("JS date string (Jalali):", jsDateStr);

        response.data.forEach((student) => {
          const todayGrades = student.grades.filter(
            (grade) => {
              // اولویت با ستون date، اگر نبود از created_at استفاده کن
              const dateToUse = grade.date || grade.created_at;
              if (!dateToUse) return false;
              try {
                // Always format grade date as Gregorian yyyy-MM-dd
                const gradeDateGregorian = format(new Date(dateToUse), "yyyy-MM-dd");
                const isMatch = gradeDateGregorian === selectedDateGregorianStr;
                return isMatch;
              } catch {
                return false;
              }
            }
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
      const jsDateStr = jsDate ? format(jsDate, "yyyy/MM/dd") : null;
      if (!jsDate) return;

      const payload: PayloadType = {
        class_id: selectedClass.id,
        master_id: masterId,
        student_id: selectedStudent.id,
        droos_id: selectedCourse.id,
        hefz: 0,
        details: 0,
        tajvid: 0,
        sout: 0,
        number: 0,
        practice_count: 0,
        lesson_area_id: selectedClass.dars?.id || 0,
        user_id: userId,
        tenant_id: 0,
        date: jsDate.toISOString(), // تاریخ انتخاب شده (timestamp with time)
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
      
      const response = await optimizedClassService.getStudents(
        selectedClass.id,
        jsDateStr!,
        accessToken
      );
      
      const selectedDateStr = jsDate ? format(jsDate, "yyyy-MM-dd") : "";
      const student = response.data.find(s => s.student.id === selectedStudent.id);
      if (student) {
        const todayGrades = student.grades.filter(
          (grade) => {
            // اولویت با ستون date، اگر نبود از created_at استفاده کن
            const dateToUse = grade.date || grade.created_at;
            if (!dateToUse) return false;
            
            try {
              const gradeDate = format(new Date(dateToUse), "yyyy-MM-dd");
              return gradeDate === selectedDateStr;
            } catch (error) {
              console.error("Error parsing date:", dateToUse, error);
              return false;
            }
          }
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

  const isWithin24Hours = (date: string) => {
    const gradeDate = new Date(date);
    const twentyFourHoursAgo = subHours(new Date(), 24);
    return gradeDate > twentyFourHoursAgo;
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
        date: updateDate.toISOString(), // تاریخ انتخاب شده (timestamp with time)
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
      // Update local state
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
        lesson_area_id: number;
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
        lesson_area_id: selectedClass.dars?.id || 0,
        user_id: userId,
        tenant_id: 0,
        date: gradeDate.toISOString(),
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

  const handleRemoveAbsent = async (studentId: number, activityId: number) => {
    if (!accessToken || !selectedClass) {
      toast.error("دسترسی لازم موجود نیست");
      return;
    }

    try {
      setActionLoading(true);
      console.log("Removing absent activity:", activityId, "for student:", studentId);
      
      await studentActivityService.delete(activityId, accessToken);
      console.log("Activity deleted successfully");
      
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
      
      toast.success("غیبت با موفقیت حذف شد");
      
    } catch (error) {
      console.error("Error removing absent:", error);
      toast.error("خطا در حذف غیبت: " + (error as ValidationError)?.response?.data?.message || (error as ValidationError)?.message || "خطای نامشخص");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveProvideless = async (studentId: number, activityId: number) => {
    if (!accessToken || !selectedClass) {
      toast.error("دسترسی لازم موجود نیست");
      return;
    }

    try {
      setActionLoading(true);
      console.log("Removing provideless activity:", activityId, "for student:", studentId);
      
      // Find and delete the associated grade (55 score)
      const studentGrades = existingGrades[studentId];
      if (studentGrades) {
        // Find the provideless grade (55 hefz with 0 for others)
        const provideGrade = studentGrades.find(grade => 
          Number(grade.hefz) === 55 && 
          Number(grade.tajvid) === 0 && 
          Number(grade.sout) === 0 && 
          Number(grade.details) === 0
        );
        
        if (provideGrade) {
          console.log("Found provideless grade to delete:", provideGrade.id);
          try {
            await optimizedNumberService.delete(provideGrade.id, accessToken);
            console.log("Provideless grade deleted successfully");
          } catch (gradeError) {
            console.error("Error deleting provideless grade:", gradeError);
            // Continue with activity deletion even if grade deletion fails
          }
        }
      }
      
      // Delete the activity
      await studentActivityService.delete(activityId, accessToken);
      console.log("Activity deleted successfully");
      
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
          
          // Update existing grades
          const selectedDateStr = jsDate ? format(jsDate, "yyyy-MM-dd") : "";
          const gradesMap: Record<number, Grade[]> = {};
          
          response.data.forEach((student) => {
            const todayGrades = student.grades.filter(
              (grade) => {
                // اولویت با ستون date، اگر نبود از created_at استفاده کن
                const dateToUse = grade.date || grade.created_at;
                if (!dateToUse) return false;
                
                try {
                  const gradeDate = format(new Date(dateToUse), "yyyy-MM-dd");
                  return gradeDate === selectedDateStr;
                } catch (error) {
                  console.error("Error parsing date:", dateToUse, error);
                  return false;
                }
              }
            );
            if (todayGrades.length > 0) {
              gradesMap[student.student.id] = todayGrades;
            }
          });
          
          setExistingGrades(gradesMap);
          
        } catch (refreshError) {
          console.error("Error refreshing students:", refreshError);
        }
      }
      
      toast.success("عدم تحویل و نمره مربوطه با موفقیت حذف شد");
      
    } catch (error) {
      console.error("Error removing provideless:", error);
      toast.error("خطا در حذف عدم تحویل: " + (error as ValidationError)?.response?.data?.message || (error as ValidationError)?.message || "خطای نامشخص");
    } finally {
      setActionLoading(false);
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
                  (() => {
                    // Debug log for master data and classes
                    console.log("Master data for filtering:", masterData);
                    console.log("All classes:", classes);
                    
                    const filteredClasses = classes.filter(classItem => {
                      console.log("Checking class:", classItem.id, classItem.dars?.title);
                      console.log("Class masters:", classItem.optimized_class_masters);
                      
                      // Check multiple conditions for master matching
                      const hasMatchingMaster = classItem.optimized_class_masters?.some(master => {
                        console.log("Checking master:", master);
                        
                        // Check if master.master.id matches masterData.id
                        if (master.master?.id === masterData.id) {
                          console.log("Match found via master.master.id:", master.master.id);
                          return true;
                        }
                        
                        // Check if master.user_id matches masterData.id
                        if (master.user_id === masterData.id) {
                          console.log("Match found via master.user_id:", master.user_id);
                          return true;
                        }
                        
                        // Check if master.user_id matches masterData.user_id
                        if (master.user_id === masterData.user_id) {
                          console.log("Match found via master.user_id === masterData.user_id:", master.user_id);
                          return true;
                        }
                        
                        // Check if master.master.user_id matches user.id
                        if (master.master?.user_id === user?.id) {
                          console.log("Match found via master.master.user_id === user.id:", master.master.user_id);
                          return true;
                        }
                        
                        return false;
                      });
                      
                      console.log("Has matching master:", hasMatchingMaster);
                      return hasMatchingMaster;
                    });
                    
                    console.log("Filtered classes:", filteredClasses);
                    
                    if (filteredClasses.length === 0) {
                      return (
                        <div className="text-center text-red-500">
                          <p>هیچ کلاسی برای شما یافت نشد</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Master ID: {masterData.id}, User ID: {user?.id}
                          </p>
                        </div>
                      );
                    }
                    
                    return (
                      <SingleSelectCombobox
                        options={filteredClasses.map((classItem) => ({
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
                    );
                  })()
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
              {students.map((studentData, index) => {
                // Check if student is absent - activities are now included in student data
                const jsDate = selectedDate ? selectedDate.toDate() : null;
                const selectedDateStr = jsDate ? format(jsDate, "yyyy-MM-dd") : "";
                
                const todayActivities = studentData.activities.filter(activity => {
                  const activityDate = format(new Date(activity.created_at), "yyyy-MM-dd");
                  return activityDate === selectedDateStr;
                });
                
                const absentActivity = todayActivities.find(activity => activity.reason && activity.provideless === "0");
                const provideActivity = todayActivities.find(activity => activity.provideless === "1");
                  
                  return (
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
                      className={`flex flex-col p-3 rounded-lg border transition-all duration-300 ${
                        absentActivity 
                          ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20' 
                          : provideActivity
                          ? 'border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20'
                          : 'border-zinc-200 dark:border-zinc-800 hover:shadow-lg hover:border-emerald-500/20 dark:hover:border-emerald-500/30'
                      }`}
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
                            {absentActivity && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-1 mt-1"
                              >
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                                    غایب
                                  </span>
                                  {isWithin24Hours(absentActivity.created_at) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveAbsent(studentData.student.id, absentActivity.id)}
                                      disabled={loading || actionLoading}
                                      className="w-4 h-4 p-0 hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-colors"
                                      title="حذف غیبت"
                                    >
                                      {actionLoading ? (
                                        <Loader2 className="w-3 h-3 animate-spin text-red-600 dark:text-red-400" />
                                      ) : (
                                        <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                                {absentActivity.reason && (
                                  <span className="text-xs text-red-500 dark:text-red-400">
                                    ({absentActivity.reason})
                                  </span>
                                )}
                              </motion.div>
                            )}
                            {provideActivity && !absentActivity && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-1 mt-1"
                              >
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
                                    عدم تحویل
                                  </span>
                                  {isWithin24Hours(provideActivity.created_at) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveProvideless(studentData.student.id, provideActivity.id)}
                                      disabled={loading || actionLoading}
                                      className="w-4 h-4 p-0 hover:bg-orange-500/20 dark:hover:bg-orange-500/30 transition-colors"
                                      title="حذف عدم تحویل"
                                    >
                                      {actionLoading ? (
                                        <Loader2 className="w-3 h-3 animate-spin text-orange-600 dark:text-orange-400" />
                                      ) : (
                                        <X className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        </div>
                        {(() => {
                          const isReading = selectedClass && isReadingClass(selectedClass.dars?.title || '');
                          const canAddGrade = isReading || !existingGrades[studentData.student.id] || existingGrades[studentData.student.id].length < 10;
                          return canAddGrade && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 + 0.4 }}
                            >
                              {isWithin24Hours(new Date().toString()) ? (
                                <div className="flex flex-col items-end gap-1">
                                  <Button
                                    onClick={() => handleAddNumber(studentData.student.id)}
                                    disabled={loading || actionLoading}
                                    size="sm"
                                    className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-zinc-900 dark:hover:bg-emerald-400 transition-colors duration-200"
                                  >
                                    افزودن نمره
                                  </Button>
                                  <div className="flex gap-1">
                                    <Button
                                      onClick={() => handleProvideless(studentData.student.id)}
                                      disabled={loading || actionLoading}
                                      size="sm"
                                      className="bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:text-zinc-900 dark:hover:bg-orange-400 transition-colors duration-200 text-xs px-2"
                                    >
                                      {actionLoading && selectedStudentForAction?.id === studentData.student.id && isProvideConfirmOpen ? (
                                        <div className="flex items-center gap-1">
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                          <span>درحال...</span>
                                        </div>
                                      ) : (
                                        "عدم تحویل"
                                      )}
                                    </Button>
                                    <Button
                                      onClick={() => handleAbsent(studentData.student.id)}
                                      disabled={loading || actionLoading}
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
                          );
                        })()}
                      </div>
                      
                      {existingGrades[studentData.student.id] && (
                        <div className="grid grid-cols-1 gap-2">
                          {existingGrades[studentData.student.id].map((grade, gradeIndex) => {
                            // Check if this is a hefz grade (is_one_grade with number field)
                            const isHefzGradeForScore = Number(grade.number) > 0 && 
                                                      Number(grade.hefz) === 0 && 
                                                      Number(grade.tajvid) === 0 && 
                                                      Number(grade.sout) === 0 && 
                                                      Number(grade.details) === 0 &&
                                                      selectedClass?.dars?.title?.toLowerCase().includes('حفظ');
                            
                            // Calculate total score based on grade type
                            let totalScore: number;
                            let isNegative: boolean;
                            
                            if (isHefzGradeForScore) {
                              totalScore = Number(grade.number);
                              isNegative = totalScore < 80;
                            } else {
                              totalScore = Number(grade.hefz) + Number(grade.tajvid) + Number(grade.sout) + Number(grade.details);
                              isNegative = totalScore < 80;
                            }
                            
                            // Check if this is a hefz grade for display purposes
                            const isHefzGrade = Number(grade.number) > 0 && 
                                              Number(grade.hefz) === 0 && 
                                              Number(grade.tajvid) === 0 && 
                                              Number(grade.sout) === 0 && 
                                              Number(grade.details) === 0 &&
                                              selectedClass?.dars?.title?.toLowerCase().includes('حفظ');
                            
                            // Check if this is a provideless grade (55 hefz score with 0 for others)
                            const isProvidelessGrade = Number(grade.hefz) === 55 && 
                                                     Number(grade.tajvid) === 0 && 
                                                     Number(grade.sout) === 0 && 
                                                     Number(grade.details) === 0;
                            
                            // Check if this is a reading grade (only number has value, others are 0)
                            const isReadingGrade = Number(grade.number) > 0 && 
                                                 Number(grade.hefz) === 0 && 
                                                 Number(grade.tajvid) === 0 && 
                                                 Number(grade.sout) === 0 && 
                                                 Number(grade.details) === 0;
                            
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
                                } ${isProvidelessGrade ? 'border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20' : ''} ${
                                  isReadingGrade ? 'border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20' : ''
                                } ${isHefzGrade ? 'border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20' : ''}`}
                              >
                                {isProvidelessGrade ? (
                                  // Special display for provideless grade (55)
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <motion.span 
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full"
                                      >
                                        حفظ
                                      </motion.span>
                                      <div className="flex items-center gap-2">
                                        <motion.span 
                                          initial={{ opacity: 0, scale: 0.8 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          className="text-lg font-bold text-red-600 dark:text-red-400"
                                        >
                                          55
                                        </motion.span>
                                        {isGradeWithin24Hours(grade) && (
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
                                    {formatLessonRange(grade) && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xs text-zinc-600 dark:text-zinc-400 text-center"
                                      >
                                        {formatLessonRange(grade)}
                                      </motion.div>
                                    )}
                                  </div>
                                ) : isReadingGrade ? (
                                  // Special display for reading grade
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <motion.span 
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full"
                                      >
                                        روخوانی
                                      </motion.span>
                                      <div className="flex items-center gap-2">
                                        <motion.span 
                                          initial={{ opacity: 0, scale: 0.8 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          className={`text-lg font-bold ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}
                                        >
                                          {grade.number}
                                        </motion.span>
                                        {isNegative && (
                                          <motion.span 
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full"
                                          >
                                            منفی
                                          </motion.span>
                                        )}
                                        {isGradeWithin24Hours(grade) && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditGrade(studentData.student.id, grade)}
                                            className="h-6 px-1 hover:bg-blue-500/10 dark:hover:bg-blue-500/20"
                                          >
                                            <Edit2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                    {formatLessonRange(grade) && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xs text-zinc-600 dark:text-zinc-400 text-center"
                                      >
                                        {formatLessonRange(grade)}
                                      </motion.div>
                                    )}
                                  </div>
                                ) : isHefzGrade ? (
                                  // Special display for hefz grade
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <motion.span 
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full"
                                      >
                                        حفظ
                                      </motion.span>
                                      <div className="flex items-center gap-2">
                                        <motion.span 
                                          initial={{ opacity: 0, scale: 0.8 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          className={`text-lg font-bold ${Number(grade.number) < 80 ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}`}
                                        >
                                          {grade.number}
                                        </motion.span>
                                        {Number(grade.number) < 80 && (
                                          <motion.span 
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full"
                                          >
                                            منفی
                                          </motion.span>
                                        )}
                                        {isGradeWithin24Hours(grade) && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditGrade(studentData.student.id, grade)}
                                            className="h-6 px-1 hover:bg-purple-500/10 dark:hover:bg-purple-500/20"
                                          >
                                            <Edit2 className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                    {formatLessonRange(grade) && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xs text-zinc-600 dark:text-zinc-400 text-center"
                                      >
                                        {formatLessonRange(grade)}
                                      </motion.div>
                                    )}
                                  </div>
                                ) : (
                                  // Normal grade display
                                  <div className="space-y-1">
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
                                        {isGradeWithin24Hours(grade) && (
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
                                    {formatLessonRange(grade) && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xs text-zinc-600 dark:text-zinc-400 text-center"
                                      >
                                        {formatLessonRange(grade)}
                                      </motion.div>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
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
    </PageTransition>
  );
}
