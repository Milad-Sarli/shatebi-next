"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/context/auth.context";
import { Student, StudentService } from "@/lib/services/student.service";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const studentSchema = z.object({
  Fname: z.string().min(1, "نام الزامی است"),
  Lname: z.string().min(1, "نام خانوادگی الزامی است"),
  FatherName: z.string().min(1, "نام پدر الزامی است"),
  Mellicode: z
    .string()
    .min(10, "کد ملی باید 10 رقم باشد")
    .max(10, "کد ملی باید 10 رقم باشد"),
  FatherJob: z.string().min(1, "شغل پدر الزامی است"),
  Ostan: z.string().min(1, "استان الزامی است"),
  status: z.enum(["active", "inactive"]),
  Aks: z.string().optional(),
  juz: z.string().optional(),
  ziafat: z.string().optional(),
  ziafatdate: z.string().optional(),
  Birthday: z.string().optional(),
  Birthplace: z.string().optional(),
  Entryday: z.string().optional(),
  Phone: z.string().optional(),
  TelPhone: z.string().optional(),
  ParentPhone: z.string().optional(),
  City: z.string().optional(),
  Vilage: z.string().optional(),
  Adress: z.string().optional(),
  Educating: z.string().optional(),
  degree: z.string().optional(),
  StudentCode: z.string().optional(),
  Referer: z.string().optional(),
  documents: z.string().optional(),
  EconomicStatus: z.string().optional(),
  course: z.string().optional(),
  master_status: z.string().optional(),
  Health: z.string().optional(),
  Description: z.string().optional(),
  endDate: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormProps {
  student?: Student;
  onSuccess: () => void;
}

export function StudentForm({ student, onSuccess }: StudentFormProps) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      Fname: student?.Fname || "",
      Lname: student?.Lname || "",
      FatherName: student?.FatherName || "",
      Mellicode: student?.Mellicode || "",
      FatherJob: student?.FatherJob || "",
      Ostan: student?.Ostan || "",
      status: (student?.status as "active" | "inactive") || "active",
      Aks: student?.Aks || "",
      juz: student?.juz || "",
      ziafat: student?.ziafat || "",
      ziafatdate: student?.ziafatdate || "",
      Birthday: student?.Birthday || "",
      Birthplace: student?.Birthplace || "",
      Entryday: student?.Entryday || "",
      Phone: student?.Phone || "",
      TelPhone: student?.TelPhone || "",
      ParentPhone: student?.ParentPhone || "",
      City: student?.City || "",
      Vilage: student?.Vilage || "",
      Adress: student?.Adress || "",
      Educating: student?.Educating || "",
      degree: student?.degree || "",
      StudentCode: student?.StudentCode || "",
      Referer: student?.Referer || "",
      documents: student?.documents || "",
      EconomicStatus: student?.EconomicStatus || "",
      course: student?.course || "",
      master_status: student?.master_status || "",
      Health: student?.Health || "",
      Description: student?.Description || "",
      endDate: student?.endDate || "",
    },
  });

  const onSubmit = async (data: StudentFormData) => {
    if (!accessToken) return;

    try {
      setLoading(true);
      if (student) {
        await StudentService.updateStudent(student.id, data, accessToken);
        toast.success("دانش آموز با موفقیت ویرایش شد");
      } else {
        await StudentService.createStudent(data, accessToken);
        toast.success("دانش آموز با موفقیت ایجاد شد");
      }
      onSuccess();
    } catch (error) {
      toast.error("خطا در ذخیره اطلاعات دانش آموز");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="Fname">نام</Label>
          <Input id="Fname" {...form.register("Fname")} placeholder="نام" />
          {form.formState.errors.Fname && (
            <p className="text-sm text-red-500">
              {form.formState.errors.Fname.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Lname">نام خانوادگی</Label>
          <Input
            id="Lname"
            {...form.register("Lname")}
            placeholder="نام خانوادگی"
          />
          {form.formState.errors.Lname && (
            <p className="text-sm text-red-500">
              {form.formState.errors.Lname.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="FatherName">نام پدر</Label>
          <Input
            id="FatherName"
            {...form.register("FatherName")}
            placeholder="نام پدر"
          />
          {form.formState.errors.FatherName && (
            <p className="text-sm text-red-500">
              {form.formState.errors.FatherName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Mellicode">کد ملی</Label>
          <Input
            id="Mellicode"
            {...form.register("Mellicode")}
            placeholder="کد ملی"
          />
          {form.formState.errors.Mellicode && (
            <p className="text-sm text-red-500">
              {form.formState.errors.Mellicode.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="FatherJob">شغل پدر</Label>
          <Input
            id="FatherJob"
            {...form.register("FatherJob")}
            placeholder="شغل پدر"
          />
          {form.formState.errors.FatherJob && (
            <p className="text-sm text-red-500">
              {form.formState.errors.FatherJob.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Ostan">استان</Label>
          <Input id="Ostan" {...form.register("Ostan")} placeholder="استان" />
          {form.formState.errors.Ostan && (
            <p className="text-sm text-red-500">
              {form.formState.errors.Ostan.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">وضعیت</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(value) =>
              form.setValue("status", value as "active" | "inactive")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="انتخاب وضعیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">فعال</SelectItem>
              <SelectItem value="inactive">غیرفعال</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="Phone">شماره تماس</Label>
          <Input
            id="Phone"
            {...form.register("Phone")}
            placeholder="شماره تماس"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ParentPhone">شماره تماس والدین</Label>
          <Input
            id="ParentPhone"
            {...form.register("ParentPhone")}
            placeholder="شماره تماس والدین"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="City">شهر</Label>
          <Input id="City" {...form.register("City")} placeholder="شهر" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="Adress">آدرس</Label>
          <Input id="Adress" {...form.register("Adress")} placeholder="آدرس" />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess()}
          disabled={loading}
        >
          انصراف
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "در حال ذخیره..." : student ? "ویرایش" : "افزودن"}
        </Button>
      </div>
    </form>
  );
}
