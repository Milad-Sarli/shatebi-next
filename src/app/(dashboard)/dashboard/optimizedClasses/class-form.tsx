"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  optimizedClassService,
  CreateOptimizedClassDto,
} from "@/lib/services/optimizedClass.service";
import { useAuth } from "@/lib/context/auth.context";
import { toast } from "sonner";

const formSchema = z.object({
  tenant_id: z.number().min(1, "Tenant ID is required"),
  user_id: z.number().min(1, "User ID is required"),
  droos_id: z.number().min(1, "Lesson ID is required"),
  status: z.enum(["active", "inactive"]),
});

interface ClassFormProps {
  initialData?: CreateOptimizedClassDto;
  classId?: number;
  onSuccess?: () => void;
}

export function ClassForm({ initialData, classId, onSuccess }: ClassFormProps) {
  const { accessToken } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      tenant_id: 0,
      user_id: 0,
      droos_id: 0,
      status: "active",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!accessToken) return;

    try {
      if (classId) {
        await optimizedClassService.update(classId, values);
        toast.success("Class updated successfully");
      } else {
        await optimizedClassService.create(values);
        toast.success("Class created successfully");
      }
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save class:", error);
      toast.error("Failed to save class");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="tenant_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tenant ID</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="user_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User ID</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="droos_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson ID</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white dark:bg-zinc-900">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {classId ? "Update" : "Create"} Class
          </Button>
        </div>
      </form>
    </Form>
  );
}
