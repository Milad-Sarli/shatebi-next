"use client";

/* eslint-disable */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Search,  ChevronLeft, ChevronRight, Sun, Moon, Edit, Trash2, Mail, Phone, Building, Shield, User as UserIcon, Star, Crown, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/context/auth.context";
import { useTheme } from "@/lib/context/theme.context";
import { UserService, User, UserFilters } from "@/lib/services/user.service";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageTransition } from "@/components/ui/page-transition";
import { motion, AnimatePresence } from "framer-motion";
import { AppRoleService } from "@/lib/services/approle.service";

const ROLE_COLOR_MAP: Record<string, string> = {
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  master: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  superuser: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  user: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

// نقش‌ها به فارسی
const ROLE_FA_MAP: Record<string, string> = {
  admin: "مدیر",
  master: "مربی",
  storekeeper: "انباردار",
  guard: "نگهبان",
  assistant_master: "کمک مربی",
  ejraee_deputy: "معاون اجرایی",
  amoozeshi_deputy: "معاون آموزشی",
  farhangi_deputy: "معاون فرهنگی",
};

// Custom debounce hook (copy from students/page.tsx)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function UsersPage() {
  const { accessToken } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<UserFilters>({
    page: 1,
    per_page: 10,
  });
  const [pagination, setPagination] = React.useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    links: [] as Array<{ url: string | null; label: string; active: boolean }>,
  });
  const [searchInput, setSearchInput] = React.useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [selectedRole, setSelectedRole] = React.useState<string>("all");
  const [selectedTenant, setSelectedTenant] = React.useState<string>("all");
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<number | null>(null);
  const searchInProgress = React.useRef(false);
  const [attachRoleUser, setAttachRoleUser] = React.useState<User | null>(null);
  const [isAttachRoleOpen, setIsAttachRoleOpen] = React.useState(false);
  const [roleOptions, setRoleOptions] = React.useState([{ value: "all", label: "همه نقش‌ها" }]);
  const [selectedAttachRole, setSelectedAttachRole] = React.useState("");
  const [attachLoading, setAttachLoading] = React.useState(false);

  const fetchUsers = React.useCallback(
    async (searchTerm?: string) => {
      if (!accessToken) return;
      if (searchInProgress.current) return;

      try {
        searchInProgress.current = true;
        setLoading(true);

        const searchQuery = searchTerm !== undefined ? searchTerm : debouncedSearch;

        const response = await UserService.getUsers(
          {
            ...filters,
            search: searchQuery || undefined,
            role: selectedRole === "all" ? undefined : selectedRole as UserFilters["role"],
            tenant_id: selectedTenant === "all" ? undefined : parseInt(selectedTenant),
          },
          accessToken
        );
        setUsers(response.data);
        setPagination({
          current_page: response.meta.current_page,
          last_page: response.meta.last_page,
          total: response.meta.total,
          links: Object.entries(response.links).map(([key, value], index) => ({
            url: value,
            label: (index + 1).toString(),
            active: index + 1 === response.meta.current_page
          }))
        });
      } catch (error) {
        toast.error("خطا در دریافت لیست کاربران");
        console.error(error);
        setUsers([]);
      } finally {
        setLoading(false);
        searchInProgress.current = false;
      }
    },
    [accessToken, filters, debouncedSearch, selectedRole, selectedTenant]
  );

  // Effect to handle page and per_page changes
  React.useEffect(() => {
    if (!searchInProgress.current) {
      fetchUsers();
    }
  }, [filters.page, filters.per_page, fetchUsers]);

  // Effect to handle debounced search changes
  React.useEffect(() => {
    if (filters.page !== 1) {
      setFilters((prev) => ({ ...prev, page: 1 }));
    } else {
      fetchUsers();
    }
  }, [debouncedSearch, fetchUsers, filters.page]);

  const handleSearch = () => {
    if (filters.page !== 1) {
      setFilters((prev) => ({ ...prev, page: 1 }));
    } else {
      fetchUsers(searchInput);
    }
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleDeleteUser = async (id: number) => {
    setUserToDelete(id);
  };

  const confirmDelete = async () => {
    if (!accessToken || !userToDelete) return;

    try {
      await UserService.deleteUser(userToDelete, accessToken);
      toast.success("کاربر با موفقیت حذف شد");
      fetchUsers();
    } catch (error) {
      toast.error("خطا در حذف کاربر");
      console.error(error);
    } finally {
      setUserToDelete(null);
    }
  };

  const handleEditUser = (user: User) => {
    router.push(`/dashboard/users/edit/${user.id}`);
  };

  const getUserFullName = (user: User) => {
    return `${user.fname || ''} ${user.lname || ''}`.trim() || user.username;
  };

  const openAttachRoleModal = async (user: User) => {
    setAttachRoleUser(user);
    setSelectedAttachRole("");
    if (accessToken) {
      try {
        const res = await AppRoleService.getAppRoles({}, accessToken);
        // Map to { value, label, name } for Select
        const roles = res.data.map((item) => ({
          value: String(item.id),
          label: ROLE_FA_MAP[item.name] || item.name,
          name: item.name,
        }));
        setRoleOptions([{ value: "all", label: "همه نقش‌ها" }, ...roles]);
      } catch (e) {
        toast.error("خطا در دریافت نقش‌ها");
        setRoleOptions([{ value: "all", label: "همه نقش‌ها" }]);
      }
    }
    setIsAttachRoleOpen(true);
  };
  const closeAttachRoleModal = () => {
    setIsAttachRoleOpen(false);
    setAttachRoleUser(null);
    setSelectedAttachRole("");
  };
  const handleAttachRole = async () => {
    if (!accessToken || !attachRoleUser || !selectedAttachRole) return;
    setAttachLoading(true);
    try {
      // پیدا کردن role_id از روی value
      const selectedRoleObj = roleOptions.find((r) => r.value === selectedAttachRole);
      if (!selectedRoleObj) throw new Error("نقش انتخاب شده یافت نشد");
      await AppRoleService.assignRole({ user_id: attachRoleUser.id, role_id: Number(selectedRoleObj.value) }, accessToken);
      toast.success("نقش با موفقیت به کاربر اضافه شد");
      closeAttachRoleModal();
      fetchUsers();
    } catch (error) {
      toast.error("خطا در افزودن نقش به کاربر");
      console.error(error);
    } finally {
      setAttachLoading(false);
    }
  };

  const handleRemoveRoleFromUser = async (roleId: number) => {
    if (!accessToken || !attachRoleUser) return;
    setAttachLoading(true);
    try {
      await AppRoleService.removeRoleFromUser({ user_id: attachRoleUser.id, role_id: roleId }, accessToken);
      toast.success("نقش با موفقیت حذف شد");
      // آپدیت نقش‌های کاربر در مودال بدون بستن مودال:
      setAttachRoleUser((prev) => prev ? ({
        ...prev,
        app_roles: prev.app_roles ? prev.app_roles.filter((r) => r.id !== roleId) : [],
      }) : prev);
      // همچنین لیست اصلی کاربران را هم آپدیت کن
      fetchUsers();
    } catch (error) {
      toast.error("خطا در حذف نقش");
      console.error(error);
    } finally {
      setAttachLoading(false);
    }
  };

  React.useEffect(() => {
    const fetchRoles = async () => {
      if (!accessToken) return;
      try {
        const res = await AppRoleService.getAppRoles({}, accessToken);
        const roles = res.data.map((role) => ({
          value: role.name,
          label: ROLE_FA_MAP[role.name] || role.name,
        }));
        setRoleOptions([{ value: "all", label: "همه نقش‌ها" }, ...roles]);
      } catch (e) {
        toast.error("خطا در دریافت نقش‌ها");
      }
    };
    fetchRoles();
  }, [accessToken]);

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg p-4 overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 dark:from-blue-500/5 dark:via-emerald-500/5 dark:to-blue-500/5" />
          
          {/* Content */}
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
              مدیریت کاربران
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
           
            </div>
          </div>
        </div>

        <Card className="border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="text-zinc-900 dark:text-zinc-100">لیست کاربران</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
                <Input
                  placeholder="جستجو..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pr-9 border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
                />
              </div>
              <Button
                variant="outline"
                size="default"
                onClick={handleSearch}
                className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                جستجو
              </Button>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full sm:w-[180px] border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                    <SelectValue placeholder="نقش" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
        
              </div>
            </div>

            {/* Desktop table view */}
            <div className="relative overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 hidden md:block">
              <table className="w-full text-right text-sm">
                <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">#</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">نام</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">نام کاربری</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">نقش</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">مرکز</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">شماره تماس</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400">
                          در حال بارگذاری...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400">
                          هیچ کاربری یافت نشد
                        </td>
                      </tr>
                    ) : (
                      users.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                            {(pagination.current_page - 1) * (filters.per_page || 10) + index + 1}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">
                            {getUserFullName(user)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{user.username}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex flex-wrap items-center gap-1">
                              {(user.app_roles && user.app_roles.length > 0) ? (
                                user.app_roles.map((role, idx) => {
                                  const color = ROLE_COLOR_MAP[role.name] || ROLE_COLOR_MAP["user"];
                                  const faName = ROLE_FA_MAP[role.name] || role.name;
                                  return (
                                    <span key={idx} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-1 ${color}`}>
                                      {faName}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR_MAP["user"]}`}>
                                  {ROLE_FA_MAP["user"]}
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                                title="افزودن نقش"
                                onClick={() => openAttachRoleModal(user)}
                              >
                                <Link2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{user.tenant?.title}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{user.phone}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                              onClick={() => handleEditUser(user)}
                            >
                              ویرایش
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              onClick={() => handleDeleteUser(user.id)}
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
                ) : users.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    هیچ کاربری یافت نشد
                  </div>
                ) : (
                  users.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{getUserFullName(user)}</h3>
                          <div className="flex gap-1 items-center">
                            {(user.app_roles && user.app_roles.length > 0) ? (
                              user.app_roles.map((role, idx) => {
                                const color = ROLE_COLOR_MAP[role.name] || ROLE_COLOR_MAP["user"];
                                const faName = ROLE_FA_MAP[role.name] || role.name;
                                return (
                                  <span key={idx} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-1 ${color}`}>
                                    {faName}
                                  </span>
                                );
                              })
                            ) : (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR_MAP["user"]}`}>
                                {ROLE_FA_MAP["user"]}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                              title="افزودن نقش"
                              onClick={() => openAttachRoleModal(user)}
                            >
                              <Link2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
                            <Phone className="h-4 w-4 ml-2 text-zinc-400" />
                            {user.phone}
                          </div>
                          {user.email && (
                            <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
                              <Mail className="h-4 w-4 ml-2 text-zinc-400" />
                              {user.email}
                            </div>
                          )}
                          {user.tenant?.title && (
                            <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400">
                              <Building className="h-4 w-4 ml-2 text-zinc-400" />
                              {user.tenant.title}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4 ml-1" />
                            حذف
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            onClick={() => handleEditUser(user)}
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

            {!loading && users.length > 0 && (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="hidden sm:inline">نمایش {pagination.current_page} از {pagination.last_page} صفحه</span>
                    <span className="hidden sm:inline mx-2">|</span>
                    نمایش {(pagination.current_page - 1) * (filters.per_page || 10) + 1} تا {Math.min(pagination.current_page * (filters.per_page || 10), pagination.total)} از {pagination.total} کاربر
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
                  <div className="hidden sm:flex items-center gap-1">
                    {pagination.links.map((link, index) => {
                      if (link.label === "...") {
                        return (
                          <span key={index} className="px-2 text-zinc-900 dark:text-zinc-400">
                            ...
                          </span>
                        );
                      }
                      if (link.url === null) return null;
                      const page = parseInt(link.label);
                      if (isNaN(page)) return null;
                      return (
                        <Button
                          key={index}
                          variant={link.active ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className={`${
                            link.active
                              ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                              : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          }`}
                        >
                          {link.label}
                        </Button>
                      );
                    })}
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



        <Dialog open={userToDelete !== null} onOpenChange={(open: boolean) => !open && setUserToDelete(null)}>
          <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">تایید حذف کاربر</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-zinc-600 dark:text-zinc-400">آیا از حذف این کاربر اطمینان دارید؟</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setUserToDelete(null)}
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

        <Dialog open={isAttachRoleOpen} onOpenChange={(open) => { if (!open) closeAttachRoleModal(); }}>
          <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">افزودن نقش به کاربر</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-zinc-700 dark:text-zinc-200 font-medium">
                کاربر: {attachRoleUser ? getUserFullName(attachRoleUser) : ""}
              </div>
              {/* نمایش نقش‌های فعلی کاربر با دکمه حذف */}
              {attachRoleUser && attachRoleUser.app_roles && attachRoleUser.app_roles.length > 0 && (
                <div className="space-y-2">
                  <div className="font-semibold text-zinc-700 dark:text-zinc-200">نقش‌های فعلی:</div>
                  {attachRoleUser.app_roles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1 mb-1">
                      <span>{ROLE_FA_MAP[role.name] || role.name}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveRoleFromUser(role.id)}
                        className="ml-2"
                        disabled={attachLoading}
                      >
                        حذف
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Select value={selectedAttachRole} onValueChange={setSelectedAttachRole}>
                <SelectTrigger className="w-full border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                  <SelectValue placeholder="نقش را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10"
                onClick={handleAttachRole}
                disabled={attachLoading || !selectedAttachRole}
              >
                {attachLoading ? <Loader2 className="animate-spin w-4 h-4 ml-2" /> : null}
                افزودن نقش
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
} 