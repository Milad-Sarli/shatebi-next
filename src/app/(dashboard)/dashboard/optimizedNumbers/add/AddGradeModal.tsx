import * as React from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SingleSelectCombobox } from "@/components/ui/Combobox";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Surah, SurahService } from "@/lib/services/surah.service";
import { useAuth } from "@/lib/context/auth.context";

// --- Types and Schemas ---

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

const oneGradeSurahSchema = z.object({
  start_surah: z.string().min(1, "سوره شروع الزامی است"),
  start_verse: z.string().min(1, "آیه شروع الزامی است"),
  end_surah: z.string().min(1, "سوره پایان الزامی است"),
  end_verse: z.string().min(1, "آیه پایان الزامی است"),
  number: z.string()
    .min(1, "نمره الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 55 && Number(val) <= 100, {
      message: "نمره باید بین 55 تا 100 باشد"
    }),
});

const oneGradePageSchema = z.object({
  start_page: z.string().min(1, "صفحه شروع الزامی است"),
  end_page: z.string().min(1, "صفحه پایان الزامی است"),
  number: z.string()
    .min(1, "نمره الزامی است")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 55 && Number(val) <= 100, {
      message: "نمره باید بین 55 تا 100 باشد"
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
  onFormRefsChange?: (refs: FormRefs) => void;
  isLoading?: boolean;
  isOneGrade?: boolean;  
  selectedCourse?: Course | null; // اضافه کردن prop جدید
}

import { Course } from "@/lib/types/course";

function AddGradeModal({ student, onSubmit, isOpen, onOpenChange, onFormRefsChange, isLoading = false, isOneGrade = false, selectedCourse }: AddGradeModalProps) {
  const [activeTab, setActiveTab] = React.useState("page");
  const [surahs, setSurahs] = React.useState<Surah[]>([]);
  const [startSurahVerses, setStartSurahVerses] = React.useState<number[]>([]);
  const [endSurahVerses, setEndSurahVerses] = React.useState<number[]>([]);
  const { accessToken } = useAuth();
  
  // تشخیص نوع درس
  const isNewHefzClass = selectedCourse?.title?.toLowerCase().includes('حفظ جدید') || 
                        selectedCourse?.title?.toLowerCase().includes('hefz jadid') || false;
  
  // تنظیم تب پیش‌فرض بر اساس نوع درس
  React.useEffect(() => {
    if (isNewHefzClass) {
      setActiveTab("surah");
    } else {
      setActiveTab("page");
    }
  }, [isNewHefzClass, isOpen]);

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
        // setIsLoadingSurahs(true); // Remove if not used
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
        // setIsLoadingSurahs(false); // Remove if not used
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
    // Remove lesson_area_id and filter out empty values
    const filteredData = Object.entries(data)
      .filter(([key, value]) =>
        key !== "lesson_area_id" &&
        value !== "" &&
        value !== null &&
        value !== undefined
      )
      .reduce((acc, [key, value]) => {
        // Convert string numbers to numbers
        if (
          typeof value === "string" &&
          value.trim() !== "" &&
          !isNaN(Number(value))
        ) {
          acc[key] = Number(value);
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>);

    onSubmit({ ...filteredData, type: activeTab });

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

  const hasTestInTitle = selectedCourse?.title?.includes("تست");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <div dir="rtl" className="text-right space-y-4">
          {/* Container for right-to-left content */}
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-right">افزودن نمره برای {student.name}</DialogTitle>
            {selectedCourse && (
              <div className="flex justify-center mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700">
                  درس انتخاب شده: {selectedCourse.title}
                </span>
              </div>
            )}
            <DialogDescription className="text-right">
              لطفاً اطلاعات مربوط به نمره را وارد کنید.
            </DialogDescription>
          </DialogHeader>
          
          {isOneGrade ? ( 
            // Single Grade Forms
            <div className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {isNewHefzClass ? (
                  // برای حفظ جدید فقط تب سوره نمایش داده می‌شود
                  <TabsList className="grid w-full grid-cols-1 mb-6">
                    <TabsTrigger value="surah" className="text-sm">سوره</TabsTrigger>
                  </TabsList>
                ) : (
                  // برای سایر دروس هر دو تب نمایش داده می‌شود
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="page" className="text-sm">صفحه</TabsTrigger>
                    <TabsTrigger value="surah" className="text-sm">سوره</TabsTrigger>
                  </TabsList>
                )}

                {!isNewHefzClass && (
                  <TabsContent value="page" className="space-y-6">
                    {/* محتوای فرم صفحه */}
                    <Form {...oneGradePageForm}>
                      <form onSubmit={oneGradePageForm.handleSubmit(handleSubmit)} className="space-y-6">
                        {/* محدوده درسی */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b pb-2 text-right">
                            محدوده درسی
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={oneGradePageForm.control}
                              name="start_page"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-right block">صفحه شروع</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" placeholder="صفحه شروع" className="text-center" />
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
                                  <FormLabel className="text-sm font-medium text-right block">صفحه پایان</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" placeholder="صفحه پایان" className="text-center" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* نمره */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b pb-2 text-right">
                            نمره
                          </h3>
                          <div className="grid grid-cols-1 gap-4">
                            <FormField
                              control={oneGradePageForm.control}
                              name="number"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-right block">نمره (55-100)</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" min="0" max="100" placeholder="نمره" className="text-center text-lg" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              در حال ارسال...
                            </>
                          ) : (
                            "ثبت نمره"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                )}

                <TabsContent value="surah" className="space-y-6">
                  {/* محتوای فرم سوره */}
                  <Form {...oneGradeSurahForm}>
                    <form onSubmit={oneGradeSurahForm.handleSubmit(handleSubmit)} className="space-y-6">
                      {/* محدوده درسی */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b pb-2 text-right">
                          محدوده درسی (سوره)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={oneGradeSurahForm.control}
                            name="start_surah"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-right block">سوره شروع</FormLabel>
                                <FormControl>
                                  <SingleSelectCombobox
                                    options={surahs.map(surah => ({ value: surah.id.toString(), label: surah.titleAr }))}
                                    onChange={value => { field.onChange(value); handleStartSurahChange(value); }}
                                    value={field.value}
                                    placeholder="انتخاب سوره"
                                  />
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
                                <FormLabel className="text-sm font-medium text-right block">آیه شروع</FormLabel>
                                <FormControl>
                                  <SingleSelectCombobox
                                    options={startSurahVerses.map(verse => ({ value: verse.toString(), label: verse.toString() }))}
                                    onChange={field.onChange}
                                    value={field.value}
                                    placeholder="انتخاب آیه"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={oneGradeSurahForm.control}
                            name="end_surah"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-right block">سوره پایان</FormLabel>
                                <FormControl>
                                  <SingleSelectCombobox
                                    options={surahs.map(surah => ({ value: surah.id.toString(), label: surah.titleAr }))}
                                    onChange={value => { field.onChange(value); handleEndSurahChange(value); }}
                                    value={field.value}
                                    placeholder="انتخاب سوره"
                                  />
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
                                <FormLabel className="text-sm font-medium text-right block">آیه پایان</FormLabel>
                                <FormControl>
                                  <SingleSelectCombobox
                                    options={endSurahVerses.map(verse => ({ value: verse.toString(), label: verse.toString() }))}
                                    onChange={field.onChange}
                                    value={field.value}
                                    placeholder="انتخاب آیه"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* نمره */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b pb-2 text-right">
                          نمره
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={oneGradeSurahForm.control}
                            name="number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-right block">نمره (55-100)</FormLabel>
                                <FormControl>
                                  <Input {...field} type="number" min="0" max="100" placeholder="نمره" className="text-center text-lg" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            در حال ارسال...
                          </>
                        ) : (
                          "ثبت نمره"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </div>
            ) : ( 
            // Multi Grade Forms
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {isNewHefzClass ? (
                // برای حفظ جدید فقط تب سوره نمایش داده می‌شود
                <TabsList className="grid w-full grid-cols-1 mb-6">
                  <TabsTrigger value="surah" className="text-sm">سوره</TabsTrigger>
                </TabsList>
              ) : (
                // برای سایر دروس همه تب‌ها نمایش داده می‌شود
                <TabsList className={`grid w-full mb-6 ${hasTestInTitle ? "grid-cols-3" : "grid-cols-2"}`}>
                  <TabsTrigger value="page" className="text-sm">صفحه</TabsTrigger>
                  <TabsTrigger value="surah" className="text-sm">سوره</TabsTrigger>
                  {hasTestInTitle && (
                    <TabsTrigger value="part" className="text-sm">جز</TabsTrigger>
                  )}
                </TabsList>
              )}

              {!isNewHefzClass && (
                <TabsContent value="page" className="space-y-6">
              <Form {...multiGradeForm}>
                <form onSubmit={multiGradeForm.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* محدوده درسی */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b pb-2 text-right">
                      محدوده درسی
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                      <FormField
                        control={multiGradeForm.control}
                        name="start_page"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-right block">صفحه شروع</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="صفحه شروع" className="text-center" />
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
                            <FormLabel className="text-sm font-medium text-right block">صفحه پایان</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="صفحه پایان" className="text-center" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* نمرات */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b pb-2 text-right">
                      نمرات
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={multiGradeForm.control}
                        name="hefz"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-right block">نمره حفظ (0-70)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" max="70" placeholder="نمره حفظ" className="text-center text-lg" />
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
                            <FormLabel className="text-sm font-medium text-right block">نمره تجوید (0-10)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" max="10" placeholder="نمره تجوید" className="text-center text-lg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={multiGradeForm.control}
                        name="sout"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-right block">نمره صوت (0-10)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" max="10" placeholder="نمره صوت" className="text-center text-lg" />
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
                            <FormLabel className="text-sm font-medium text-right block">نمره مشخصات (0-10)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" max="10" placeholder="نمره مشخصات" className="text-center text-lg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        در حال ارسال...
                      </>
                    ) : (
                      "ثبت نمره"
                    )}
                  </Button>
                </form>
              </Form>
                </TabsContent>
              )}

            <TabsContent value="surah" className="space-y-6">
              <Form {...surahForm}>
                <form onSubmit={surahForm.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* محدوده درسی */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b pb-2 text-right">
                      محدوده درسی (سوره)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={surahForm.control}
                        name="start_surah"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-right block">سوره شروع</FormLabel>
                            <FormControl>
                              <SingleSelectCombobox
                                options={surahs.map(surah => ({ value: surah.id.toString(), label: surah.titleAr }))}
                                onChange={value => { field.onChange(value); handleStartSurahChange(value); }}
                                value={field.value}
                                placeholder="انتخاب سوره"
                              />
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
                            <FormLabel className="text-sm font-medium text-right block">آیه شروع</FormLabel>
                            <FormControl>
                              <SingleSelectCombobox
                                options={startSurahVerses.map(verse => ({ value: verse.toString(), label: verse.toString() }))}
                                onChange={field.onChange}
                                value={field.value}
                                placeholder="انتخاب آیه"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                   <FormField
                        control={surahForm.control}
                        name="end_surah"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-right block">سوره پایان</FormLabel>
                            <FormControl>
                              <SingleSelectCombobox
                                options={surahs.map(surah => ({ value: surah.id.toString(), label: surah.titleAr }))}
                                onChange={value => { field.onChange(value); handleEndSurahChange(value); }}
                                value={field.value}
                                placeholder="انتخاب سوره"
                              />
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
                            <FormLabel className="text-sm font-medium text-right block">آیه پایان</FormLabel>
                            <FormControl>
                              <SingleSelectCombobox
                                options={endSurahVerses.map(verse => ({ value: verse.toString(), label: verse.toString() }))}
                                onChange={field.onChange}
                                value={field.value}
                                placeholder="انتخاب آیه"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                     
                    </div>
                  </div>

                  {/* نمرات */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b pb-2 text-right">
                      نمرات
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={surahForm.control}
                        name="hefz"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-right block">نمره حفظ (0-70)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" max="70" placeholder="نمره حفظ" className="text-center text-lg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={surahForm.control}
                        name="sout"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-right block">نمره صوت (0-10)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" max="10" placeholder="نمره صوت" className="text-center text-lg" />
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
                            <FormLabel className="text-sm font-medium text-right block">نمره تجوید (0-10)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" max="10" placeholder="نمره تجوید" className="text-center text-lg" />
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
                            <FormLabel className="text-sm font-medium text-right block">نمره مشخصات (0-10)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" max="10" placeholder="نمره مشخصات" className="text-center text-lg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        در حال ارسال...
                      </>
                    ) : (
                      "ثبت نمره"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {!isNewHefzClass && (
              <TabsContent value="part" className="space-y-6">
              <Form {...partForm}>
                <form onSubmit={partForm.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* محدوده درسی */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b pb-2 text-right">
                      محدوده درسی (جز)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                      <FormField
                        control={partForm.control}
                        name="start_joze"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-right block">جز شروع</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" max="30" placeholder="جز شروع" className="text-center" />
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
                            <FormLabel className="text-sm font-medium text-right block">جز پایان</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" max="30" placeholder="جز پایان" className="text-center" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* نمرات */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b pb-2 text-right">
                      نمرات
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={partForm.control}
                        name="hefz"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-right block">نمره حفظ (0-70)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" max="70" placeholder="نمره حفظ" className="text-center text-lg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={partForm.control}
                        name="sout"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-right block">نمره صوت (0-10)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" max="10" placeholder="نمره صوت" className="text-center text-lg" />
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
                            <FormLabel className="text-sm font-medium text-right block">نمره تجوید (0-10)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" max="10" placeholder="نمره تجوید" className="text-center text-lg" />
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
                            <FormLabel className="text-sm font-medium text-right block">نمره مشخصات (0-10)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" max="10" placeholder="نمره مشخصات" className="text-center text-lg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        در حال ارسال...
                      </>
                    ) : (
                      "ثبت نمره"
                    )}
                  </Button>
                </form>
              </Form>
              </TabsContent>
            )}
          </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddGradeModal;