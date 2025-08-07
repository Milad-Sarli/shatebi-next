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
import { toast as sonnerToast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { locationService, Province, City } from '@/lib/services/location.service';
import { SingleSelectCombobox } from '@/components/ui/Combobox';
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DatePicker from "react-multi-date-picker";
import { FileInput } from "@/components/ui/file-input";
import Image from "next/image";

const educationLevels = [
  { value: "پنجم", label: "پنجم" },
  { value: "ششم", label: "ششم" },
  { value: "هفتم", label: "هفتم" },
  { value: "هشتم", label: "هشتم" },
  { value: "نهم", label: "نهم" }, 
  { value: "دهم", label: "دهم" },
  { value: "یازدهم", label: "یازدهم" },
  { value: "دوازدهم", label: "دوازدهم" },
  { value: "دانشگاه", label: "دانشگاه" },
];

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg"];
const MAX_FILE_SIZE = 300 * 1024; // 300KB

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
  status: z.enum([
    "در حال تحصیل",
    "ترک تحصیل",
    "فارغ التحصیل",
    "انتقالی",
    "اخراجی",
  ]),
  Aks: z
    .any()
    .optional()
    .refine(
      (file) => {
        if (!file || typeof file === "string") return true; // Allow undefined, null, or existing URL string
        return (file as File).size <= MAX_FILE_SIZE;
      },
      `حداکثر حجم فایل ${MAX_FILE_SIZE / 1024}KB میباشد.`
    )
    .refine(
      (file) => {
        if (!file || typeof file === "string") return true; // Allow undefined, null, or existing URL string
        return ACCEPTED_IMAGE_TYPES.includes((file as File).type);
      },
      "فرمت فایل باید JPEG, PNG, یا JPG باشد."
    ),
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

interface ApiErrorLike {
  response?: {
    data?: {
      message?: string | Record<string, string[]>;
      status?: string; // Added status based on usage
    };
  };
  message?: string;
}

export function StudentForm({ student, onSuccess }: StudentFormProps) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const { toast: customToast } = useToast();
  const [provinces, setProvinces] = React.useState<Province[]>([]);
  const [cities, setCities] = React.useState<City[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = React.useState<number | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = React.useState<number>(0);

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      Fname: student?.Fname || "",
      Lname: student?.Lname || "",
      FatherName: student?.FatherName || "",
      Mellicode: student?.Mellicode || "",
      FatherJob: student?.FatherJob || "",
      Ostan: student?.Ostan || "",
      City: student?.City || "",
      status:
        (student?.status as
          | "در حال تحصیل"
          | "ترک تحصیل"
          | "فارغ التحصیل"
          | "انتقالی"
          | "اخراجی") || "در حال تحصیل",
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

  React.useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const provincesData = await locationService.getAllProvinces();
        setProvinces(provincesData);
        if (student && student.Ostan) {
          const currentProvince = provincesData.find(p => p.name === student.Ostan);
          if (currentProvince) {
            setSelectedProvinceId(currentProvince.id);
          }
        }
      } catch (error) {
        console.error('Error fetching provinces:', error);
        sonnerToast.error("خطا در دریافت لیست استان ها");
      }
    };
    fetchProvinces();
    
    // Set image preview for existing student
    if (student?.Aks) {
      // Handle relative paths by converting to absolute URL using API base
      const imageUrl = student.Aks.startsWith('http') 
        ? student.Aks 
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${student.Aks}`;
      setImagePreview(imageUrl);
    } 
  }, [student]);

  React.useEffect(() => {
    const fetchCities = async () => {
      if (selectedProvinceId) {
        try {
          const citiesData = await locationService.getCitiesByProvince(selectedProvinceId);
          setCities(citiesData);
        } catch (error) {
          console.error('Error fetching cities:', error);
          setCities([]);
          sonnerToast.error("خطا در دریافت لیست شهر ها");
        }
      } else {
        setCities([]);
      }
    };
    fetchCities();
  }, [selectedProvinceId]);

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue("Aks", file);
    } else {
      setImagePreview(null);
      form.setValue("Aks", undefined);
    }
  };

  const resetFileInput = () => {
    setSelectedFile(null);
    // Handle relative paths when resetting
    const imageUrl = student?.Aks 
      ? (student.Aks.startsWith('http') 
          ? student.Aks 
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${student.Aks}`)
      : null;
    setImagePreview(imageUrl);
    setFileInputKey(prev => prev + 1);
    form.setValue("Aks", student?.Aks || undefined);
  };

  const handleProvinceChange = (value: string) => {
    const province = provinces.find(p => p.name === value);
    if (province) {
      setSelectedProvinceId(province.id);
      form.setValue("Ostan", value);
      form.setValue("City", "");
      setCities([]);
    } else {
      setSelectedProvinceId(null);
      form.setValue("Ostan", "");
      form.setValue("City", "");
      setCities([]);
    }
  };

  const handleCityChange = (value: string) => {
    form.setValue("City", value);
  };

  const onSubmit = async (data: StudentFormData) => {
    if (!accessToken) return;

    try {
      setLoading(true);
      
      let submitData: StudentFormData | FormData;
      
      if (selectedFile || (student && !selectedFile && !imagePreview)) {
        // Use FormData if there's a new file or if removing existing image
        const formData = new FormData();
        
        // Add all form fields to FormData
        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'Aks' && value !== undefined && value !== null) {
            formData.append(key, value.toString());
          }
        });
        
        // Handle image field
        if (selectedFile) {
          formData.append('Aks', selectedFile);
        } else if (student && !imagePreview) {
          // User removed existing image
          formData.append('Aks', '');
        }
        
        submitData = formData;
      } else {
        // Use regular JSON if no file changes
        submitData = {
          ...data,
          ...(student?.Aks && imagePreview ? { Aks: student.Aks } : {})
        };
      }

      if (student) {
        await StudentService.updateStudent(student.id, submitData, accessToken);
        sonnerToast.success("قرآن آموز با موفقیت ویرایش شد", {
          style: { background: '#22c55e', color: '#fff' }
        });
      } else {
        await StudentService.createStudent(submitData, accessToken);
        sonnerToast.success("قرآن آموز با موفقیت ایجاد شد", {
          style: { background: '#22c55e', color: '#fff' }
        });
      }
      onSuccess();
    } catch (error: unknown) {
      console.error("Full error object from backend:", (error as ApiErrorLike).response || error);
      const apiError = error as ApiErrorLike;

      if (apiError.response && apiError.response.data) {
        const errorData = apiError.response.data;
        console.log("Received errorData from backend:", errorData);

        if (errorData.status === "error") {
          if (errorData.message === "کد ملی تکراری است") {
            console.log("Attempting to set Mellicode error in form state (for form validity).");
            form.setError("Mellicode", {
              type: "manual",
              message: "کد ملی تکراری است",
            });
            console.log("Current form.formState.errors after setError:", JSON.parse(JSON.stringify(form.formState.errors)));
            customToast({
              title: "کد ملی تکراری است",
              description: "این کد ملی قبلاً ثبت شده است. لطفاً کد ملی دیگری وارد کنید.",
              type: "destructive",
            });
          } else if (typeof errorData.message === "object") {
            console.log("Attempting to set Laravel validation errors:", errorData.message);
            Object.keys(errorData.message).forEach((field) => {
              const messages = (errorData.message as Record<string, string[]>)[field];
              if (messages && messages.length > 0) {
                form.setError(field as keyof StudentFormData, {
                  type: "manual",
                  message: messages[0],
                });
              }
            });
            sonnerToast.error("خطا در اعتبار سنجی اطلاعات وارد شده");
          } else {
            sonnerToast.error(errorData.message || "خطا در ذخیره اطلاعات قرآن آموز");
          }
        } else {
          sonnerToast.error("خطا در ذخیره اطلاعات قرآن آموز");
        }
      } else {
        sonnerToast.error("خطا در ارتباط با سرور");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Essential Fields Only - Optimized for Mobile */}
      <div className="space-y-4">
        {/* Full Name Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>

        {/* Father Info Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>

        {/* National Code */}
        <div className="space-y-2">
          <Label htmlFor="Mellicode">کد ملی</Label>
          <Input
            maxLength={10}
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

        {/* Location Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="Ostan">استان</Label>
            <SingleSelectCombobox
              options={provinces.map(province => ({
                value: province.name,
                label: province.name
              }))}
              value={form.watch("Ostan")}
              onChange={handleProvinceChange}
              placeholder="استان را انتخاب کنید"
              emptyMessage="استانی یافت نشد"
              searchable={true}
            />
            {form.formState.errors.Ostan && (
              <p className="text-sm text-red-500">
                {form.formState.errors.Ostan.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="City">شهر</Label>
            <SingleSelectCombobox
              options={cities.map(city => ({
                value: city.name,
                label: city.name
              }))}
              value={form.watch("City")}
              onChange={handleCityChange}
              placeholder="شهر را انتخاب کنید"
              emptyMessage="شهری یافت نشد (ابتدا استان را انتخاب کنید)"
              searchable={true}
            />
            {form.formState.errors.City && (
              <p className="text-sm text-red-500">
                {form.formState.errors.City.message}
              </p>
            )}
          </div>
        </div>

        {/* Status and Education */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">وضعیت</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(value) =>
                form.setValue(
                  "status",
                  value as
                    | "در حال تحصیل"
                    | "ترک تحصیل"
                    | "فارغ التحصیل"
                    | "انتقالی"
                    | "اخراجی"
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="در حال تحصیل">در حال تحصیل</SelectItem>
                <SelectItem value="ترک تحصیل">ترک تحصیل</SelectItem>
                <SelectItem value="فارغ التحصیل">فارغ التحصیل</SelectItem>
                <SelectItem value="انتقالی">انتقالی</SelectItem>
                <SelectItem value="اخراجی">اخراجی</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="Educating">پایه تحصیلی</Label>
            <Select value={form.watch("Educating") || ""}
              onValueChange={(value) => {
                form.setValue("Educating", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب پایه تحصیلی" />
              </SelectTrigger>
              <SelectContent>
                {educationLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.Educating && (
              <p className="text-sm text-red-500">
                {form.formState.errors.Educating.message}
              </p>
            )}
          </div>
        </div>

        {/* Phone Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="Adress">آدرس</Label>
          <Input id="Adress" {...form.register("Adress")} placeholder="آدرس" />
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label htmlFor="Aks">عکس</Label>
          <div className="space-y-4">
            <FileInput
              key={fileInputKey}
              label="انتخاب عکس"
              onFileChange={handleFileChange}
              accept="image/*"
            />
            {imagePreview && (
              <div className="relative w-32 h-32 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="پیش‌نمایش عکس"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={resetFileInput}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            )}
          </div>
          {form.formState.errors.Aks && (
            <p className="text-sm text-red-500">
              {String(form.formState.errors.Aks.message || 'Invalid file')}
            </p>
          )}
        </div>

        {/* Entry Date */}
        <div className="space-y-2">
          <Label htmlFor="Entryday">تاریخ ورود</Label>
          <DatePicker 
            onChange={(date: DateObject) => {
              const d = new Date(date.toDate());
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              form.setValue("Entryday", `${yyyy}-${mm}-${dd}`);
            }}
            calendar={persian}
            locale={persian_fa}
            calendarPosition="bottom-right"
            style={{ width: "100%" }}
            inputClass="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 px-3 py-2"
          />
          {form.watch("Entryday") && (
            <div className="text-xs text-gray-500 mt-2">
              {form.watch("Entryday")}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
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
