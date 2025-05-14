"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LessonService, Lesson } from "@/lib/services/lesson.service";
import { useAuth } from "@/lib/context/auth.context";

const lessonSchema = z.object({
  title: z.string().min(1, "عنوان درس الزامی است"),
  description: z.string().optional(),
  parent_id: z.number().nullable().optional(),
  tenant_id: z.number().optional(),
  pages: z.number().nullable().optional(),
  start_page: z.number().nullable().optional(),
  is_one_grade: z.boolean().optional(),
});

type LessonFormData = z.infer<typeof lessonSchema>;

interface LessonFormProps {
  lesson?: Lesson;
  parentId?: number | null;
  onSuccess?: () => void;
}

export function LessonForm({ lesson, parentId, onSuccess }: LessonFormProps) {
  const { accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: lesson?.title || "",
      description: lesson?.description || "",
      parent_id: lesson?.parent_id ?? parentId ?? null,
      tenant_id: lesson?.tenant_id,
      pages: lesson?.pages ?? null,
      start_page: lesson?.start_page ?? null,
      is_one_grade: lesson?.is_one_grade ?? false,
    },
  });

  const onSubmit = async (data: LessonFormData) => {
    if (!accessToken) return;
    
    try {
      setIsLoading(true);
      if (lesson) {
        await LessonService.updateLesson(lesson.id, data, accessToken);
        toast.success("درس با موفقیت بروزرسانی شد");
      } else {
        const createData = { ...data, tenant_id: 1 };
        await LessonService.createLesson(createData, accessToken);
        toast.success("درس با موفقیت ایجاد شد");
      }
      onSuccess?.();
    } catch (error) {
      toast.error("خطا در ذخیره درس");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title" className="mb-1">عنوان درس</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="عنوان درس را وارد کنید"
          className="border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

     

      <div>
        <Label htmlFor="pages" className="mb-1">تعداد صفحات </Label>
        <Input
          id="pages"
          type="number"
          {...register("pages", { valueAsNumber: true })}
          placeholder="تعداد صفحات را وارد کنید"
          className="border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
        />
        {errors.pages && (
          <p className="text-sm text-red-500">{errors.pages.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="start_page" className="mb-1">صفحه شروع </Label>
        <Input
          id="start_page"
          type="number"
          {...register("start_page", { valueAsNumber: true })}
          placeholder="صفحه شروع را وارد کنید"
          className="border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
        />
        {errors.start_page && (
          <p className="text-sm text-red-500">{errors.start_page.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <Input
          type="checkbox"
          id="is_one_grade"
          {...register("is_one_grade")}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <Label htmlFor="is_one_grade" className="text-sm font-medium mx-2 text-gray-700 dark:text-gray-300">
          آیا این درس تک نمره ای است؟ 
        </Label>
        {errors.is_one_grade && (
          <p className="text-sm text-red-500">{errors.is_one_grade.message}</p>
        )}
      </div>

      <Button 
        type="submit" 
        disabled={isLoading}
        className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isLoading ? "در حال ذخیره..." : lesson ? "بروزرسانی درس" : "ایجاد درس"}
      </Button>
    </form>
  );
} 