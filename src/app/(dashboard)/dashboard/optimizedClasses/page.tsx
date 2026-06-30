"use client";

import * as React from "react";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Clock3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/context/auth.context";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageTransition } from "@/components/ui/page-transition";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  optimizedClassService,
  OptimizedClass,
} from "@/lib/services/optimizedClass.service";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/constants";
import { Checkbox } from "@/components/ui/checkbox";

interface Student {
  student: {
    id: number;
    name: string;
    father_name: string;
    student_code: string;
    phone: string;
    parent_phone: string;
  };
  grades: Grade[];
}

interface Grade {
  id: number;
  hefz: number;
  details: number;
  tajvid: number;
  sout: number;
  number: number | null;
  practice_count: number | null;
  description: string | null;
  master_teacher: string | null;
  droos_id: Dars;
  dars: Dars;
  lesson_area: LessonArea;
  created_at: string;
}

interface Dars {
  id: number;
  title: string;
  is_one_grade?: boolean | number | string;
}

interface LessonArea {
  id: number;
  start_surah: { id: number; title: string; titleAr: string } | null;
  start_verse: number | null;
  end_surah: { id: number; title: string; titleAr: string } | null;
  end_verse: number | null;
  start_page: number | null;
  end_page: number | null;
  start_joze: number | null;
  end_joze: number | null;
}

interface ErrorResponse {
  response?: {
    data?: unknown;
    status?: number;
    statusText?: string;
  };
}

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

export default function OptimizedClassesPage() {
  const { accessToken } = useAuth();
  const [classes, setClasses] = React.useState<OptimizedClass[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState({
    page: 1,
    per_page: 10,
  });
  const [pagination, setPagination] = React.useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
    from: 0,
    to: 0,
  });
  const [searchInput, setSearchInput] = React.useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [classToDelete, setClassToDelete] = React.useState<number | null>(null);
  const [isClientSidePagination, setIsClientSidePagination] = React.useState(false);
  const [showStudentsModal, setShowStudentsModal] = React.useState(false);
  const [selectedClassMasterName, setSelectedClassMasterName] = React.useState<string | null>(null);
  const [selectedClassStudents, setSelectedClassStudents] = React.useState<Student[]>([]);
  const [fetchingStudents, setFetchingStudents] = React.useState(false);
  const [allStudentsData, setAllStudentsData] = React.useState<Map<number, Student[]>>(new Map());
  const [selectedClassIds, setSelectedClassIds] = React.useState<number[]>([]);
  const [scheduleDialogOpen, setScheduleDialogOpen] = React.useState(false);
  const [scheduleSubmitting, setScheduleSubmitting] = React.useState(false);
  const [scheduleTargetIds, setScheduleTargetIds] = React.useState<number[]>([]);
  const [scheduleForm, setScheduleForm] = React.useState({
    start_time: "",
    end_time: "",
  });

  // Reference to track if a search is already in progress
  const searchInProgress = React.useRef(false);

  const router = useRouter();

  const visibleClasses = React.useMemo(() => {
    const classList = Array.isArray(classes) ? classes : [];

    if (!isClientSidePagination) {
      return classList;
    }

    return classList.slice(
      (filters.page - 1) * filters.per_page,
      filters.page * filters.per_page
    );
  }, [classes, filters.page, filters.per_page, isClientSidePagination]);

  const allVisibleSelected =
    visibleClasses.length > 0 &&
    visibleClasses.every((classItem) => selectedClassIds.includes(classItem.id));

  const fetchClasses = React.useCallback(
    async (searchTerm?: string) => {
      if (!accessToken) {
        console.log('No access token available');
        return;
      }
      if (searchInProgress.current) return;

      try {
        searchInProgress.current = true;
        setLoading(true);

        const searchQuery =
          searchTerm !== undefined ? searchTerm : debouncedSearch;
        console.log('Search query:', searchQuery);
        console.log('Access token exists:', !!accessToken);
        console.log('API URL:', API_URL);

        try {
          // Try paginated API first
          const response = await optimizedClassService.getAll(accessToken, {
            page: filters.page,
            per_page: filters.per_page,
            search: searchQuery || undefined,
          });

          console.log('Paginated API Response:', response);
          console.log('Response type:', typeof response);
          console.log('Response keys:', Object.keys(response || {}));

          // Handle the response structure similar to students page
          if (response && response.data) {
            setClasses(Array.isArray(response.data.data) ? response.data.data : []);
            setIsClientSidePagination(false);
            
            // Use the pagination data from response.data (not response.meta)
            if (response.data.current_page !== undefined) {
              setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                per_page: response.data.per_page,
                from: response.data.from,
                to: response.data.to,
              });
            }
          } else {
            console.error('Invalid paginated API response structure:', response);
            throw new Error('Invalid response structure');
          }
        } catch (paginationError) {
          console.log('Paginated API failed, falling back to simple API:', paginationError);
          
          // Fallback to simple API and implement client-side pagination
          const response = await optimizedClassService.getAllSimple(accessToken);
          console.log('Simple API Response:', response);
          console.log('Simple response type:', typeof response);
          console.log('Simple response is array:', Array.isArray(response));
          
          if (!Array.isArray(response)) {
            console.error('Simple API response is not an array:', response);
            setClasses([]);
            return;
          }

          // Filter classes based on search query
          let filteredClasses = response;
          if (searchQuery && searchQuery.trim()) {
            filteredClasses = response.filter((classItem) => {
              const searchLower = searchQuery.toLowerCase();
              
              // Search in students names
              const studentMatch = classItem.optimized_class_items?.some((item) =>
                item.student && (
                  item.student.name.toLowerCase().includes(searchLower) ||
                  item.student.father_name.toLowerCase().includes(searchLower)
                )
              );
              
              // Search in master name
              const masterMatch = classItem.optimized_class_masters?.[0]?.master?.fullname
                ?.toLowerCase().includes(searchLower);
              
              // Search in status
              const statusMatch = (classItem.status ? "فعال" : "غیرفعال")
                .includes(searchQuery);
              
              return studentMatch || masterMatch || statusMatch;
            });
          }

          console.log('Filtered classes:', filteredClasses);
          console.log('Filtered classes length:', filteredClasses.length);
          setClasses(filteredClasses);
          setIsClientSidePagination(true);
          
          // Calculate pagination for filtered results
          const total = filteredClasses.length;
          const lastPage = Math.ceil(total / filters.per_page);
          setPagination({
            current_page: filters.page,
            last_page: lastPage,
            total,
            per_page: filters.per_page,
            from: total > 0 ? (filters.page - 1) * filters.per_page + 1 : 0,
            to: Math.min(filters.page * filters.per_page, total),
          });
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          response: (error as ErrorResponse)?.response
        });
        toast.error("خطا در بارگذاری کلاس‌ها");
        setClasses([]);
      } finally {
        setLoading(false);
        searchInProgress.current = false;
      }
    },
    [accessToken, filters.page, filters.per_page, debouncedSearch]
  );

  // Effect to handle page and per_page changes
  React.useEffect(() => {
    if (!searchInProgress.current) {
      fetchClasses();
    }
  }, [filters.page, filters.per_page, fetchClasses]);

  // Effect to handle debounced search changes
  React.useEffect(() => {
    if (filters.page !== 1) {
      setFilters((prev) => ({ ...prev, page: 1 }));
    } else {
      fetchClasses();
    }
  }, [debouncedSearch, fetchClasses, filters.page]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleDeleteClass = async (id: number) => {
    setClassToDelete(id);
  };

  const confirmDelete = async () => {
    if (!accessToken || !classToDelete) return;

    try {
      await optimizedClassService.delete(classToDelete, accessToken);
      toast.success("کلاس با موفقیت حذف شد");
      fetchClasses();
    } catch (error) {
      toast.error("خطا در حذف کلاس");
      console.error(error);
    } finally {
      setClassToDelete(null);
    }
  };

  const handleSearch = () => {
    if (filters.page !== 1) {
      setFilters((prev) => ({ ...prev, page: 1 }));
    } else {
      fetchClasses(searchInput);
    }
  };

  const formatTime = React.useCallback((value?: string | null) => {
    if (!value) {
      return "ثبت نشده";
    }

    return value.slice(0, 5);
  }, []);

  const toggleClassSelection = (classId: number, checked: boolean) => {
    setSelectedClassIds((prev) =>
      checked ? Array.from(new Set([...prev, classId])) : prev.filter((id) => id !== classId)
    );
  };

  const toggleVisibleSelection = (checked: boolean) => {
    const visibleIds = visibleClasses.map((classItem) => classItem.id);

    setSelectedClassIds((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, ...visibleIds]));
      }

      return prev.filter((id) => !visibleIds.includes(id));
    });
  };

  const openScheduleDialog = (targetIds: number[], initialValues?: { start_time?: string | null; end_time?: string | null }) => {
    setScheduleTargetIds(targetIds);
    setScheduleForm({
      start_time: initialValues?.start_time || "",
      end_time: initialValues?.end_time || "",
    });
    setScheduleDialogOpen(true);
  };

  const handleBulkScheduleUpdate = async () => {
    if (!accessToken || scheduleTargetIds.length === 0) return;

    if (!scheduleForm.start_time && !scheduleForm.end_time) {
      toast.error("حداقل یکی از زمان‌ها را وارد کنید");
      return;
    }

    try {
      setScheduleSubmitting(true);
      await optimizedClassService.bulkUpdateSchedule(
        scheduleTargetIds,
        {
          start_time: scheduleForm.start_time || undefined,
          end_time: scheduleForm.end_time || undefined,
        },
        accessToken
      );
      toast.success("زمان کلاس‌ها با موفقیت بروزرسانی شد");
      setScheduleDialogOpen(false);
      setSelectedClassIds([]);
      await fetchClasses();
    } catch (error) {
      toast.error("خطا در بروزرسانی زمان کلاس‌ها");
      console.error(error);
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const getStudentsData = React.useCallback(async (classId: number): Promise<Student[]> => {
    if (!accessToken) {
      console.log('No access token available for getStudentsData');
      return [];
    }
    const today = new Date().toISOString().split('T')[0];
    try {
      const response = await optimizedClassService.getStudents(classId, today, accessToken);
      if (response && response.data && typeof response.data === 'object' && response.data !== null) {
        return Object.values(response.data) as Student[];
      } else {
        console.error('Invalid students API response structure for getStudentsData:', response);
        return [];
      }
    } catch (error) {
      console.error('Error fetching students for getStudentsData:', error);
      toast.error("خطا در بارگذاری قرآن آموزان");
      return [];
    }
  }, [accessToken]);

  React.useEffect(() => {
    if (classes.length > 0 && accessToken) {
      const loadAllStudents = async () => {
        const newAllStudentsData = new Map<number, Student[]>();
        const fetchPromises = classes.map(async (classItem) => {
          const students = await getStudentsData(classItem.id);
          newAllStudentsData.set(classItem.id, students);
        });
        await Promise.all(fetchPromises);
        setAllStudentsData(newAllStudentsData);
        console.log('All students pre-loaded:', newAllStudentsData);
      };
      loadAllStudents();
    }
  }, [classes, accessToken, getStudentsData]);

  React.useEffect(() => {
    const currentIds = new Set((Array.isArray(classes) ? classes : []).map((classItem) => classItem.id));
    setSelectedClassIds((prev) => prev.filter((id) => currentIds.has(id)));
  }, [classes]);

  const handleOpenStudentsModal = React.useCallback(async (classItem: OptimizedClass) => {
    setSelectedClassMasterName(classItem.optimized_class_masters?.[0]?.master?.fullname || null);
    setShowStudentsModal(true);
    const preLoadedStudents = allStudentsData.get(classItem.id);
    if (preLoadedStudents) {
      setSelectedClassStudents(preLoadedStudents);
    } else {
      // Fallback: if not pre-loaded, fetch it
      setFetchingStudents(true);
      const students = await getStudentsData(classItem.id);
      setSelectedClassStudents(students);
      setFetchingStudents(false);
    }
  }, [allStudentsData, getStudentsData]);

  return (
    <PageTransition>
      <div className="flex flex-col gap-3 sm:gap-6 w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-md border border-zinc-100 dark:border-zinc-800">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            کلاس‌ها
          </h1>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              className="border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
              onClick={() => openScheduleDialog(selectedClassIds)}
              disabled={selectedClassIds.length === 0}
            >
              <Clock3 className="ml-2 h-4 w-4" />
              ویرایش زمان گروهی
            </Button>
            <Button
              className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              onClick={() => router.push("/dashboard/optimizedClasses/add")}
            >
              <Plus className="ml-2 h-4 w-4" />
              افزودن کلاس جدید
            </Button>
          </div>
        </div>

        <Card className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-zinc-900 dark:text-zinc-100">
                لیست کلاس‌ها
              </CardTitle>
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

            {selectedClassIds.length > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                <span>{selectedClassIds.length} کلاس برای ویرایش گروهی انتخاب شده است.</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/40"
                  onClick={() => setSelectedClassIds([])}
                >
                  پاک کردن انتخاب‌ها
                </Button>
              </div>
            )}

            {/* Desktop table view */}
            <div className="relative overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 hidden md:block">
              <table className="w-full text-right text-sm">
                <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={(checked) => toggleVisibleSelection(Boolean(checked))}
                        aria-label="انتخاب همه کلاس‌های این صفحه"
                      />
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      #
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      استاد
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      نوع کلاس
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      قرآن آموزان
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      زمان
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  <AnimatePresence>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400"
                        >
                          در حال بارگذاری...
                        </td>
                      </tr>
                    ) : (Array.isArray(classes) ? classes : []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400"
                        >
                          کلاسی یافت نشد
                        </td>
                      </tr>
                    ) : (
                      visibleClasses.map((classItem, index) => (
                          <motion.tr
                            key={classItem.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                              <Checkbox
                                checked={selectedClassIds.includes(classItem.id)}
                                onCheckedChange={(checked) => toggleClassSelection(classItem.id, Boolean(checked))}
                                aria-label={`انتخاب کلاس ${classItem.id}`}
                              />
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                              {pagination.from ? pagination.from + index : (pagination.current_page - 1) * pagination.per_page + index + 1}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">
                              {classItem.optimized_class_masters?.[0]?.master
                                ?.fullname ? (
                                <Badge
                                  variant="outline"
                                  className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
                                >
                                  {
                                    classItem.optimized_class_masters[0].master
                                      .fullname
                                  }
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                                >
                                  بدون استاد
                                </Badge>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">
                              {classItem.dars?.title}
                            </td>
                            <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenStudentsModal(classItem)}
                              >
                                نمایش قرآن آموزان
                              </Button>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">
                              <div className="flex flex-col gap-1 text-xs sm:text-sm">
                                <span>شروع: {formatTime(classItem.start_time)}</span>
                                <span>پایان: {formatTime(classItem.end_time)}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                onClick={() =>
                                  openScheduleDialog([classItem.id], {
                                    start_time: classItem.start_time,
                                    end_time: classItem.end_time,
                                  })
                                }
                              >
                                <Clock3 className="h-4 w-4 ml-1" />
                                زمان
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                onClick={() => router.push(`/dashboard/optimizedClasses/edit/${classItem.id}`)}
                              >
                                <Edit className="h-4 w-4 ml-1" />
                                ویرایش
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                onClick={() => handleDeleteClass(classItem.id)}
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
                ) : (Array.isArray(classes) ? classes : []).length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    کلاسی یافت نشد
                  </div>
                ) : (
                  visibleClasses.map((classItem, index) => (
                      <motion.div
                        key={classItem.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                              کلاس #{classItem.id}
                            </h3>
                            <Checkbox
                              checked={selectedClassIds.includes(classItem.id)}
                              onCheckedChange={(checked) => toggleClassSelection(classItem.id, Boolean(checked))}
                              aria-label={`انتخاب کلاس ${classItem.id}`}
                            />
                          </div>
                          <div className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                            <p>
                              قرآن آموزان:{" "}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenStudentsModal(classItem)}
                              >
                                نمایش قرآن آموزان
                              </Button>
                            </p>
                            <p>
                              استاد:{" "}
                              {classItem.optimized_class_masters?.[0]?.master
                                ?.fullname ? (
                                <Badge
                                  variant="outline"
                                  className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
                                >
                                  {
                                    classItem.optimized_class_masters[0].master
                                      .fullname
                                  }
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                                >
                                  بدون استاد
                                </Badge>
                              )}
                            </p>
                            <p>
                              نوع کلاس:{" "}
                              {classItem.dars?.title}
                            </p>
                            <p>زمان شروع: {formatTime(classItem.start_time)}</p>
                            <p>زمان پایان: {formatTime(classItem.end_time)}</p>
                          </div>
                          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                              onClick={() =>
                                openScheduleDialog([classItem.id], {
                                  start_time: classItem.start_time,
                                  end_time: classItem.end_time,
                                })
                              }
                            >
                              <Clock3 className="h-4 w-4 ml-1" />
                              زمان
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                              onClick={() => router.push(`/dashboard/optimizedClasses/edit/${classItem.id}`)}
                            >
                              <Edit className="h-4 w-4 ml-1" />
                              ویرایش
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              onClick={() => handleDeleteClass(classItem.id)}
                            >
                              <Trash2 className="h-4 w-4 ml-1" />
                              حذف
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                )}
              </AnimatePresence>
            </div>

            {!loading && (Array.isArray(classes) ? classes : []).length > 0 && pagination.last_page > 1 && (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="hidden sm:inline">
                      نمایش صفحه {pagination.current_page} از{" "}
                      {pagination.last_page}
                    </span>
                    <span className="hidden sm:inline mx-2">|</span>
                    نمایش {pagination.from} تا {pagination.to} از{" "}
                    {pagination.total} کلاس
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
                      onClick={() =>
                        handlePageChange(pagination.current_page - 1)
                      }
                      disabled={pagination.current_page === 1}
                      className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Page number buttons */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({
                      length: Math.min(5, pagination.last_page),
                    }).map((_, i) => {
                      let pageNum;
                      if (pagination.last_page <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.current_page <= 3) {
                        pageNum = i + 1;
                      } else if (
                        pagination.current_page >=
                        pagination.last_page - 2
                      ) {
                        pageNum = pagination.last_page - 4 + i;
                      } else {
                        pageNum = pagination.current_page - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pagination.current_page === pageNum
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={
                            pagination.current_page === pageNum
                              ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                              : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          }
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
                      onClick={() =>
                        handlePageChange(pagination.current_page + 1)
                      }
                      disabled={
                        pagination.current_page === pagination.last_page
                      }
                      className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.last_page)}
                      disabled={
                        pagination.current_page === pagination.last_page
                      }
                      className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      آخرین
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    تعداد در هر صفحه:
                  </span>
                  <Select
                    value={filters.per_page?.toString()}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        page: 1,
                        per_page: parseInt(value),
                      }))
                    }
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

        <Dialog
          open={classToDelete !== null}
          onOpenChange={(open: boolean) => !open && setClassToDelete(null)}
        >
          <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">
                تایید حذف
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-zinc-600 dark:text-zinc-400">
                آیا از حذف این کلاس اطمینان دارید؟
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setClassToDelete(null)}
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

        <Dialog open={showStudentsModal} onOpenChange={setShowStudentsModal}>
          <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 text-center mx-auto dark:text-zinc-100">لیست قرآن آموزان {selectedClassMasterName ? <>کلاس <span className="text-blue-600 dark:text-blue-400 font-semibold">{selectedClassMasterName}</span></> : ''}</DialogTitle>
            </DialogHeader>
            <div className="py-4 max-h-[400px] overflow-y-auto">
              {fetchingStudents ? (
                <div className="text-center text-zinc-500 dark:text-zinc-400">در حال بارگذاری...</div>
              ) : selectedClassStudents.length === 0 ? (
                <div className="text-center text-zinc-500 dark:text-zinc-400">هیچ قرآن آموزی در این کلاس وجود ندارد</div>
              ) : (
                <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
                  {selectedClassStudents.map((studentData, index) => (
                    <li key={`${studentData.student.id}-${index}`} className="border-b last:border-b-0 pb-2">
                      {studentData.student.name} ({studentData.student.father_name})
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowStudentsModal(false)} className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800">
                بستن
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">
                {scheduleTargetIds.length > 1 ? "ویرایش گروهی زمان کلاس‌ها" : "تنظیم زمان کلاس"}
              </DialogTitle>
              <DialogDescription className="text-right">
                زمان شروع و پایان را مشخص کنید. اگر یکی از فیلدها را خالی بگذارید، همان مقدار قبلی حفظ می‌شود.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  زمان شروع
                </label>
                <input
                  type="time"
                  value={scheduleForm.start_time}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      start_time: e.target.value,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  زمان پایان
                </label>
                <input
                  type="time"
                  value={scheduleForm.end_time}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      end_time: e.target.value,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>{scheduleTargetIds.length} کلاس انتخاب شده</span>
              <button
                type="button"
                className="text-blue-600 hover:underline dark:text-blue-400"
                onClick={() => setScheduleForm({ start_time: "", end_time: "" })}
              >
                پاک کردن فیلدها
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setScheduleDialogOpen(false)}
                className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                انصراف
              </Button>
              <Button
                onClick={handleBulkScheduleUpdate}
                disabled={scheduleSubmitting}
                className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {scheduleSubmitting ? "در حال ذخیره..." : "ذخیره زمان"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
