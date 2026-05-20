"use client";

import * as React from "react";
import { Plus, Search,Edit, Trash2, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/context/auth.context";
import { LessonService, Lesson, LessonFilters, PaginationResponse } from "@/lib/services/lesson.service";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { LessonForm } from "./lesson-form";
import { PageTransition } from "@/components/ui/page-transition";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { CustomToggle } from "@/components/ui/custom-toggle";

// Custom debounce hook
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

export default function LessonsPage() {
  const { accessToken } = useAuth();
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
  const [searchInput, setSearchInput] = React.useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [isAddLessonOpen, setIsAddLessonOpen] = React.useState(false);
  const [lessonToDelete, setLessonToDelete] = React.useState<number | null>(null);
  const [lessonToEdit, setLessonToEdit] = React.useState<Lesson | null>(null);
  const [navigationPath, setNavigationPath] = React.useState<Lesson[]>([]);
  const [isAddChildOpen, setIsAddChildOpen] = React.useState(false);
  const [availableParents, setAvailableParents] = React.useState<Lesson[]>([]);
  const [selectedParentId, setSelectedParentId] = React.useState<number | null>(null);
  const [lessonToRemoveParent, setLessonToRemoveParent] = React.useState<number | null>(null);
  
  // Reference to track if a search is already in progress
  const searchInProgress = React.useRef(false);

  const fetchLessons = React.useCallback(async (searchTerm?: string) => {
    if (!accessToken) return;

    // If a fetch is already in progress and this is not a new explicit search call, bail.
    // A new explicit search (searchTerm is provided) should be allowed to proceed.
    if (searchInProgress.current && searchTerm === undefined) { 
      return;
    }

    try {
      searchInProgress.current = true;
      setLoading(true);
      
      const currentSearchQuery = searchTerm !== undefined ? searchTerm : debouncedSearch;
      
      const response = await LessonService.getLessons(
        {
          page: filters.page,
          per_page: filters.per_page,
          search: currentSearchQuery || undefined,
          parent_id: filters.parent_id !== undefined ? filters.parent_id : null,
        },
        accessToken
      );

      if (filters.parent_id !== null) {
        // If parent_id is set, display lessons directly from the API response
        setLessons(response.data || []);
      } else {
        // Otherwise, build hierarchical lessons for top-level view
        const lessonsMap = new Map<number, Lesson>();
        response.data.forEach((lesson) => lessonsMap.set(lesson.id, { ...lesson, children: [] }));

        const hierarchicalLessons: Lesson[] = [];
        lessonsMap.forEach((lesson) => {
          if (lesson.parent_id) {
            const parent = lessonsMap.get(lesson.parent_id);
            if (parent) {
              parent.children?.push(lesson);
            }
          } else {
            hierarchicalLessons.push(lesson);
          }
        });
        setLessons(hierarchicalLessons || []);
      }
      
      if (response.pagination) {
        console.log("API Pagination Response:", response.pagination);
        setPagination(response.pagination);
      } else {
        console.log("No API Pagination, setting default:", {
          current_page: 1,
          last_page: 1,
          total: response.data?.length || 0,
          per_page: filters.per_page || 10,
          from: 1,
          to: response.data?.length || 0,
        });
        setPagination({
          current_page: 1,
          last_page: 1,
          total: response.data?.length || 0,
          per_page: filters.per_page || 10,
          from: 1,
          to: response.data?.length || 0,
        });
      }
    } catch (error) {
      toast.error("خطا در دریافت لیست دروس");
      console.error(error);
    } finally {
      setLoading(false);
      searchInProgress.current = false;
    }
  }, [accessToken, filters.page, filters.per_page, filters.parent_id, debouncedSearch]);

  React.useEffect(() => {
    fetchLessons();
  }, [filters.page, filters.per_page, filters.parent_id, debouncedSearch, fetchLessons]);

  React.useEffect(() => {
    if (debouncedSearch !== undefined) { 
      if (filters.page !== 1) {
        setFilters(prev => ({ ...prev, page: 1, search: debouncedSearch })); // Also update search in filter state if needed
      }
    }
  }, [debouncedSearch, filters.page]);

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
    if (parentId === null) {
      setFilters(prev => ({ ...prev, parent_id: null, page: 1 }));
      setNavigationPath([]);
    } else {
      try {
        const parentLesson = await fetchLessonById(parentId);
        if (parentLesson) {
          setFilters(prev => ({ ...prev, parent_id: parentId, page: 1 }));
          const newPath = [...navigationPath];
          const existingIndex = newPath.findIndex(item => item.id === parentLesson.id);
          if (existingIndex >= 0) {
            const trimmedPath = newPath.slice(0, existingIndex + 1);
            setNavigationPath(trimmedPath);
          } else {
            newPath.push(parentLesson);
          }
          setNavigationPath(newPath);
        } else {
          toast.error("اطلاعات درس والد یافت نشد.");
        }
      } catch (error) {
        toast.error("خطا در به‌روزرسانی مسیر ناوبری");
        console.error(error);
      }
    }
  }, [fetchLessonById, navigationPath]); // accessToken is a dependency of fetchLessonById, so it's implicitly handled.

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

  const handleEditLesson = async (lesson: Lesson) => {
    if (!accessToken) return;
    
    try {
      await fetchAvailableParents(lesson.id);
      
      const detailedLesson = await LessonService.getLessonById(lesson.id, accessToken);
      if (detailedLesson && detailedLesson.data) {
        console.log("درس با جزئیات کامل:", detailedLesson.data);
        setLessonToEdit(detailedLesson.data);
      } else {
        setLessonToEdit(lesson);
      }
    } catch (error) {
      console.error("خطا در دریافت اطلاعات درس:", error);
      setLessonToEdit(lesson);
    }
  };

  const handleViewChildren = React.useCallback(async (lesson: Lesson) => {
    if (!accessToken || lesson.parent_id) return;
    
    try {
      setLoading(true);
      const response = await LessonService.getRelatedLessons(lesson.id, accessToken);
      
      if (response.status && response.data) {
        setLessons(response.data); 
        
        // Update navigation path
        const newPath = [...navigationPath];
        if (!newPath.some(item => item.id === lesson.id)) {
          newPath.push(lesson);
        }
        setNavigationPath(newPath);
        
        // Update pagination if needed
        setPagination({
          current_page: 1,
          last_page: 1,
          total: response.data.length,
          per_page: filters.per_page || 10,
          from: 1,
          to: response.data.length,
        });
      } else {
        toast.error("خطا در دریافت دروس مرتبط");
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response && error.response.data && error.response.data.message === "این درس والد نمی باشد و خود زیرشاخه است.") {
        // Do nothing, as per user request to disable button instead of showing toast
      } else {
        toast.error("خطا در دریافت دروس مرتبط");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, navigationPath, filters.per_page]);

  const handleSearch = () => {
    if (filters.page !== 1) {
      setFilters(prev => ({ ...prev, page: 1 }));
    } else {
      fetchLessons(searchInput);
    }
  };

  const handleToggleOneGrade = React.useCallback(async (lesson: Lesson) => {
    if (!accessToken || !lesson.id) return;

    try {
      const response = await LessonService.toggleOneGrade(lesson.id, accessToken);
      const newValue = response?.data?.is_one_grade ?? !lesson.is_one_grade;
      setLessons((prevLessons) =>
        prevLessons.map((l) =>
          l.id === lesson.id ? { ...l, is_one_grade: newValue } : l
        )
      );
      toast.success("وضعیت تک نمره‌ای با موفقیت تغییر یافت.");
    } catch (error) {
      toast.error("خطا در تغییر وضعیت تک نمره‌ای.");
      console.error("Failed to toggle one grade:", error);
    }
  }, [accessToken]);

  // دریافت لیست دروس قابل انتساب به عنوان والد
  const fetchAvailableParents = React.useCallback(async (excludeId?: number) => {
    if (!accessToken) return;

    try {
      setLoading(true);
      // استفاده از API موجود به جای API ناموجود
      // دریافت همه دروس و فیلتر کردن آنها در سمت کلاینت
      const response = await LessonService.getLessons({ parent_id: null }, accessToken);
      
      if (response.data) {
        // فیلتر کردن دروس برای حذف درس فعلی از لیست
        const filteredLessons = response.data.filter(lesson => 
          !excludeId || lesson.id !== excludeId
        );
        setAvailableParents(filteredLessons);
      } else {
        toast.error("خطا در دریافت لیست دروس قابل انتساب");
      }
    } catch (error) {
      toast.error("خطا در دریافت لیست دروس قابل انتساب");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // حذف والد از یک درس (جدا کردن زیرشاخه)
  const handleRemoveParent = React.useCallback(async (id: number) => {
    setLessonToRemoveParent(id);
  }, []);

  // تایید حذف والد
  const confirmRemoveParent = React.useCallback(async () => {
    if (!accessToken || !lessonToRemoveParent) return;

    try {
      setLoading(true);
      await LessonService.removeParent(lessonToRemoveParent, accessToken);
      toast.success("درس با موفقیت از زیرشاخه‌ها حذف شد");
      fetchLessons(); // بروزرسانی لیست دروس
    } catch (error) {
      toast.error("خطا در حذف درس از زیرشاخه‌ها");
      console.error(error);
    } finally {
      setLoading(false);
      setLessonToRemoveParent(null);
    }
  }, [accessToken, lessonToRemoveParent, fetchLessons]);

  // اضافه کردن زیرشاخه به یک درس
  const handleAddChild = React.useCallback(async () => {
    if (!accessToken || !selectedParentId || !filters.parent_id) return;

    try {
      setLoading(true);
      await LessonService.addChild(filters.parent_id, selectedParentId, accessToken);
      toast.success("درس با موفقیت به عنوان زیرشاخه اضافه شد");
      fetchLessons(); // بروزرسانی لیست دروس
      setIsAddChildOpen(false);
      setSelectedParentId(null);
    } catch (error) {
      toast.error("خطا در اضافه کردن زیرشاخه");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedParentId, filters.parent_id, fetchLessons]);

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg bg-white dark:bg-zinc-900 p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">مدیریت دروس</h1>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Dialog open={isAddLessonOpen} onOpenChange={setIsAddLessonOpen}>
              <DialogTrigger asChild>
                <Button className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                  <Plus className="ml-2 h-4 w-4" />
                  افزودن درس
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-zinc-900 text-right mx-4 dark:text-zinc-100">افزودن درس جدید</DialogTitle>
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

            {/* دیالوگ افزودن زیرشاخه */}
            <Dialog open={isAddChildOpen} onOpenChange={(open) => {
              setIsAddChildOpen(open);
              if (open && filters.parent_id) {
                fetchAvailableParents(filters.parent_id);
              }
            }}>
              <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-zinc-900 text-right mx-4 dark:text-zinc-100">افزودن زیرشاخه جدید</DialogTitle>
                  <DialogDescription className="text-zinc-500 text-right mx-4 dark:text-zinc-400">
                    درس مورد نظر را برای افزودن به عنوان زیرشاخه انتخاب کنید
                  </DialogDescription>
                </DialogHeader>
                <div className="p-4 space-y-4">
                  <div>
                    <label htmlFor="child_id" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">انتخاب درس</label>
                    <Select
                      onValueChange={(value) => setSelectedParentId(value ? parseInt(value) : null)}
                      value={selectedParentId?.toString() || ""}
                    >
                      <SelectTrigger className="border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700">
                        <SelectValue placeholder="انتخاب درس" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                        {availableParents.map((parent) => (
                          <SelectItem key={parent.id} value={parent.id.toString()}>
                            {parent.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddChildOpen(false);
                        setSelectedParentId(null);
                      }}
                      className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      انصراف
                    </Button>
                    <Button
                      onClick={handleAddChild}
                      disabled={!selectedParentId || loading}
                      className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      {loading ? "در حال افزودن..." : "افزودن زیرشاخه"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* دیالوگ تایید حذف زیرشاخه */}
            <Dialog open={lessonToRemoveParent !== null} onOpenChange={(open) => !open && setLessonToRemoveParent(null)}>
              <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-zinc-900 text-right mx-4 dark:text-zinc-100">حذف از زیرشاخه‌ها</DialogTitle>
                  <DialogDescription className="text-zinc-500 text-right mx-4 dark:text-zinc-400">
                    آیا از حذف این درس از زیرشاخه‌ها اطمینان دارید؟ این درس به صورت مستقل در لیست دروس اصلی نمایش داده خواهد شد.
                  </DialogDescription>
                </DialogHeader>
                <div className="p-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setLessonToRemoveParent(null)}
                    className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    انصراف
                  </Button>
                  <Button
                    onClick={confirmRemoveParent}
                    className="bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                  >
                    {loading ? "در حال حذف..." : "تایید حذف"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-zinc-900 dark:text-zinc-100">لیست دروس</CardTitle>
              
              {/* Navigation path / breadcrumb */}
              <div className="flex flex-wrap items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                {navigationPath.length > 0 ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setNavigationPath([]);
                        setFilters(prev => ({ ...prev, parent_id: null, page: 1 }));
                        fetchLessons();
                      }}
                      className="h-8 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    >
                      بازگشت به همه دروس
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
                  </>
                ) : (
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">دروس اصلی</span>
                )}
              </div>
            </div>
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
            </div>

            {/* Desktop table view */}
            <div className="relative overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 hidden md:block">
              <table className="w-full text-right text-sm">
                <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">#</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">عنوان</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium"> تک نمره ای </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  <AnimatePresence>
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
                            <div className="flex items-center justify-center">
                              <CustomToggle
                                checked={!!lesson.is_one_grade}
                                onCheckedChange={() => handleToggleOneGrade(lesson)}
                              />
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {!lesson.parent_id && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className={`text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 ${lesson.parent_id ? "cursor-not-allowed" : ""}`}
                                style={{ opacity: lesson.parent_id ? 0.5 : 1, pointerEvents: lesson.parent_id ? 'none' : 'auto' }}
                                onClick={() => handleViewChildren(lesson)}
                                disabled={!!lesson.parent_id}
                                aria-disabled={!!lesson.parent_id}
                                title={lesson.parent_id ? "این درس والد نمی باشد و خود زیرشاخه است" : "مشاهده دروس مرتبط"}
                              >
                                <FolderTree className="h-4 w-4 ml-1" />
                                مشاهده دروس مرتبط 
                              </Button>
                            )}
                            {/* دکمه حذف زیرشاخه (فقط برای زیرشاخه‌ها نمایش داده می‌شود) */}
                            {filters.parent_id !== null && lesson.parent_id && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-amber-500 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                                onClick={() => handleRemoveParent(lesson.id)}
                                title="حذف از زیرشاخه‌ها"
                              >
                                <FolderTree className="h-4 w-4 ml-1" />
                                حذف از زیرشاخه‌ها
                              </Button>
                            )}
                            {/* دکمه افزودن زیرشاخه (فقط در صفحه اصلی نمایش داده می‌شود) */}
                            {filters.parent_id !== null && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-green-500 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                                onClick={() => setIsAddChildOpen(true)}
                                title="افزودن زیرشاخه جدید"
                              >
                                <Plus className="h-4 w-4 ml-1" />
                                افزودن زیرشاخه
                              </Button>
                            )}
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
              <AnimatePresence>
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
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">تک نمره:</span>
                          <CustomToggle
                            checked={!!lesson.is_one_grade}
                            onCheckedChange={() => handleToggleOneGrade(lesson)}
                          />
                        </div>
                        {lesson.description && (
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                            {lesson.description}
                          </p>
                        )}
                        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 ${
                              lesson.parent_id ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            onClick={() => handleViewChildren(lesson)}
                            disabled={lesson.parent_id ? true : false}
                            title={lesson.parent_id ? "این درس والد نمی باشد و خود زیرشاخه است" : "مشاهده دروس مرتبط"}
                          >
                            <FolderTree className="h-4 w-4 ml-1" />
                            {lesson.parent ? 'مشاهده والد ها' : 'مشاهده زیر درس ها'}
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
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={pagination.current_page === 1 ? undefined : () => handlePageChange(pagination.current_page - 1)}
                            className={pagination.current_page === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        {pagination.last_page > 1 && (
                          <>
                            {/* Always show first page */}
                            <PaginationItem>
                              <PaginationLink
                                isActive={pagination.current_page === 1}
                                onClick={() => handlePageChange(1)}
                              >
                                1
                              </PaginationLink>
                            </PaginationItem>

                            {/* Ellipsis after first page */}
                            {pagination.current_page > 3 && pagination.last_page > 5 && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}

                            {/* Page numbers around current page */}
                            {Array.from({ length: pagination.last_page })
                              .map((_, i) => i + 1)
                              .filter(
                                (pageNum) =>
                                  pageNum !== 1 &&
                                  pageNum !== pagination.last_page &&
                                  pageNum >= pagination.current_page - 1 &&
                                  pageNum <= pagination.current_page + 1
                              )
                              .map((pageNum) => (
                                <PaginationItem key={pageNum}>
                                  <PaginationLink
                                    isActive={pagination.current_page === pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                  >
                                    {pageNum}
                                  </PaginationLink>
                                </PaginationItem>
                              ))}

                            {/* Ellipsis before last page */}
                            {pagination.current_page < pagination.last_page - 2 && pagination.last_page > 5 && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}

                            {/* Always show last page */}
                            {pagination.last_page > 1 && (
                              <PaginationItem>
                                <PaginationLink
                                  isActive={pagination.current_page === pagination.last_page}
                                  onClick={() => handlePageChange(pagination.last_page)}
                                >
                                  {pagination.last_page}
                                </PaginationLink>
                              </PaginationItem>
                            )}
                          </>
                        )}
                        <PaginationItem>
                          <PaginationNext
                            onClick={pagination.current_page === pagination.last_page ? undefined : () => handlePageChange(pagination.current_page + 1)}
                            className={pagination.current_page === pagination.last_page ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
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
                  availableParents={availableParents}
                  onSuccess={() => {
                    setLessonToEdit(null);
                    fetchLessons();
                    // بعد از به‌روزرسانی موفق، صفحه را رفرش می‌کنیم تا تغییرات اعمال شوند
                    window.location.reload();
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
      {/* <Dialog open={isChildrenModalOpen} onOpenChange={setIsChildrenModalOpen}>
        <DialogContent className="sm:max-w-[450px] text-right" dir="rtl">
          <DialogHeader className="text-center">
            {clickedLesson && (
              <div className="mb-1 flex justify-center">
                <Badge variant="secondary" className="text-sm bg-green-600 text-white">
                  {clickedLesson.title}
                </Badge>
              </div>
            )}
            <DialogTitle className="text-center">
              {selectedChildren.length > 0 && selectedChildren[0].parent ? 'زیر درس ها' : 'درس والد'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {selectedChildren.length > 0 && selectedChildren[0].parent 
                ? 'زیر درس های مربوط به درس انتخاب شده.' 
                : 'درس والد مربوط به درس انتخاب شده.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-1">
            {selectedChildren.length > 0 ? (
              <Table className="text-center" dir="rtl">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">عنوان</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedChildren.map((childLesson) => (
                    <TableRow key={childLesson.id}>
                      <TableCell className="text-center">{childLesson.title}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500">
                {selectedChildren.length === 0 ? 'هیچ موردی یافت نشد.' : ' یافت نشد.'}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog> */}
    </PageTransition>
  );
}