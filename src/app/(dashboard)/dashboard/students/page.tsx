/* eslint-disable */
"use client";

import * as React from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Printer,
  Eye,
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
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useApiList } from "@/lib/hooks/useApi";

// Component that uses useSearchParams - needs to be wrapped in Suspense
function StudentsPageContent() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get initial page from URL params or default to 1
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  
  const [selectedStudents, setSelectedStudents] = React.useState<Set<number>>(new Set());
  const [page, setPage] = React.useState(initialPage);
  const [perPage, setPerPage] = React.useState(10);
  const [searchInput, setSearchInput] = React.useState("");
  const [studentToDelete, setStudentToDelete] = React.useState<number | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<
    "انتقالی" | "فارغ التحصیل" | "در حال تحصیل" | "ترک تحصیل" | "اخراجی" | undefined
  >(undefined);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [isViewStudentOpen, setIsViewStudentOpen] = React.useState(false);

  const debouncedSearch = useDebounce(searchInput, 500);

  const { items: students, pagination, isLoading: loading, mutate } = useApiList(
    '/api/students',
    {
      page,
      per_page: perPage,
      search: debouncedSearch || undefined,
      status: statusFilter,
      with: 'tenant',
    },
  );

  // Sync page state with URL params
  React.useEffect(() => {
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    if (currentPage !== page) {
      setPage(currentPage);
    }
  }, [searchParams, page]);

  // Reset to page 1 when search or filter changes
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  // Check if all students on current page are selected
  const allSelected = students.length > 0 && students.every((student: Student) => selectedStudents.has(student.id));
  
  // Check if some students are selected (for indeterminate state)
  const someSelected = students.some((student: Student) => selectedStudents.has(student.id)) && !allSelected;

  const handlePageChange = (page: number) => {
    setPage(page);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.replace(`/dashboard/students?${params.toString()}`);
  };

  const handleDeleteStudent = async (id: number) => {
    setStudentToDelete(id);
  };

  const confirmDelete = async () => {
    if (!accessToken || !studentToDelete) return;

    try {
      await StudentService.deleteStudent(studentToDelete, accessToken);
      toast.success("قرآن آموز با موفقیت حذف شد");
      mutate();
    } catch (error) {
      toast.error("خطا در حذف قرآن آموز");
    } finally {
      setStudentToDelete(null);
    }
  };

  const handleEditStudent = (student: Student) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    router.push(`/dashboard/students/edit/${student.id}?returnPage=${page}`);
  };

  const handleViewStudentDetails = (student: Student) => {
    setSelectedStudent(student);
    setIsViewStudentOpen(true);
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
      students.forEach((student: Student) => newSelected.add(student.id));
    } else {
      students.forEach((student: Student) => newSelected.delete(student.id));
    }
    setSelectedStudents(newSelected);
  };

  // Print selected students
  const handlePrintSelected = () => {
    if (selectedStudents.size === 0) {
      toast.error("لطفاً حداقل یک قرآن آموز را انتخاب کنید");
      return;
    }

    const selectedStudentsList = students.filter((student: Student) => selectedStudents.has(student.id));
    
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
            ${selectedStudentsList.map((student: Student, index: number) => `
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
      <div className="flex flex-col gap-3 sm:gap-6 w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-md border border-zinc-100 dark:border-zinc-800">
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

        <Card className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">
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
                      عکس
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
                  <AnimatePresence>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400"
                        >
                          در حال بارگذاری...
                        </td>
                      </tr>
                    ) : !Array.isArray(students) || students.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400"
                        >
                          هیچ قرآن آموزی یافت نشد
                        </td>
                      </tr>
                    ) : (
                      students.map((student: Student, index: number) => (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 cursor-pointer"
                          onClick={() => handleViewStudentDetails(student)}
                        >
                          <td className="whitespace-nowrap px-4 py-3">
                            <div onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedStudents.has(student.id)}
                                onCheckedChange={(checked) => handleStudentSelect(student.id, checked as boolean)}
                                className="border-zinc-300 dark:border-zinc-600"
                              />
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                            {pagination.from
                              ? pagination.from + index
                              : index + 1}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center justify-center">
                              {student.Aks ? (
                                <Image
                                   src={student.Aks.startsWith('http') 
                                     ? student.Aks 
                                     : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${student.Aks.startsWith('storage/') ? student.Aks : `storage/${student.Aks}`}`}
                                   alt={`${student.Fname} ${student.Lname}`}
                                   width={40}
                                   height={40}
                                   className="rounded-full object-cover h-10 w-10 border-2 border-zinc-200 dark:border-zinc-700"
                                   style={{ borderRadius: '50%' }}
                                   onError={(e) => {
                                     const target = e.target as HTMLImageElement;
                                     target.style.display = 'none';
                                   }}
                                 />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                                  {student.Fname?.charAt(0)}{student.Lname?.charAt(0)}
                                </div>
                              )}
                            </div>
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
                            <div onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                onClick={() => handleViewStudentDetails(student)}
                              >
                                <Eye className="h-4 w-4 ml-1" />
                                مشاهده
                              </Button>
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
                ) : !Array.isArray(students) || students.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    هیچ قرآن آموزی یافت نشد
                  </div>
                ) : (
                  students.map((student: Student, index: number) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleViewStudentDetails(student)}
                    >
                      <div className="p-3 sm:p-4">
                        {/* Header with checkbox and status */}
                        <div className="flex items-center justify-between mb-3">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedStudents.has(student.id)}
                              onCheckedChange={(checked) => handleStudentSelect(student.id, checked as boolean)}
                              className="border-zinc-300 dark:border-zinc-600"
                            />
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

                        {/* Main content with image and info */}
                        <div className="flex items-center gap-3 mb-3">
                          {/* Student Image */}
                          <div className="flex-shrink-0">
                            {student.Aks ? (
                              <Image
                                 src={student.Aks.startsWith('http') 
                                   ? student.Aks 
                                   : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${student.Aks.startsWith('storage/') ? student.Aks : `storage/${student.Aks}`}`}
                                 alt={`${student.Fname} ${student.Lname}`}
                                 width={50}
                                 height={50}
                                 className="rounded-full object-cover w-12 h-12 sm:w-14 sm:h-14 border-2 border-zinc-200 dark:border-zinc-700"
                                 onError={(e) => {
                                   const target = e.target as HTMLImageElement;
                                   target.style.display = 'none';
                                 }}
                               />
                            ) : (
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                                {student.Fname?.charAt(0)}{student.Lname?.charAt(0)}
                              </div>
                            )}
                          </div>

                          {/* Student Name and Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 truncate">
                              {student.Fname} {student.Lname}
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                              نام پدر: {student.FatherName}
                            </p>
                            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-500 truncate">
                              کد ملی: {student.Mellicode}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap justify-end gap-1 sm:gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <div onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 text-xs sm:text-sm px-2 sm:px-3"
                                onClick={() => handleViewStudentDetails(student)}
                              >
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                                <span className="hidden xs:inline">مشاهده</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 text-xs sm:text-sm px-2 sm:px-3"
                                onClick={() => handleEditStudent(student)}
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                                <span className="hidden xs:inline">ویرایش</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 text-xs sm:text-sm px-2 sm:px-3"
                                onClick={() => handleDeleteStudent(student.id)}
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                                <span className="hidden xs:inline">حذف</span>
                              </Button>
                            </div>
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
                    value={perPage.toString()}
                    onValueChange={(value) => {
                      setPerPage(parseInt(value))
                      setPage(1)
                    }}
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
          <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md p-2">
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

        <Dialog open={isViewStudentOpen} onOpenChange={(open: boolean) => {
          if (!open) {
            setSelectedStudent(null);
          }
          setIsViewStudentOpen(open);
        }}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 mx-2 sm:mx-auto">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 text-right">
                جزئیات قرآن آموز
              </DialogTitle>
            </DialogHeader>
            
            {selectedStudent && (
              <div className="space-y-4 sm:space-y-6">
                {/* Student Image and Basic Info */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="flex-shrink-0">
                    {selectedStudent.Aks ? (
                      <Image
                        src={selectedStudent.Aks.startsWith('http') 
                          ? selectedStudent.Aks 
                          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${selectedStudent.Aks.startsWith('storage/') ? selectedStudent.Aks : `storage/${selectedStudent.Aks}`}`}
                        alt={`${selectedStudent.Fname} ${selectedStudent.Lname}`}
                        width={80}
                        height={80}
                        className="rounded-full object-cover h-16 w-16 sm:h-20 sm:w-20 border-4 border-white dark:border-zinc-700"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-lg sm:text-2xl font-bold">
                        {selectedStudent.Fname?.charAt(0)}{selectedStudent.Lname?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-right">
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {selectedStudent.Fname} {selectedStudent.Lname}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      کد ملی: {selectedStudent.Mellicode}
                    </p>
                    <div className="mt-2">
                      <Badge className={
                        selectedStudent.status === "در حال تحصیل"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : selectedStudent.status === "فارغ التحصیل"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : selectedStudent.status === "ترک تحصیل"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          : selectedStudent.status === "انتقالی"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                      }>
                        {selectedStudent.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Student Details Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">نام:</label>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 p-2 sm:p-3 rounded">
                      {selectedStudent.Fname || '-'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">نام خانوادگی:</label>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 p-2 sm:p-3 rounded">
                      {selectedStudent.Lname || '-'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">نام پدر:</label>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 p-2 sm:p-3 rounded">
                      {selectedStudent.FatherName || '-'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">کد ملی:</label>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 p-2 sm:p-3 rounded">
                      {selectedStudent.Mellicode || '-'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">شماره موبایل:</label>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 p-2 sm:p-3 rounded">
                      {selectedStudent.Phone || '-'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">تلفن والدین:</label>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 p-2 sm:p-3 rounded">
                      {selectedStudent.ParentPhone || '-'}
                    </p>
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">تحصیلات:</label>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 p-2 sm:p-3 rounded">
                      {selectedStudent.Educating || '-'}
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <div className="flex justify-center sm:justify-end pt-3 sm:pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewStudentOpen(false)}
                    className="w-full sm:w-auto border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    بستن
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}

// Main component wrapped with Suspense
export default function StudentsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-zinc-600 dark:text-zinc-400">در حال بارگذاری...</p>
      </div>
    </div>}>
      <StudentsPageContent />
    </Suspense>
  );
}
