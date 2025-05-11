'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppRoleService } from '@/lib/services/approle.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/context/auth.context';
import { PageTransition } from '@/components/ui/page-transition';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreateRolePage() {
  const [roleName, setRoleName] = useState<string>('');
  const [roleDescription, setRoleDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { accessToken, user } = useAuth();
  const router = useRouter();

  const handleCreateRole = async () => {
    if (!roleName) {
      toast({
        title: 'خطا',
        description: 'لطفا نام نقش را وارد کنید',
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: 'خطا',
        description: 'شناسه کاربری یافت نشد',
      });
      return;
    }

    setIsLoading(true);
    try {
      await AppRoleService.createAppRole(
        {
          name: roleName,
          description: roleDescription,
          user_id: user.id
        },
        accessToken!
      );
      toast({
        title: 'موفق',
        description: 'نقش با موفقیت ایجاد شد',
      });
      router.push('/dashboard/roles');
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'در ایجاد نقش مشکلی پیش آمده است',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg p-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 dark:from-blue-500/5 dark:via-emerald-500/5 dark:to-blue-500/5" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
              ایجاد نقش جدید
            </h1>
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/roles')}
              className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
            >
              <ArrowLeft className="ml-2 h-4 w-4" />
              بازگشت به لیست نقش‌ها
            </Button>
          </div>
        </div>

        <Card className="border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="text-zinc-900 dark:text-zinc-100">فرم ایجاد نقش</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <Label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">نام نقش</Label>
                <Input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="نام نقش را به انگلیسی وارد کنید"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">توضیحات (اختیاری)</Label>
                <Input
                  type="text"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="توضیحات نقش را وارد کنید"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <Button
                onClick={handleCreateRole}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4 ml-2" />
                    در حال ایجاد...
                  </>
                ) : (
                  'ایجاد نقش'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
} 