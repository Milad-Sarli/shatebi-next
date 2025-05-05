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
  master_teacher_id: z.string().min(1, "لطفا استاد را انتخاب کنید"),
  hefz: z.string().min(1, "لطفا نمره حفظ را وارد کنید"),
  details: z.string().min(1, "لطفا نمره جزئیات را وارد کنید"),
  tajvid: z.string().min(1, "لطفا نمره تجوید را وارد کنید"),
  sout: z.string().min(1, "لطفا نمره صوت را وارد کنید"),
  number: z.string().min(1, "لطفا نمره کل را وارد کنید"),
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      student_id: initialData?.student_id?.toString() || "",
      master_teacher_id: initialData?.masterTeacher.id?.toString() || "",
      hefz: initialData?.hefz?.toString() || "",
      details: initialData?.details?.toString() || "",
      tajvid: initialData?.tajvid?.toString() || "",
      sout: initialData?.sout?.toString() || "",
      number: initialData?.number?.toString() || "",
    },
  });

  React.useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;

      try {
        // Fetch students and teachers here
        // This is a placeholder - you'll need to implement the actual API calls
        setStudents([]);
        setTeachers([]);
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

      if (numberId) {
        await optimizedNumberService.update(
          numberId,
          {
            student_id: parseInt(values.student_id),
            master_id: parseInt(values.master_teacher_id),
            hefz: parseFloat(values.hefz),
            details: parseFloat(values.details),
            tajvid: parseFloat(values.tajvid),
            sout: parseFloat(values.sout),
            number: parseFloat(values.number),
          },
          accessToken
        );
        toast.success("Number updated successfully");
      } else {
        await optimizedNumberService.create(
          {
            master_id: parseInt(values.master_teacher_id),
            student_id: parseInt(values.student_id),
            hefz: parseFloat(values.hefz),
            details: parseFloat(values.details),
            tajvid: parseFloat(values.tajvid),
            sout: parseFloat(values.sout),
            number: parseFloat(values.number),
            class_id: 0, // Required by CreateOptimizedNumberDto
            droos_id: 0, // Required by CreateOptimizedNumberDto
            practice_count: 0, // Required by CreateOptimizedNumberDto
            lesson_area_id: 0, // Required by CreateOptimizedNumberDto
            tenant_id: 0, // Required by CreateOptimizedNumberDto
            user_id: 0, // Required by CreateOptimizedNumberDto
          },
          accessToken
        );
        toast.success("Number created successfully");
      }

      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("Error saving number");
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
          name="master_teacher_id"
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
