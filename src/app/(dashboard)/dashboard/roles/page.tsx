"use client";

import * as React from "react";
import { Plus, Search, ChevronLeft, ChevronRight, Sun, Moon, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/context/auth.context";
import { useTheme } from "@/lib/context/theme.context";
import { RoleService, Role, RoleFilters } from "@/lib/services/role.service";
import { PermissionService, Permission } from "@/lib/services/permission.service";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RoleForm } from "./role-form";
import { PageTransition } from "@/components/ui/page-transition";
import { motion, AnimatePresence } from "framer-motion";

interface RoleResponse {
  roles: Role[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export default function RolesPage() {
  const { accessToken } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [permissions, setPermissions] = React.useState<Permission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<RoleFilters>({
    page: 1,
    per_page: 10,
  });
  const [pagination, setPagination] = React.useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    from: 0,
    to: 0,
  });
  const [search, setSearch] = React.useState("");
  const [isAddRoleOpen, setIsAddRoleOpen] = React.useState(false);
  const [roleToDelete, setRoleToDelete] = React.useState<number | null>(null);
  const [roleToEdit, setRoleToEdit] = React.useState<Role | null>(null);

  const fetchRoles = React.useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const response = await RoleService.getRoles(
        {
          ...filters,
          search: search || undefined,
        },
        accessToken
      );
      setRoles(response.roles);
      setPagination(response.pagination);
    } catch (error) {
      toast.error("خطا در دریافت لیست نقش‌ها");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters, search]);

  const fetchPermissions = React.useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await PermissionService.getPermissions({}, accessToken);
      setPermissions(response.data);
    } catch (error) {
      toast.error("خطا در دریافت لیست دسترسی‌ها");
      console.error(error);
    }
  }, [accessToken]);

  React.useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleDeleteRole = async (id: number) => {
    setRoleToDelete(id);
  };

  const confirmDelete = async () => {
    if (!accessToken || !roleToDelete) return;

    try {
      await RoleService.deleteRole(roleToDelete, accessToken);
      toast.success("نقش با موفقیت حذف شد");
      fetchRoles();
    } catch (error) {
      toast.error("خطا در حذف نقش");
      console.error(error);
    } finally {
      setRoleToDelete(null);
    }
  };

  const handleEditRole = (role: Role) => {
    setRoleToEdit(role);
  };

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg bg-white dark:bg-zinc-900 p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">مدیریت نقش‌ها</h1>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-zinc-900 hover:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-200"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
              <DialogTrigger asChild>
                <Button className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                  <Plus className="ml-2 h-4 w-4" />
                  افزودن نقش
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-zinc-900 dark:text-zinc-100">افزودن نقش جدید</DialogTitle>
                </DialogHeader>
                <RoleForm
                  permissions={permissions}
                  onSuccess={() => {
                    setIsAddRoleOpen(false);
                    fetchRoles();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="text-zinc-900 dark:text-zinc-100">لیست نقش‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
                <Input
                  placeholder="جستجو..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-9 border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
                />
              </div>
            </div>

            {/* Desktop table view */}
            <div className="relative overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 hidden md:block">
              <table className="w-full text-right text-sm">
                <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">#</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">نام</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">مرکز</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">دسترسی‌ها</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400">
                          در حال بارگذاری...
                        </td>
                      </tr>
                    ) : roles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400">
                          هیچ نقشی یافت نشد
                        </td>
                      </tr>
                    ) : (
                      roles.map((role, index) => (
                        <motion.tr
                          key={role.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                            {pagination.from + index}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{role.name}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{role.tenant?.title}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">
                            {role.permissions?.length || 0} دسترسی
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                              onClick={() => handleEditRole(role)}
                            >
                              ویرایش
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              onClick={() => handleDeleteRole(role.id)}
                            >
                              حذف
                            </Button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="space-y-4 md:hidden">
              <AnimatePresence mode="wait">
                {loading ? (
                  <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    در حال بارگذاری...
                  </div>
                ) : roles.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    هیچ نقشی یافت نشد
                  </div>
                ) : (
                  roles.map((role, index) => (
                    <motion.div
                      key={role.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{role.name}</h3>
                          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                            {role.permissions?.length || 0} دسترسی
                          </span>
                        </div>
                        {role.tenant?.title && (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                            مرکز: {role.tenant.title}
                          </p>
                        )}
                        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <Trash2 className="h-4 w-4 ml-1" />
                            حذف
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            onClick={() => handleEditRole(role)}
                          >
                            <Edit className="h-4 w-4 ml-1" />
                            ویرایش
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {!loading && roles.length > 0 && (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="hidden sm:inline">نمایش {pagination.current_page} از {pagination.last_page} صفحه</span>
                    <span className="hidden sm:inline mx-2">|</span>
                    نمایش {pagination.from} تا {pagination.to} از {pagination.total} نقش
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.current_page === 1}
                      className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      اولین
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page === 1}
                      className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.last_page}
                      className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.last_page)}
                      disabled={pagination.current_page === pagination.last_page}
                      className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      آخرین
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={roleToEdit !== null} onOpenChange={(open: boolean) => !open && setRoleToEdit(null)}>
          <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">ویرایش نقش</DialogTitle>
            </DialogHeader>
            <RoleForm
              role={roleToEdit}
              permissions={permissions}
              onSuccess={() => {
                setRoleToEdit(null);
                fetchRoles();
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={roleToDelete !== null} onOpenChange={(open: boolean) => !open && setRoleToDelete(null)}>
          <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">تایید حذف نقش</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-zinc-600 dark:text-zinc-400">آیا از حذف این نقش اطمینان دارید؟</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRoleToDelete(null)}
                className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                انصراف
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
              >
                حذف
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
} 