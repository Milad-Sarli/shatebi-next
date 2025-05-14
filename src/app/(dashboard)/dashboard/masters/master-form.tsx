"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MasterService, Master, MasterCreateData, MasterUpdateData } from "@/lib/services/master.service";
import { useAuth } from "@/lib/context/auth.context";
import { toast } from "sonner";
import { FileInput } from "@/components/ui/file-input";
import Image from "next/image";

// Only include the visible fields in the form schema
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg"];
const MAX_FILE_SIZE = 300 * 1024; // 300KB

const formSchema = z.object({
  fullname: z.string().min(3, "نام کامل باید حداقل 3 کاراکتر باشد"),
  mellicode: z.string().min(10, "کد ملی باید حداقل 10 کاراکتر باشد").max(10, "کد ملی باید حداکثر 10 کاراکتر باشد"),
  phone: z.string().min(11, "شماره تلفن باید حداقل 11 کاراکتر باشد").max(11, "شماره تلفن باید حداکثر 11 کاراکتر باشد"),
  aks: z
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
});

type FormValues = z.infer<typeof formSchema>;

interface MasterFormProps {
  master?: Master;
  onSuccess: () => void;
}

interface ApiErrorLike {
  response?: {
    data?: {
      message?: string | Record<string, string[]>;
      // You can add other properties if your API error responses have them
    };
  };
  message?: string; // For general errors not from API response structure
}

export function MasterForm({ master, onSuccess }: MasterFormProps) {
  const { accessToken, user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(master?.aks || null);
  const [fileInputKey, setFileInputKey] = React.useState<number>(Date.now()); // For resetting file input

  console.log(user);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullname: master?.fullname || "",
      mellicode: master?.mellicode || "",
      phone: master?.phone || "",
      aks: undefined,
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!accessToken) {
      toast.error("شما اجازه دسترسی ندارید");
      return;
    }

    // Prepare data for submission, especially for the 'aks' field.
    const completeData: MasterUpdateData = {
      fullname: data.fullname,
      mellicode: data.mellicode,
      phone: data.phone,
      user_id: master?.user_id || 1,
      tenant_id: master?.tenant_id || 1,
    };

    if (data.aks instanceof File) {
      completeData.aks = data.aks; // New file selected
    } else if (master && master.aks && imagePreview === master.aks) {
      // Editing, existing image was shown and not changed/removed
      completeData.aks = master.aks;
    } else if (!imagePreview && master?.aks) {
      // Existing image was explicitly removed (imagePreview is null, data.aks is undefined)
      completeData.aks = ""; // Send empty string or null to indicate removal
    } else if (!imagePreview && !master?.aks && data.aks === undefined){
      // No image initially, and no new image selected, and no preview exists
      // aks field can be omitted or sent as undefined/null based on backend
      // For now, we don't add it to completeData if it was never there and not provided.
    } else if (data.aks === undefined && !imagePreview) {
      // Catch-all for cases where aks is not a file and there's no preview (e.g. form reset after initial image)
      // This implies it should be considered as not provided or cleared.
       if (master?.aks) completeData.aks = ""; // If there was an old image, it's now cleared
        // else, it was never there, so no need to send 'aks'
    }
    // If data.aks is a string (e.g. from initial master.aks default value if not handled by preview logic),
    // and preview logic hasn't superceded it, this is already handled by the master.aks check if imagePreview matches.

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
    } catch (error: unknown) {
      console.error(error);
      const generalErrorMessage = master ? "خطا در ویرایش استاد" : "خطا در ایجاد استاد";
      let backendErrorsProcessed = false;

      const apiError = error as ApiErrorLike;

      if (apiError.response && apiError.response.data && apiError.response.data.message) {
        const messages = apiError.response.data.message;
        if (typeof messages === 'object') {
          Object.keys(messages).forEach((field) => {
            const fieldMessages = messages[field]; // fieldMessages is string[]
            if (fieldMessages && fieldMessages.length > 0) {
              // Attempt to set error on the specific form field
              // This requires 'field' to be a valid name in FormValues
              if (field in form.getValues()) {
                form.setError(field as keyof FormValues, {
                  type: "manual",
                  message: fieldMessages.join(", "),
                });
                backendErrorsProcessed = true;
              }
            }
          });
        }
      }

      if (!backendErrorsProcessed) {
        toast.error(generalErrorMessage);
      }
      // If specific field errors were set, a general toast might be redundant
      // or you might want it anyway as a general notification.
      // For now, only show general toast if no specific errors were processed.

    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-x-6 gap-y-4 mt-4">
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
                maxLength={10}
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

        {/* AKS Field - Now defaults to 1 column on md screens */}
        <div>
          <FormField
            control={form.control}
            name="aks"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-900 dark:text-zinc-100">تصویر استاد (اختیاری، حداکثر 300KB)</FormLabel>
                <FormControl>
                  <FileInput
                    key={fileInputKey} // Used to reset the input
                    onFileChange={(file) => {
                      if (file) {
                        if (file.size > MAX_FILE_SIZE) {
                          toast.error("حجم عکس باید کمتر از 300 کیلوبایت باشد.");
                          form.setValue("aks", undefined, { shouldValidate: true });
                          setImagePreview(master?.aks || null); // Reset to original or null
                          setFileInputKey(Date.now()); // Reset file input
                          return;
                        }
                        // Type check (already in Zod, but good for immediate feedback too)
                        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                           toast.error("فرمت فایل باید JPEG, PNG, یا JPG باشد.");
                           form.setValue("aks", undefined, { shouldValidate: true });
                           setImagePreview(master?.aks || null); // Reset to original or null
                           setFileInputKey(Date.now()); // Reset file input
                           return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImagePreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                        field.onChange(file);
                      } else {
                        // File input was cleared by user (e.g. selecting a file then cancelling)
                        // This case might not be easily triggered by FileInput component itself without direct interaction
                        field.onChange(undefined);
                        setImagePreview(master?.aks || null); // Reset to original if present
                      }
                    }}
                    accept="image/jpeg,image/png,image/jpg"
                    className="border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
                {(imagePreview) && (
                  <div className="mt-2 relative w-32 h-32">
                    <Image
                      src={imagePreview}
                      alt="پیش‌نمایش تصویر استاد"
                      width={128}
                      height={128}
                      className="rounded-md object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => {
                        setImagePreview(null);
                        form.setValue("aks", undefined, { shouldValidate: true });
                        setFileInputKey(Date.now()); // Reset file input
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                )}
              </FormItem>
            )}
          />
        </div>

        <div className="md:col-span-2 flex justify-end gap-2 pt-4">
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