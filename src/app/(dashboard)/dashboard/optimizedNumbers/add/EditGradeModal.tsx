import * as React from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { SingleSelectCombobox } from "@/components/ui/Combobox";
import { Surah, SurahService } from "@/lib/services/surah.service";
import { useAuth } from "@/lib/context/auth.context";
import { Grade } from "@/lib/services/optimizedClass.service";

interface EditGradeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  grade: Grade & { studentId: number };
  onSubmit: (form: Record<string, string | number>) => void;
  isLoading?: boolean;
}

const EditGradeModal: React.FC<EditGradeModalProps> = ({ 
  isOpen, 
  onOpenChange, 
  grade, 
  onSubmit, 
  isLoading = false 
}) => {
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

  const [surahs, setSurahs] = React.useState<Surah[]>([]);
  const [startSurahVerses, setStartSurahVerses] = React.useState<number[]>([]);
  const [endSurahVerses, setEndSurahVerses] = React.useState<number[]>([]);
  const [isLoadingSurahs, setIsLoadingSurahs] = React.useState(true);
  const { accessToken } = useAuth();

  React.useEffect(() => {
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

  React.useEffect(() => {
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

  React.useEffect(() => {
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

  const isReadingGrade = Number(grade.number) > 0 && 
    Number(grade.hefz) === 0 && 
    Number(grade.tajvid) === 0 && 
    Number(grade.sout) === 0 && 
    Number(grade.details) === 0;
  const isHefzGrade = Number(grade.number) > 0 && 
    Number(grade.hefz) === 0 && 
    Number(grade.tajvid) === 0 && 
    Number(grade.sout) === 0 && 
    Number(grade.details) === 0;
  const isProvidelessGrade = Number(grade.hefz) === 55 && 
    Number(grade.tajvid) === 0 && 
    Number(grade.sout) === 0 && 
    Number(grade.details) === 0;
  
  // Check if this is a single-grade lesson
  const isSingleGradeLesson = grade.dars?.is_one_grade === "1" || grade.droos_id?.is_one_grade === "1" || 
                            (Number(grade.number) > 0 && Number(grade.hefz) === 0 && Number(grade.tajvid) === 0 && Number(grade.sout) === 0 && Number(grade.details) === 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value === '' ? 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(form);
  };

  const getModalTitle = () => {
    if (isReadingGrade) return "ویرایش نمره روخوانی";
    if (isHefzGrade) return "ویرایش نمره حفظ";
    if (isProvidelessGrade) return "ویرایش نمره عدم تحویل";
    if (isSingleGradeLesson) return "ویرایش نمره تک نمره‌ای";
    return "ویرایش نمره";
  };

  const getModalDescription = () => {
    if (isReadingGrade) return "نمره روخوانی را ویرایش کنید";
    if (isHefzGrade) return "نمره حفظ را ویرایش کنید";
    if (isProvidelessGrade) return "نمره عدم تحویل را ویرایش کنید";
    if (isSingleGradeLesson) return "نمره تک نمره‌ای را ویرایش کنید";
    return "مقادیر را ویرایش و ذخیره کنید";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <div dir="rtl" className="text-right space-y-4">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold">
              {getModalTitle()}
            </DialogTitle>
            <DialogDescription>
              {getModalDescription()}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* نمرات اصلی */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b pb-2 text-right">
                نمرات
              </h3>
              
              {isReadingGrade || isHefzGrade || isSingleGradeLesson ? (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 text-right">
                      {isReadingGrade ? "نمره روخوانی (0-100)" : isHefzGrade ? "نمره حفظ (0-100)" : "نمره (0-100)"}
                    </label>
                    <Input 
                      name="number" 
                      type="number" 
                      min="0"
                      max="100"
                      value={form.number || ''} 
                      onChange={handleChange} 
                      placeholder={isReadingGrade ? "نمره روخوانی" : isHefzGrade ? "نمره حفظ" : "نمره"}
                      className="text-center text-lg h-12"
                    />
                  </div>
                </div>
              ) : isProvidelessGrade ? (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 text-right">
                      نمره عدم تحویل (0-100)
                    </label>
                    <Input 
                      name="hefz" 
                      type="number" 
                      min="0"
                      max="100"
                      value={form.hefz || ''} 
                      onChange={handleChange} 
                      placeholder="نمره عدم تحویل"
                      className="text-center text-lg h-12"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 text-right">
                      نمره مشخصات (0-10)
                    </label>
                    <Input 
                      name="details" 
                      type="number" 
                      min="0"
                      max="10"
                      value={form.details || ''} 
                      onChange={handleChange} 
                      placeholder="نمره مشخصات"
                      className="text-center text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 text-right">
                      نمره صوت (0-10)
                    </label>
                    <Input 
                      name="sout" 
                      type="number" 
                      min="0"
                      max="10"
                      value={form.sout || ''} 
                      onChange={handleChange} 
                      placeholder="نمره صوت"
                      className="text-center text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 text-right">
                      نمره تجوید (0-10)
                    </label>
                    <Input 
                      name="tajvid" 
                      type="number" 
                      min="0"
                      max="10"
                      value={form.tajvid || ''} 
                      onChange={handleChange} 
                      placeholder="نمره تجوید"
                      className="text-center text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 text-right">
                      نمره حفظ (0-70)
                    </label>
                    <Input 
                      name="hefz" 
                      type="number" 
                      min="0"
                      max="70"
                      value={form.hefz || ''} 
                      onChange={handleChange} 
                      placeholder="نمره حفظ"
                      className="text-center text-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* محدوده درسی */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 border-b pb-2 text-right">
                محدوده درسی
              </h3>
              
              {/* صفحات */}
              <div>
                <h4 className="text-md font-medium text-zinc-800 dark:text-zinc-200 mb-3 text-right">
                  محدوده صفحه
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 text-right">
                      صفحه پایان
                    </label>
                    <Input 
                      name="end_page" 
                      type="number" 
                      value={form.end_page || ''} 
                      onChange={handleChange} 
                      placeholder="صفحه پایان"
                      className="text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 text-right">
                      صفحه شروع
                    </label>
                    <Input 
                      name="start_page" 
                      type="number" 
                      value={form.start_page || ''} 
                      onChange={handleChange} 
                      placeholder="صفحه شروع"
                      className="text-center"
                    />
                  </div>
                </div>
              </div>

              {/* سوره و آیات */}
              <div>
                <h4 className="text-md font-medium text-zinc-800 dark:text-zinc-200 mb-3 text-right">
                  محدوده سوره
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 text-right">
                      آیه شروع
                    </label>
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
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 text-right">
                      سوره شروع
                    </label>
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
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 text-right">
                      آیه پایان
                    </label>
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
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 text-right">
                      سوره پایان
                    </label>
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
                </div>
              </div>

              {/* اجزاء */}
              <div>
                <h4 className="text-md font-medium text-zinc-800 dark:text-zinc-200 mb-3 text-right">
                  محدوده جز
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 text-right">
                      جز پایان
                    </label>
                    <Input 
                      name="end_joze" 
                      type="number" 
                      min="1" 
                      max="30"
                      value={form.end_joze || ''} 
                      onChange={handleChange} 
                      placeholder="جز پایان"
                      className="text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 text-right">
                      جز شروع
                    </label>
                    <Input 
                      name="start_joze" 
                      type="number" 
                      min="1" 
                      max="30"
                      value={form.start_joze || ''} 
                      onChange={handleChange} 
                      placeholder="جز شروع"
                      className="text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>در حال ذخیره...</span>
                </div>
              ) : (
                "ذخیره تغییرات"
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditGradeModal;