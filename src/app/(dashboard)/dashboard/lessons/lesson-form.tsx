"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LessonService, Lesson } from "@/lib/services/lesson.service";
import { useAuth } from "@/lib/context/auth.context";

const lessonSchema = z.object({
  title: z.string().min(1, "عنوان درس الزامی است"),
  description: z.string().optional(),
  parent_id: z.number().nullable().optional(),
  tenant_id: z.number().optional(),
});

type LessonFormData = z.infer<typeof lessonSchema>;

interface LessonFormProps {
  lesson?: Lesson;
  parentId?: number | null;
  tenantId?: number;
  onSuccess?: () => void;
}

export function LessonForm({ lesson, parentId, tenantId, onSuccess }: LessonFormProps) {
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
      parent_id: lesson?.parent_id !== undefined ? lesson.parent_id : parentId || null,
      tenant_id: lesson?.tenant_id || tenantId,
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
        await LessonService.createLesson(data, accessToken);
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
        <Label htmlFor="title">عنوان درس</Label>
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
        <Label htmlFor="description">توضیحات</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="توضیحات درس را وارد کنید"
          rows={4}
          className="border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
        />
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