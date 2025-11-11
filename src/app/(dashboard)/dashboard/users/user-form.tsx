"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/context/auth.context";
import { UserService, User } from "@/lib/services/user.service";
import { toast } from "sonner";

const userSchema = z.object({
  username: z
    .string()
    .min(3, "نام کاربری باید حداقل 3 کاراکتر باشد")
    .max(10, "کد ملی باید حداکثر 10 رقم باشد"),
  fname: z.string().optional(),
  name: z.string().min(2, "نام باید حداقل 2 کاراکتر باشد"),
  lname: z.string().optional(),
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل باید با 09 شروع شود و 11 رقم باشد"),
  tenant_id: z.number().min(1, "مرکز را انتخاب کنید"),
  password: z
    .string()
    .min(6, "رمز عبور باید حداقل 6 کاراکتر باشد")
    .optional()
    .or(z.literal(""))
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
          tenant_id: initialData.tenant_id || 1,
          password: "",
        }
      : {
          username: "",
          fname: "",
          name: "",
          lname: "",
          phone: "",
          tenant_id: 1,
          password: "",
        },
  });

  const onSubmit = async (data: UserFormValues) => {
    if (!accessToken) return;

    try {
      setLoading(true);
      
      if (initialData) {
        // Only include password if provided (non-empty)
        const payload = { ...data } as Partial<User> & { password?: string };
        if (!payload.password) {
          delete (payload as { password?: string }).password;
        }
        await UserService.updateUser(initialData.id, payload, accessToken);
        toast.success("کاربر با موفقیت بروزرسانی شد");
      } else {
        const payload = { ...data } as Partial<User> & { password?: string };
        if (!payload.password) {
          delete (payload as { password?: string }).password;
        }
        await UserService.createUser(payload, accessToken);
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
            maxLength={10}
            inputMode="numeric"
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
      </div>

      {/* Password (optional) */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-zinc-900 dark:text-zinc-100">رمز عبور جدید (اختیاری)</Label>
        <Input
          id="password"
          type="password"
          {...form.register("password")}
          placeholder="اگر خالی بماند، رمز عبور تغییر نمی‌کند"
          className="border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
        />
        {form.formState.errors.password && (
          <p className="text-sm text-red-500 dark:text-red-400">
            {form.formState.errors.password.message}
          </p>
        )}
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