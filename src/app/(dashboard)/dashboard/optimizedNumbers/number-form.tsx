"use client";

/* eslint-disable */
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/context/auth.context";
import { toast } from "sonner";
import {
  optimizedNumberService,
  OptimizedNumber,
} from "@/lib/services/number.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  student_id: z.string().min(1, "لطفا دانش‌آموز را انتخاب کنید"),
  master_id: z.string().min(1, "لطفا استاد را انتخاب کنید"),
  hefz: z.string().min(1, "لطفا نمره حفظ را وارد کنید"),
  details: z.string().min(1, "لطفا نمره جزئیات را وارد کنید"),
  tajvid: z.string().min(1, "لطفا نمره تجوید را وارد کنید"),
  sout: z.string().min(1, "لطفا نمره صوت را وارد کنید"),
  number: z.string().min(1, "لطفا نمره کل را وارد کنید"),
  practice_count: z.string().min(1, "لطفا تعداد تمرین را وارد کنید"),
  lesson_area_id: z.string().min(1, "لطفا حوزه درس را انتخاب کنید"),
});

interface NumberFormProps {
  initialData?: OptimizedNumber;
  numberId?: number;
  onSuccess?: () => void;
}

export function NumberForm({
  initialData,
  numberId,
  onSuccess,
}: NumberFormProps) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [students, setStudents] = React.useState([]);
  const [teachers, setTeachers] = React.useState([]);
  const [lessonAreas, setLessonAreas] = React.useState([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      student_id: initialData?.student_id?.toString() || "",
      master_id: initialData?.masterTeacher?.id?.toString() || "",
      hefz: initialData?.hefz?.toString() || "",
      details: initialData?.details?.toString() || "",
      tajvid: initialData?.tajvid?.toString() || "",
      sout: initialData?.sout?.toString() || "",
      number: initialData?.number?.toString() || "",
      practice_count: initialData?.practice_count?.toString() || "",
      lesson_area_id: initialData?.lesson_area_id?.toString() || "",
    },
  });

  React.useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;

      try {
        // Fetch teachers
        const teachersResponse = await fetch('/api/teachers', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        const teachersData = await teachersResponse.json();
        setTeachers(teachersData);

        // Fetch lesson areas
        const lessonAreasResponse = await fetch('/api/lesson-areas', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        const lessonAreasData = await lessonAreasResponse.json();
        setLessonAreas(lessonAreasData);

        // Fetch students
        const studentsResponse = await fetch('/api/students', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);
      } catch (error) {
        console.error(error);
        toast.error("Error loading data");
      }
    };

    fetchData();
  }, [accessToken]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!accessToken) return;

    try {
      setLoading(true);

      const formData = {
        student_id: parseInt(values.student_id),
        master_id: parseInt(values.master_id),
        hefz: parseFloat(values.hefz),
        details: parseFloat(values.details),
        tajvid: parseFloat(values.tajvid),
        sout: parseFloat(values.sout),
        number: parseFloat(values.number),
        practice_count: parseInt(values.practice_count),
        lesson_area_id: parseInt(values.lesson_area_id),
        class_id: 0,
        droos_id: 0,
      };

      if (numberId) {
        await optimizedNumberService.update(numberId, formData, accessToken);
        toast.success("نمره با موفقیت بروزرسانی شد");
      } else {
        await optimizedNumberService.create(formData, accessToken);
        toast.success("نمره با موفقیت ثبت شد");
      }

      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("خطا در ذخیره نمره");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="student_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>دانش‌آموز</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب دانش‌آموز" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {students?.map((student: { id: number; Fname: string; Lname: string }) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.Fname} {student.Lname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="master_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>استاد</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب استاد" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {teachers.map((teacher: { id: number; fullname: string }) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hefz"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نمره حفظ</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نمره جزئیات</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tajvid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نمره تجوید</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نمره صوت</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نمره کل</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="practice_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تعداد تمرین</FormLabel>
              <FormControl>
                <Input type="number" step="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lesson_area_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>حوزه درس</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب حوزه درس" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {lessonAreas.map((area: { id: number; name: string }) => (
                    <SelectItem key={area.id} value={area.id.toString()}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={loading}
            className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
