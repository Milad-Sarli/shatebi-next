"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, User as UserIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/context/auth.context";
import { UserService, User } from "@/lib/services/user.service";
import { toast } from "sonner";
import { UserForm } from "../../user-form";
import { PageTransition } from "@/components/ui/page-transition";

export default function EditUserPage() {
  const { id } = useParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUser = async () => {
      if (!accessToken || !id) return;
      
      try {
        setLoading(true);
        const response = await UserService.getUserById(parseInt(String(id)), accessToken);
        setUser(response.data);
      } catch (error) {
        toast.error("خطا در دریافت اطلاعات کاربر");
        console.error(error);
        router.push("/dashboard/users");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [accessToken, id, router]);

  const handleSuccess = () => {
    toast.success("کاربر با موفقیت بروزرسانی شد");
    router.push("/dashboard/users");
  };

  const handleCancel = () => {
    router.push("/dashboard/users");
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-zinc-600 dark:text-zinc-400">در حال بارگذاری...</span>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!user) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <UserIcon className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              کاربر یافت نشد
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              کاربر مورد نظر وجود ندارد یا حذف شده است.
            </p>
            <Button 
              onClick={handleCancel}
              variant="outline"
              className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <ArrowRight className="h-4 w-4 mr-1" />
              بازگشت به لیست کاربران
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg p-4 overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 dark:from-blue-500/5 dark:via-emerald-500/5 dark:to-blue-500/5" />
          {/* Content */}
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
                ویرایش کاربر
              </h1>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <Card className="border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <UserIcon className="h-5 w-5" />
              اطلاعات کاربر
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">نام کاربری:</span>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{user.username}</p>
              </div>
              <div>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">نام کامل:</span>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {`${user.fname || ''} ${user.lname || ''}`.trim() || user.name || 'نامشخص'}
                </p>
              </div>
              <div>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">شماره تماس:</span>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{user.phone}</p>
              </div>
              <div>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">ایمیل:</span>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{user.email || 'ندارد'}</p>
              </div>
            </div>

            <UserForm
              initialData={user}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}