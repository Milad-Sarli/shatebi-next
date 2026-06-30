'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppRoleService } from '@/lib/services/approle.service';
import { AppRolePermissionService } from '@/lib/services/app-role-permission.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/context/auth.context';
import { PageTransition } from '@/components/ui/page-transition';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params?.id as string;
  const [roleName, setRoleName] = useState<string>('');
  const [roleDescription, setRoleDescription] = useState<string>('');
  const [permissions, setPermissions] = useState({
    create: false,
    view: false,
    edit: false,
    delete: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();
  const { accessToken } = useAuth();

  useEffect(() => {
    if (!accessToken || !roleId) return;
    const fetchRole = async () => {
      try {
        const [roleRes, permRes] = await Promise.all([
          AppRoleService.getAppRole(Number(roleId), accessToken),
          AppRolePermissionService.getAppRolePermissions({ role_id: Number(roleId) }, accessToken),
        ]);
        const role = roleRes.data;
        setRoleName(role.name);
        setRoleDescription(role.description || '');
        const perms = permRes.data.map((p) => p.name);
        setPermissions({
          create: perms.includes('create'),
          view: perms.includes('view'),
          edit: perms.includes('edit'),
          delete: perms.includes('delete'),
        });
      } catch {
        toast({
          title: 'خطا',
          description: 'در دریافت اطلاعات نقش مشکلی پیش آمده است',
        });
        router.push('/dashboard/roles');
      } finally {
        setIsFetching(false);
      }
    };
    fetchRole();
  }, [accessToken, roleId, router, toast]);

  const handleUpdateRole = async () => {
    if (!roleName) {
      toast({ title: 'خطا', description: 'لطفا نام نقش را وارد کنید' });
      return;
    }

    setIsLoading(true);
    try {
      await AppRoleService.updateAppRole(Number(roleId), { name: roleName, description: roleDescription }, accessToken!);

      const permRes = await AppRolePermissionService.getAppRolePermissions({ role_id: Number(roleId) }, accessToken!);
      const existingPerms = permRes.data;

      const desiredPerms = ['create', 'view', 'edit', 'delete'].filter((p) => permissions[p as keyof typeof permissions]);
      const existingNames = existingPerms.map((p) => p.name);

      const toCreate = desiredPerms.filter((p) => !existingNames.includes(p));
      const toDelete = existingPerms.filter((p) => !desiredPerms.includes(p.name));

      await Promise.all([
        ...toCreate.map((p) => AppRolePermissionService.createAppRolePermission({ role_id: Number(roleId), name: p }, accessToken!)),
        ...toDelete.map((p) => AppRolePermissionService.deleteAppRolePermission(p.id, accessToken!)),
      ]);

      toast({ title: 'موفق', description: 'نقش با موفقیت ویرایش شد' });
      router.push('/dashboard/roles');
    } catch {
      toast({ title: 'خطا', description: 'در ویرایش نقش مشکلی پیش آمده است' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg p-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 dark:from-blue-500/5 dark:via-emerald-500/5 dark:to-blue-500/5" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
              ویرایش نقش
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

        <Card className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-zinc-900 dark:text-zinc-100">فرم ویرایش نقش</CardTitle>
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

              <div className="space-y-4">
                <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">دسترسی‌ها</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="create"
                      checked={permissions.create}
                      onCheckedChange={(checked) => setPermissions((prev) => ({ ...prev, create: checked as boolean }))}
                    />
                    <Label htmlFor="create">ایجاد</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="view"
                      checked={permissions.view}
                      onCheckedChange={(checked) => setPermissions((prev) => ({ ...prev, view: checked as boolean }))}
                    />
                    <Label htmlFor="view">مشاهده</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit"
                      checked={permissions.edit}
                      onCheckedChange={(checked) => setPermissions((prev) => ({ ...prev, edit: checked as boolean }))}
                    />
                    <Label htmlFor="edit">ویرایش</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="delete"
                      checked={permissions.delete}
                      onCheckedChange={(checked) => setPermissions((prev) => ({ ...prev, delete: checked as boolean }))}
                    />
                    <Label htmlFor="delete">حذف</Label>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleUpdateRole}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4 ml-2" />
                    در حال ذخیره...
                  </>
                ) : (
                  'ذخیره تغییرات'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
