"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MasterService, Master, MasterCreateData } from "@/lib/services/master.service";
import { useAuth } from "@/lib/context/auth.context";
import { toast } from "sonner";

// Only include the visible fields in the form schema
const formSchema = z.object({
  fullname: z.string().min(3, "نام کامل باید حداقل 3 کاراکتر باشد"),
  mellicode: z.string().min(10, "کد ملی باید حداقل 10 کاراکتر باشد").max(10, "کد ملی باید حداکثر 10 کاراکتر باشد"),
  phone: z.string().min(11, "شماره تلفن باید حداقل 11 کاراکتر باشد").max(11, "شماره تلفن باید حداکثر 11 کاراکتر باشد"),
});

type FormValues = z.infer<typeof formSchema>;

interface MasterFormProps {
  master?: Master;
  onSuccess: () => void;
}

export function MasterForm({ master, onSuccess }: MasterFormProps) {
  const { accessToken, user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  console.log(user);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullname: master?.fullname || "",
      mellicode: master?.mellicode || "",
      phone: master?.phone || "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!accessToken) {
      toast.error("شما اجازه دسترسی ندارید");
      return;
    }

    // Add the required hidden fields
    const completeData = {
      ...data,
      user_id: master?.user_id || 1,
      aks: master?.aks || "",
      tenant_id: master?.tenant_id || 1,
    };

    setLoading(true);
    try {
      if (master) {
        // Update existing master
        await MasterService.updateMaster(master.id, completeData, accessToken);
        toast.success("استاد با موفقیت ویرایش شد");
      } else {
        // Create new master
        await MasterService.createMaster(completeData as MasterCreateData, accessToken);
        toast.success("استاد با موفقیت ایجاد شد");
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(master ? "خطا در ویرایش استاد" : "خطا در ایجاد استاد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <FormField
          control={form.control}
          name="fullname"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-900 dark:text-zinc-100">نام کامل</FormLabel>
              <FormControl>
                <Input
                  placeholder="نام کامل استاد را وارد کنید"
                  {...field}
                  className="border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
                />
              </FormControl>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mellicode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-900 dark:text-zinc-100">کد ملی</FormLabel>
              <FormControl>
                <Input
                  placeholder="کد ملی استاد را وارد کنید"
                  {...field}
                  className="border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
                />
              </FormControl>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-900 dark:text-zinc-100">شماره تلفن</FormLabel>
              <FormControl>
                <Input
                  placeholder="شماره تلفن استاد را وارد کنید"
                  {...field}
                  className="border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
                />
              </FormControl>
              <FormMessage className="text-red-500" />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            className="border-zinc-200 text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            انصراف
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? (
              <span className="flex items-center gap-1">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-transparent"></span>
                در حال پردازش...
              </span>
            ) : master ? (
              "ویرایش استاد"
            ) : (
              "ایجاد استاد"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 