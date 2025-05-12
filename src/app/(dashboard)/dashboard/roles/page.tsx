'use client';

import { useEffect, useState, useCallback } from 'react';
import { AppRoleService, AppRole } from '@/lib/services/approle.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/context/auth.context';
import { useTheme } from 'next-themes';
import { Sun, Moon, Plus, Trash2 } from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useRouter } from 'next/navigation';

const roleTranslations = {
  admin: { fa: 'مدیر', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  master: { fa: 'مربی', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  superuser: { fa: 'کاربر ویژه', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  user: { fa: 'کاربر عادی', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' },
  moderator: { fa: 'مدیر محتوا', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  editor: { fa: 'ویرایشگر', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300' },
  analyst: { fa: 'تحلیلگر', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  support: { fa: 'پشتیبان', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' }
};

// Function to generate random color for new roles
const generateRoleColor = (roleName: string) => {
  const colors = [
    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300',
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
    'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
    'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
    'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
  ];
  
  // Generate a consistent index based on role name
  const index = roleName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

export default function RolesPage() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [roleToDelete, setRoleToDelete] = useState<{ id: number; user_id: number } | null>(null);
  const { toast } = useToast();
  const { accessToken } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const fetchRoles = useCallback(async () => {
    try {
      const response = await AppRoleService.getAppRoles({}, accessToken!);
      setRoles(response.data);
      setRoleToDelete(null);
    } catch {
      toast({
        title: 'خطا',
        description: 'در دریافت لیست نقش‌ها مشکلی پیش آمده است',
      });
    }
  }, [accessToken, toast]);

  useEffect(() => {
    if (accessToken) {
      fetchRoles();
    }
  }, [accessToken, fetchRoles]);

  const handleRemoveRole = async (roleId: number, userId: number) => {
    try {
      await AppRoleService.removeRole(
        {
          role_id: roleId,
          user_id: userId,
        },
        accessToken!
      );
      toast({
        title: 'موفق',
        description: 'نقش با موفقیت حذف شد',
      });
      setRoles((prevRoles) => prevRoles.filter(role => !(role.id == roleId)));
      setRoleToDelete(null);
    } catch {
      toast({
        title: 'خطا',
        description: 'در حذف نقش مشکلی پیش آمده است',
      });
    }
  };

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg p-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 dark:from-blue-500/5 dark:via-emerald-500/5 dark:to-blue-500/5" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
              مدیریت نقش‌ها
            </h1>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/roles/add')}
                className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10"
              >
                <Plus className="ml-2 h-4 w-4" />
                ایجاد نقش جدید
              </Button>
            </div>
          </div>
        </div>

        <Card className="border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="text-zinc-900 dark:text-zinc-100">لیست نقش‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-right text-sm">
                <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">نام نقش</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">توضیحات</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  <AnimatePresence mode="wait">
                    {roles.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400">
                          هیچ نقشی وجود ندارد
                        </td>
                      </tr>
                    ) : (
                      roles.map((role) => (
                        <motion.tr
                          key={role.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                        >
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleTranslations[role.name as keyof typeof roleTranslations]?.color || generateRoleColor(role.name)}`}>
                              {roleTranslations[role.name as keyof typeof roleTranslations]?.fa || role.name}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                            {role.description || '-'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                  onClick={() => setRoleToDelete({ id: role.id, user_id: role.user_id })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    این عمل قابل بازگشت نیست. نقش &apos;{roleTranslations[role.name as keyof typeof roleTranslations]?.fa || role.name}&apos; برای همیشه حذف خواهد شد.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setRoleToDelete(null)}>لغو</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      if (roleToDelete && roleToDelete.id === role.id) {
                                        handleRemoveRole(roleToDelete.id, roleToDelete.user_id);
                                      }
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
