/* eslint-disable */
"use client";

import * as React from "react";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Printer,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/context/auth.context";
import { Student, StudentService } from "@/lib/services/student.service";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
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
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function StudentsPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedStudents, setSelectedStudents] = React.useState<Set<number>>(new Set());
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
  const [studentToDelete, setStudentToDelete] = React.useState<number | null>(
    null
  );
  const [statusFilter, setStatusFilter] = React.useState<
    "انتقالی" | "فارغ التحصیل" | "در حال تحصیل" | "ترک تحصیل" | "اخراجی" | undefined
  >(undefined);

  // Reference to track if a search is already in progress
  const searchInProgress = React.useRef(false);

  // Check if all students on current page are selected
  const allSelected = students.length > 0 && students.every(student => selectedStudents.has(student.id));
  
  // Check if some students are selected (for indeterminate state)
  const someSelected = students.some(student => selectedStudents.has(student.id)) && !allSelected;

  const fetchStudents = React.useCallback(
    async (searchTerm?: string) => {
      if (!accessToken) return;
      if (searchInProgress.current) return;

      try {
        searchInProgress.current = true;
        setLoading(true);

        const searchQuery =
          searchTerm !== undefined ? searchTerm : debouncedSearch;

        const response: any = await StudentService.getStudents(
          {
            page: filters.page,
            per_page: filters.per_page,
            search: searchQuery || undefined,
            status: statusFilter,
          },
          accessToken
        );
        console.log(response);

        setStudents(
          Array.isArray(response.data?.data) ? response.data.data : []
        );
        if (response.data) {
          setPagination({
            current_page: response.data.current_page,
            last_page: response.data.last_page,
            total: response.data.total,
            per_page: response.data.per_page,
            from: response.data.from,
            to: response.data.to,
          });
        }
      } catch (error) {
        toast.error("خطا در دریافت لیست قرآن آموزان");
        console.error(error);
        setStudents([]);
      } finally {
        setLoading(false);
        searchInProgress.current = false;
      }
    },
    [accessToken, filters.page, filters.per_page, debouncedSearch, statusFilter]
  );

  // Effect to handle page and per_page changes
  React.useEffect(() => {
    if (!searchInProgress.current) {
      fetchStudents();
    }
  }, [filters.page, filters.per_page, fetchStudents]);

  // Effect to handle debounced search changes
  React.useEffect(() => {
    if (filters.page !== 1) {
      setFilters((prev) => ({ ...prev, page: 1 }));
    } else {
      fetchStudents();
    }
  }, [debouncedSearch, fetchStudents, filters.page]);

  // Effect to handle status filter changes
  React.useEffect(() => {
    if (filters.page !== 1) {
      setFilters((prev) => ({ ...prev, page: 1 }));
    } else {
      fetchStudents();
    }
  }, [statusFilter, fetchStudents, filters.page]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleDeleteStudent = async (id: number) => {
    setStudentToDelete(id);
  };

  const confirmDelete = async () => {
    if (!accessToken || !studentToDelete) return;

    try {
      await StudentService.deleteStudent(studentToDelete, accessToken);
      toast.success("قرآن آموز با موفقیت حذف شد");
      fetchStudents();
    } catch (error) {
      toast.error("خطا در حذف قرآن آموز");
      console.error(error);
    } finally {
      setStudentToDelete(null);
    }
  };

  const handleEditStudent = (student: Student) => {
    router.push(`/dashboard/students/edit/${student.id}`);
  };

  const handleSearch = () => {
    if (filters.page !== 1) {
      setFilters((prev) => ({ ...prev, page: 1 }));
    } else {
      fetchStudents(searchInput);
    }
  };

  // Handle individual student selection
  const handleStudentSelect = (studentId: number, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  // Handle select all students on current page
  const handleSelectAll = (checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      students.forEach(student => newSelected.add(student.id));
    } else {
      students.forEach(student => newSelected.delete(student.id));
    }
    setSelectedStudents(newSelected);
  };

  // Print selected students
  const handlePrintSelected = () => {
    if (selectedStudents.size === 0) {
      toast.error("لطفاً حداقل یک قرآن آموز را انتخاب کنید");
      return;
    }

    const selectedStudentsList = students.filter(student => selectedStudents.has(student.id));
    
    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>لیست قرآن آموزان انتخاب شده</title>
        <style>
          body { font-family: 'Tahoma', sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { color: #333; }
          .print-info { margin-bottom: 20px; font-size: 14px; color: #666; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>لیست قرآن آموزان انتخاب شده</h1>
          <div class="print-info">
            تاریخ چاپ: ${new Date().toLocaleDateString('fa-IR')}<br>
            تعداد: ${selectedStudentsList.length} قرآن آموز
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ردیف</th>
              <th>نام</th>
              <th>نام خانوادگی</th>
              <th>نام پدر</th>
              <th>کد ملی</th>
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            ${selectedStudentsList.map((student, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${student.Fname}</td>
                <td>${student.Lname}</td>
                <td>${student.FatherName}</td>
                <td>${student.Mellicode}</td>
                <td>${student.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()">چاپ</button>
          <button onclick="window.close()">بستن</button>
        </div>
      </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  console.log(students);

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg bg-white dark:bg-zinc-900 p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            مدیریت قرآن آموزان
          </h1>
          <div className="flex gap-2">
            {selectedStudents.size > 0 && (
              <Button
                variant="outline"
                onClick={handlePrintSelected}
                className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <Printer className="ml-2 h-4 w-4" />
                چاپ انتخاب شده ({selectedStudents.size})
              </Button>
            )}
            <Link href="/dashboard/students/add" passHref>
              <Button className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                <Plus className="ml-2 h-4 w-4" />
                افزودن قرآن آموز
              </Button>
            </Link>
          </div>
        </div>

        <Card className="border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="text-zinc-900 dark:text-zinc-100">
              لیست قرآن آموزان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
                <Input
                  placeholder="جستجو در نام، نام خانوادگی، کد ملی..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pr-9 border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
                />
              </div>
              <Select
                value={statusFilter || "all"}
                onValueChange={(value) => {
                  setStatusFilter(value === "all" ? undefined : value as "انتقالی" | "فارغ التحصیل" | "در حال تحصیل" | "ترک تحصیل" | "اخراجی");
                  setFilters((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <SelectTrigger dir="rtl" className="w-full sm:w-48 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                  <SelectValue placeholder="فیلتر وضعیت" />
                </SelectTrigger>
                <SelectContent dir="rtl" className="bg-white dark:bg-zinc-900">
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="در حال تحصیل">در حال تحصیل</SelectItem>
                  <SelectItem value="فارغ التحصیل">فارغ التحصیل</SelectItem>
                  <SelectItem value="ترک تحصیل">ترک تحصیل</SelectItem>
                  <SelectItem value="انتقالی">انتقالی</SelectItem>
                  <SelectItem value="اخراجی">اخراجی</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="default"
                onClick={handleSearch}
                className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 whitespace-nowrap"
              >
                جستجو
              </Button>
            </div>

            {/* Desktop table view */}
            <div className="relative overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 hidden md:block">
              <table className="w-full text-right text-sm">
                <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      <div className="relative">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={handleSelectAll}
                          className="border-zinc-300 dark:border-zinc-600"
                        />
                        {someSelected && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-2 h-0.5 bg-current rounded-sm" />
                          </div>
                        )}
                      </div>
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      #
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      نام
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      نام خانوادگی
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      نام پدر
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      کد ملی
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      وضعیت
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400"
                        >
                          در حال بارگذاری...
                        </td>
                      </tr>
                    ) : !Array.isArray(students) || students.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400"
                        >
                          هیچ قرآن آموزی یافت نشد
                        </td>
                      </tr>
                    ) : (
                      students.map((student, index) => (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                        >
                          <td className="whitespace-nowrap px-4 py-3">
                            <Checkbox
                              checked={selectedStudents.has(student.id)}
                              onCheckedChange={(checked) => handleStudentSelect(student.id, checked as boolean)}
                              className="border-zinc-300 dark:border-zinc-600"
                            />
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                            {pagination.from
                              ? pagination.from + index
                              : index + 1}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">
                            {student.Fname}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">
                            {student.Lname}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">
                            {student.FatherName}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">
                            {student.Mellicode}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <Badge
                              className={
                                student.status === "در حال تحصیل"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                  : student.status === "فارغ التحصیل"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              }
                            >
                              {student.status}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                              onClick={() => handleEditStudent(student)}
                            >
                              <Edit className="h-4 w-4 ml-1" />
                              ویرایش
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              onClick={() => handleDeleteStudent(student.id)}
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
                ) : !Array.isArray(students) || students.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    هیچ قرآن آموزی یافت نشد
                  </div>
                ) : (
                  students.map((student, index) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedStudents.has(student.id)}
                              onCheckedChange={(checked) => handleStudentSelect(student.id, checked as boolean)}
                              className="border-zinc-300 dark:border-zinc-600"
                            />
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {student.Fname} {student.Lname}
                            </h3>
                          </div>
                          <Badge
                            className={
                              student.status === "در حال تحصیل"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                : student.status === "فارغ التحصیل"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            }
                          >
                            {student.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                          <p>نام پدر: {student.FatherName}</p>
                          <p>کد ملی: {student.Mellicode}</p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            onClick={() => handleEditStudent(student)}
                          >
                            <Edit className="h-4 w-4 ml-1" />
                            ویرایش
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            onClick={() => handleDeleteStudent(student.id)}
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

            {!loading && students.length > 0 && pagination.last_page > 1 && (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="hidden sm:inline">
                      نمایش {pagination.current_page} از {pagination.last_page}{" "}
                      صفحه
                    </span>
                    <span className="hidden sm:inline mx-2">|</span>
                    نمایش {pagination.from} تا {pagination.to} از{" "}
                    {pagination.total} قرآن آموز
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
                    تعداد در صفحه:
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
          open={studentToDelete !== null}
          onOpenChange={(open: boolean) => !open && setStudentToDelete(null)}
        >
          <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">
                تایید حذف قرآن آموز
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-zinc-600 dark:text-zinc-400">
                آیا از حذف این قرآن آموز اطمینان دارید؟
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setStudentToDelete(null)}
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
