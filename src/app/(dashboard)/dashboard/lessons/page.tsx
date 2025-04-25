"use client";

import * as React from "react";
import { Plus, Search, ChevronLeft, ChevronRight, Sun, Moon, Edit, Trash2, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/context/auth.context";
import { useTheme } from "@/lib/context/theme.context";
import { LessonService, Lesson, LessonFilters, LessonResponse, PaginationResponse } from "@/lib/services/lesson.service";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LessonForm } from "./lesson-form";
import { PageTransition } from "@/components/ui/page-transition";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LessonsPage() {
  const { accessToken } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<LessonFilters>({
    page: 1,
    per_page: 10,
    parent_id: null,
  });
  const [pagination, setPagination] = React.useState<PaginationResponse>({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
    from: 0,
    to: 0,
  });
  const [search, setSearch] = React.useState("");
  const [isAddLessonOpen, setIsAddLessonOpen] = React.useState(false);
  const [lessonToDelete, setLessonToDelete] = React.useState<number | null>(null);
  const [lessonToEdit, setLessonToEdit] = React.useState<Lesson | null>(null);
  const [currentParent, setCurrentParent] = React.useState<Lesson | null>(null);
  const [navigationPath, setNavigationPath] = React.useState<Lesson[]>([]);

  const fetchLessons = React.useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      if (filters.parent_id !== null && navigationPath.length > 0) {
        setLoading(false);
        return;
      }

      const response = await LessonService.getLessons(
        {
          page: filters.page,
          per_page: filters.per_page,
          search: search || undefined,
          parent_id: filters.parent_id !== undefined ? filters.parent_id : null,
        },
        accessToken
      );
      setLessons(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      toast.error("خطا در دریافت لیست دروس");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters.page, filters.per_page, filters.parent_id, search, navigationPath]);

  React.useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // Apply search with debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.page !== 1) {
        setFilters(prev => ({ ...prev, page: 1 }));
      } else {
        if (filters.parent_id !== null) {
          const searchInChildren = async () => {
            try {
              setLoading(true);
              const response = await LessonService.getLessons(
                {
                  page: 1,
                  per_page: filters.per_page,
                  search: search || undefined,
                  parent_id: filters.parent_id,
                },
                accessToken!
              );
              setLessons(response.data || []);
              if (response.pagination) {
                setPagination(response.pagination);
              }
            } catch (error) {
              toast.error("خطا در جستجوی زیردرس‌ها");
              console.error(error);
            } finally {
              setLoading(false);
            }
          };
          
          searchInChildren();
        } else {
          fetchLessons();
        }
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [search, filters.parent_id, filters.per_page, accessToken]);

  const fetchLessonById = React.useCallback(async (id: number) => {
    if (!accessToken) return null;

    try {
      const response = await LessonService.getLessonById(id, accessToken);
      return response.data;
    } catch (error) {
      toast.error("خطا در دریافت اطلاعات درس");
      console.error(error);
      return null;
    }
  }, [accessToken]);

  const handleNavigateToParent = React.useCallback(async (parentId: number | null) => {
    try {
      setLoading(true);
      if (parentId === null) {
        setFilters(prev => {
          const newFilters = { ...prev, parent_id: null, page: 1 };
          return newFilters;
        });
        setCurrentParent(null);
        setNavigationPath([]);
        
        // بارگذاری مستقیم دروس اصلی
        const response = await LessonService.getLessonsByParent(null, accessToken!);
        setLessons(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
        return;
      }

      const parentLesson = await fetchLessonById(parentId);
      if (parentLesson) {
        setFilters(prev => {
          const newFilters = { ...prev, parent_id: parentId, page: 1 };
          return newFilters;
        });
        setCurrentParent(parentLesson);

        // Update navigation path
        let newPath = [...navigationPath];
        const existingIndex = newPath.findIndex(item => item.id === parentLesson.id);
        
        if (existingIndex >= 0) {
          // If already in path, trim the path up to this point
          newPath = newPath.slice(0, existingIndex + 1);
        } else {
          // Add to path
          newPath.push(parentLesson);
        }
        
        setNavigationPath(newPath);
        
        // بارگذاری مستقیم زیردرس‌ها
        const response = await LessonService.getLessonsByParent(parentId, accessToken!);
        setLessons(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (error) {
      toast.error("خطا در دریافت اطلاعات زیردرس‌ها");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [fetchLessonById, navigationPath, accessToken]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleDeleteLesson = async (id: number) => {
    setLessonToDelete(id);
  };

  const confirmDelete = async () => {
    if (!accessToken || !lessonToDelete) return;

    try {
      await LessonService.deleteLesson(lessonToDelete, accessToken);
      toast.success("درس با موفقیت حذف شد");
      fetchLessons();
    } catch (error) {
      toast.error("خطا در حذف درس");
      console.error(error);
    } finally {
      setLessonToDelete(null);
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setLessonToEdit(lesson);
  };

  const handleViewChildren = React.useCallback((lesson: Lesson) => {
    handleNavigateToParent(lesson.id);
  }, [handleNavigateToParent]);

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg bg-white dark:bg-zinc-900 p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">مدیریت دروس</h1>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-zinc-900 hover:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-200"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Dialog open={isAddLessonOpen} onOpenChange={setIsAddLessonOpen}>
              <DialogTrigger asChild>
                <Button className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                  <Plus className="ml-2 h-4 w-4" />
                  افزودن درس
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-zinc-900 dark:text-zinc-100">افزودن درس جدید</DialogTitle>
                </DialogHeader>
                <LessonForm
                  parentId={filters.parent_id}
                  onSuccess={() => {
                    setIsAddLessonOpen(false);
                    fetchLessons();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-zinc-900 dark:text-zinc-100">لیست دروس</CardTitle>
              
              {/* Navigation path / breadcrumb */}
              {navigationPath.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleNavigateToParent(null)}
                    className="p-0 h-auto text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    دروس اصلی
                  </Button>
                  {navigationPath.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <span>/</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleNavigateToParent(item.id)}
                        className={`p-0 h-auto ${
                          index === navigationPath.length - 1 
                            ? "font-medium text-zinc-900 dark:text-zinc-100" 
                            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                        }`}
                      >
                        {item.title}
                      </Button>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
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
              <Button 
                variant="outline" 
                size="default"
                onClick={() => {
                  if (filters.page !== 1) {
                    setFilters(prev => ({ ...prev, page: 1 }));
                  } else {
                    fetchLessons();
                  }
                }}
                className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                جستجو
              </Button>
            </div>

            {/* Desktop table view */}
            <div className="relative overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 hidden md:block">
              <table className="w-full text-right text-sm">
                <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">#</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">عنوان</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">نوع</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">مرکز</th>
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
                    ) : lessons.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400">
                          هیچ درسی یافت نشد
                        </td>
                      </tr>
                    ) : (
                      lessons.map((lesson, index) => (
                        <motion.tr
                          key={lesson.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                            {pagination.from ? pagination.from + index : index + 1}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{lesson.title}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {lesson.children && lesson.children.length > 0 ? (
                              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                سرفصل
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300">
                                درس
                              </Badge>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{lesson.tenant?.title}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                              onClick={() => handleViewChildren(lesson)}
                            >
                              <FolderTree className="h-4 w-4 ml-1" />
                              زیردرس‌ها
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                              onClick={() => handleEditLesson(lesson)}
                            >
                              <Edit className="h-4 w-4 ml-1" />
                              ویرایش
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              onClick={() => handleDeleteLesson(lesson.id)}
                            >
                              <Trash2 className="h-4 w-4 ml-1" />
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
                ) : lessons.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    هیچ درسی یافت نشد
                  </div>
                ) : (
                  lessons.map((lesson, index) => (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{lesson.title}</h3>
                          {lesson.children && lesson.children.length > 0 ? (
                            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              سرفصل
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300">
                              درس
                            </Badge>
                          )}
                        </div>
                        {lesson.tenant?.title && (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                            مرکز: {lesson.tenant.title}
                          </p>
                        )}
                        {lesson.description && (
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                            {lesson.description}
                          </p>
                        )}
                        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            onClick={() => handleViewChildren(lesson)}
                          >
                            <FolderTree className="h-4 w-4 ml-1" />
                            زیردرس‌ها
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            onClick={() => handleDeleteLesson(lesson.id)}
                          >
                            <Trash2 className="h-4 w-4 ml-1" />
                            حذف
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            onClick={() => handleEditLesson(lesson)}
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

            {!loading && lessons.length > 0 && pagination.last_page > 1 && (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="hidden sm:inline">نمایش {pagination.current_page} از {pagination.last_page} صفحه</span>
                    <span className="hidden sm:inline mx-2">|</span>
                    نمایش {pagination.from} تا {pagination.to} از {pagination.total} درس
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
                  
                  {/* Page number buttons */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.last_page) }).map((_, i) => {
                      let pageNum;
                      if (pagination.last_page <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.current_page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.current_page >= pagination.last_page - 2) {
                        pageNum = pagination.last_page - 4 + i;
                      } else {
                        pageNum = pagination.current_page - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.current_page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={pagination.current_page === pageNum 
                            ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200" 
                            : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"}
                        >
                          {pageNum}
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
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">تعداد در صفحه:</span>
                  <Select 
                    value={filters.per_page?.toString()} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, page: 1, per_page: parseInt(value) }))}
                  >
                    <SelectTrigger className="w-20 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900">
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={lessonToEdit !== null} onOpenChange={(open: boolean) => !open && setLessonToEdit(null)}>
          <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">ویرایش درس</DialogTitle>
            </DialogHeader>
            <LessonForm
              lesson={lessonToEdit || undefined}
              onSuccess={() => {
                setLessonToEdit(null);
                fetchLessons();
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={lessonToDelete !== null} onOpenChange={(open: boolean) => !open && setLessonToDelete(null)}>
          <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">تایید حذف درس</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-zinc-600 dark:text-zinc-400">آیا از حذف این درس اطمینان دارید؟</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setLessonToDelete(null)}
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