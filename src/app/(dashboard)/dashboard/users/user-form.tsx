"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/context/auth.context";
import { UserService, User } from "@/lib/services/user.service";
import { toast } from "sonner";

const userSchema = z.object({
  username: z.string().min(3, "نام کاربری باید حداقل 3 کاراکتر باشد"),
  fname: z.string().optional(),
  name: z.string().min(2, "نام باید حداقل 2 کاراکتر باشد"),
  lname: z.string().optional(),
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل باید با 09 شروع شود و 11 رقم باشد"),
  email: z.string().optional().refine((val) => !val || val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: "ایمیل نامعتبر است",
  }),
  password: z.string().optional(),
  tenant_id: z.number().min(1, "مرکز را انتخاب کنید"),
  send_sms: z.boolean(),
  is_superuser: z.boolean(),
  is_admin: z.boolean(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
  initialData?: User;
}

export function UserForm({ onSuccess, onCancel, initialData }: UserFormProps) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = React.useState(false);

  // Helper function to get user full name
  const getUserFullName = (user: User) => {
    return `${user.fname || ''} ${user.lname || ''}`.trim() || user.name || '';
  };

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData
      ? {
          username: initialData.username || "",
          fname: initialData.fname || "",
          name: initialData.name || getUserFullName(initialData),
          lname: initialData.lname || "",
          phone: initialData.phone || "",
          email: initialData.email || "",
          password: "",
          tenant_id: initialData.tenant_id || 1,
          send_sms: initialData.send_sms || false,
          is_superuser: initialData.is_superuser || false,
          is_admin: initialData.is_admin || false,
        }
      : {
          username: "",
          fname: "",
          name: "",
          lname: "",
          phone: "",
          email: "",
          password: "",
          tenant_id: 1,
          send_sms: false,
          is_superuser: false,
          is_admin: false,
        },
  });

  const onSubmit = async (data: UserFormValues) => {
    if (!accessToken) return;

    // Custom validation for password
    if (!initialData && (!data.password || data.password.length < 6)) {
      toast.error("رمز عبور باید حداقل 6 کاراکتر باشد");
      return;
    }

    try {
      setLoading(true);
      
      // For edit mode, only include password if it's provided
      const submitData: Partial<UserFormValues> = { ...data };
      if (initialData && (!data.password || data.password === "")) {
        delete submitData.password;
      }

      if (initialData) {
        await UserService.updateUser(initialData.id, submitData, accessToken);
        toast.success("کاربر با موفقیت بروزرسانی شد");
      } else {
        await UserService.createUser(submitData, accessToken);
        toast.success("کاربر با موفقیت ایجاد شد");
      }
      onSuccess();
    } catch (error) {
      toast.error(initialData ? "خطا در بروزرسانی کاربر" : "خطا در ایجاد کاربر");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-zinc-900 dark:text-zinc-100">نام کاربری</Label>
          <Input
            id="username"
            {...form.register("username")}
            placeholder="نام کاربری (کد ملی)" 
            className="border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
          />
          {form.formState.errors.username && (
            <p className="text-sm text-red-500 dark:text-red-400">
              {form.formState.errors.username.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="text-zinc-900 dark:text-zinc-100">نام کامل</Label>
          <Input
            id="name"
            {...form.register("name")}
            placeholder="نام کامل"
            className="border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500 dark:text-red-400">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fname" className="text-zinc-900 dark:text-zinc-100">نام</Label>
          <Input
            id="fname"
            {...form.register("fname")}
            placeholder="نام"
            className="border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lname" className="text-zinc-900 dark:text-zinc-100">نام خانوادگی</Label>
          <Input
            id="lname"
            {...form.register("lname")}
            placeholder="نام خانوادگی"
            className="border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-zinc-900 dark:text-zinc-100">شماره موبایل</Label>
          <Input
            id="phone"
            {...form.register("phone")}
            placeholder="09XXXXXXXXX"
            className="border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
          />
          {form.formState.errors.phone && (
            <p className="text-sm text-red-500 dark:text-red-400">
              {form.formState.errors.phone.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-zinc-900 dark:text-zinc-100">ایمیل</Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            placeholder="ایمیل"
            className="border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500 dark:text-red-400">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-zinc-900 dark:text-zinc-100">
            رمز عبور{initialData ? " (اختیاری)" : ""}
          </Label>
          <Input
            id="password"
            type="password"
            {...form.register("password")}
            placeholder={initialData ? "رمز عبور جدید (اختیاری)" : "رمز عبور"}
            className="border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-500 dark:text-red-400">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="send_sms" className="text-zinc-900 dark:text-zinc-100">ارسال پیامک</Label>
          <Switch
            dir="ltr"
            id="send_sms"
            checked={form.watch("send_sms")}
            onCheckedChange={(checked) => form.setValue("send_sms", checked)}
            className="data-[state=checked]:bg-zinc-900 dark:data-[state=checked]:bg-zinc-100"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="is_superuser" className="text-zinc-900 dark:text-zinc-100">کاربر ویژه</Label>
          <Switch
            dir="ltr"
            id="is_superuser"
            checked={form.watch("is_superuser")}
            onCheckedChange={(checked) => form.setValue("is_superuser", checked)}
            className="data-[state=checked]:bg-zinc-900 dark:data-[state=checked]:bg-zinc-100"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="is_admin" className="text-zinc-900 dark:text-zinc-100">مدیر</Label>
          <Switch
            dir="ltr"
            id="is_admin"
            checked={form.watch("is_admin")}
            onCheckedChange={(checked) => form.setValue("is_admin", checked)}
            className="data-[state=checked]:bg-zinc-900 dark:data-[state=checked]:bg-zinc-100"
          />
        </div>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button 
            type="button"
            variant="outline"
            className="flex-1 border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            onClick={onCancel}
            disabled={loading}
          >
            انصراف
          </Button>
        )}
        <Button 
          type="button"
          className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          disabled={loading}
          onClick={async () => {
            const values = form.getValues();
            await onSubmit(values);
          }}
        >
          {loading ? "در حال ذخیره..." : initialData ? "بروزرسانی" : "ایجاد"}
        </Button>
      </div>
    </form>
  );
} 