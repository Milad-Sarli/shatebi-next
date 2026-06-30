"use client";

import * as React from "react";
import { Search, ChevronLeft, ChevronRight, Eye, Download, CheckSquare, Square, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/context/auth.context";
import { ApplicantService, Applicant, ApplicantFilters, PaginatedResponse } from "@/lib/services/applicant.service";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageTransition } from "@/components/ui/page-transition";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns-jalali";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

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

function toJalali(date: string | undefined, showTime = true): string {
  if (!date) return '-';
  try {
    const parsed = parseISO(date);
    return showTime ? format(parsed, 'yyyy/MM/dd HH:mm') : format(parsed, 'yyyy/MM/dd');
  } catch {
    return '-';
  }
}

export default function ApplicantsPage() {
  const { accessToken } = useAuth();
  const [applicants, setApplicants] = React.useState<Applicant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<ApplicantFilters>({
    page: 1,
    per_page: 10,
    search: undefined,
  });
  const [pagination, setPagination] = React.useState<PaginatedResponse<Applicant>['meta']>({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
    from: 0,
    to: 0,
    path: '',
  });
  const [searchInput, setSearchInput] = React.useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [selectAllAcrossPages, setSelectAllAcrossPages] = React.useState(false);
  const [excludedIds, setExcludedIds] = React.useState<Set<number>>(new Set());
  const [selectedApplicant, setSelectedApplicant] = React.useState<Applicant | null>(null);
  const [isViewApplicantOpen, setIsViewApplicantOpen] = React.useState(false);

  const fetchApplicants = React.useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await ApplicantService.getApplicants(filters, accessToken);
      setApplicants(response.data || []);
      if (response.meta) {
        setPagination(response.meta);
      }
    } catch (error) {
      toast.error("خطا در دریافت لیست متقاضیان");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters, setLoading, setApplicants, setPagination]);

  React.useEffect(() => {
    setFilters(prevFilters => ({
      ...prevFilters,
      search: debouncedSearch || undefined,
      page: 1,
    }));
    setSelectAllAcrossPages(false);
    setExcludedIds(new Set());
    setSelectedIds(new Set());
  }, [debouncedSearch]);

  React.useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const isRowSelected = (id: number) => selectAllAcrossPages ? !excludedIds.has(id) : selectedIds.has(id);

  const isAllOnPageSelected = applicants.length > 0 && applicants.every(a => isRowSelected(a.id));
  const isIndeterminate = !isAllOnPageSelected && applicants.some(a => isRowSelected(a.id));

  const handleSelectAll = () => {
    if (selectAllAcrossPages) {
      const newExcluded = new Set(excludedIds);
      if (isAllOnPageSelected) {
        applicants.forEach(a => newExcluded.add(a.id));
      } else {
        applicants.forEach(a => newExcluded.delete(a.id));
      }
      setExcludedIds(newExcluded);
    } else {
      const newSet = new Set(selectedIds);
      if (isAllOnPageSelected) {
        applicants.forEach(a => newSet.delete(a.id));
      } else {
        applicants.forEach(a => newSet.add(a.id));
      }
      setSelectedIds(newSet);
    }
  };

  const handleSelectAllAcrossPages = () => {
    setSelectAllAcrossPages(true);
    setExcludedIds(new Set());
    setSelectedIds(new Set());
  };

  const handleClearSelection = () => {
    setSelectAllAcrossPages(false);
    setExcludedIds(new Set());
    setSelectedIds(new Set());
  };

  const handleSelectOne = (id: number) => {
    if (selectAllAcrossPages) {
      const newExcluded = new Set(excludedIds);
      if (newExcluded.has(id)) {
        newExcluded.delete(id);
      } else {
        newExcluded.add(id);
      }
      setExcludedIds(newExcluded);
    } else {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      setSelectedIds(newSet);
    }
  };

  const handleViewApplicantDetails = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setIsViewApplicantOpen(true);
  };
  
  const handleSearch = () => {
    setFilters(prevFilters => ({
      ...prevFilters,
      search: searchInput || undefined,
      page: 1,
    }));
  };

  const handleExportExcel = async () => {
    if (!accessToken) return;
    try {
      let blob: Blob;
      if (selectAllAcrossPages) {
        blob = await ApplicantService.exportExcel(accessToken, {
          search: filters.search,
          excludeIds: Array.from(excludedIds),
        });
      } else if (selectedIds.size > 0) {
        blob = await ApplicantService.exportExcel(accessToken, {
          ids: Array.from(selectedIds),
        });
      } else {
        blob = await ApplicantService.exportExcel(accessToken, {
          search: filters.search,
        });
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applicants-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('خروجی اکسل با موفقیت دانلود شد');
    } catch (error) {
      toast.error('خطا در دانلود خروجی اکسل');
      console.error(error);
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-3 sm:gap-6 w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-md border border-zinc-100 dark:border-zinc-800">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">مدیریت متقاضیان</h1>
        </div>

        <Card className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-zinc-900 dark:text-zinc-100">لیست متقاضیان</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
                <Input
                  placeholder="جستجو بر اساس نام، نام خانوادگی، کد ملی..."
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
              <Button
                variant="outline"
                size="default"
                onClick={handleExportExcel}
                className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <Download className="h-4 w-4 ml-1" />
                خروجی اکسل
              </Button>
            </div>

            {selectAllAcrossPages ? (
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span>همه {pagination.total} متقاضی انتخاب شد</span>
                {excludedIds.size > 0 && <span>(به جز {excludedIds.size} مورد)</span>}
                <button onClick={handleClearSelection} className="text-red-500 hover:underline">لغو انتخاب</button>
              </div>
            ) : selectedIds.size > 0 ? (
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span>{selectedIds.size} متقاضی انتخاب شده</span>
                {isAllOnPageSelected && pagination.total > applicants.length && (
                  <button onClick={handleSelectAllAcrossPages} className="text-blue-500 hover:underline">
                    انتخاب همه {pagination.total} متقاضی
                  </button>
                )}
                <button onClick={handleClearSelection} className="text-red-500 hover:underline">لغو انتخاب</button>
              </div>
            ) : null}

            {/* Desktop table view */}
            <div className="relative overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 hidden md:block">
              <table className="w-full text-right text-sm">
                <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                      <button onClick={handleSelectAll} className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100">
                        {isAllOnPageSelected ? <CheckSquare className="h-4 w-4" /> : isIndeterminate ? <Minus className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </button>
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">#</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">عکس</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">نام</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">نام خانوادگی</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">کد ملی</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">شماره موبایل داوطلب</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">تاریخ ثبت‌نام</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  <AnimatePresence>
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400">
                          در حال بارگذاری...
                        </td>
                      </tr>
                    ) : applicants.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400">
                          هیچ متقاضی یافت نشد
                        </td>
                      </tr>
                    ) : (
                      applicants.map((applicant, index) => (
                        <motion.tr
                          key={applicant.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                        >
                          <td className="whitespace-nowrap px-4 py-3">
                            <button onClick={(e) => { e.stopPropagation(); handleSelectOne(applicant.id); }} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                              {isRowSelected(applicant.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300 cursor-pointer" onClick={() => handleViewApplicantDetails(applicant)}>
                            {pagination.from ? pagination.from + index : index + 1}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {applicant.Aks ? (
                              <Image 
                                src={applicant.Aks.startsWith('http') 
                                  ? applicant.Aks 
                                  : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${applicant.Aks.startsWith('storage/') ? applicant.Aks : `storage/${applicant.Aks}`}`} 
                                alt={`${applicant.Fname} ${applicant.Lname}`} 
                                width={40} 
                                height={40} 
                                className="h-10 w-10 rounded-full object-cover" 
                              />
                            ) : (
                              <span className="text-xs font-medium text-red-500 dark:text-red-400">بدون عکس</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{applicant.Fname}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{applicant.Lname}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{applicant.Mellicode || '-'}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{applicant.Phone || '-'}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300 text-xs" dir="ltr">
                            {toJalali(applicant.created_at)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                              onClick={(e) => { e.stopPropagation(); handleViewApplicantDetails(applicant);}}
                            >
                              <Eye className="h-4 w-4 ml-1" />
                              مشاهده
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
                ) : applicants.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    هیچ متقاضی یافت نشد
                  </div>
                ) : (
                  applicants.map((applicant, index) => (
                    <motion.div
                      key={applicant.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <button onClick={(e) => { e.stopPropagation(); handleSelectOne(applicant.id); }} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                              {isRowSelected(applicant.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                            </button>
                            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer" onClick={() => handleViewApplicantDetails(applicant)}>{applicant.Fname} {applicant.Lname}</h3>
                          </div>
                           <Badge variant={applicant.status === 1 ? "default" : "outline"} className={
                                applicant.status === 1 
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                             }>
                                {applicant.status === 1 ? 'فعال' : 'بررسی نشده'}
                             </Badge>
                        </div>
                        {applicant.Mellicode && (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                            کد ملی: {applicant.Mellicode}
                          </p>
                        )}
                        {applicant.Phone && (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                            شماره موبایل داوطلب : {applicant.Phone}
                          </p>
                        )}
                        {applicant.created_at && (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4" dir="ltr">
                            تاریخ ثبت‌نام: {toJalali(applicant.created_at)}
                          </p>
                        )}
                        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                             onClick={(e) => { e.stopPropagation(); handleViewApplicantDetails(applicant);}}
                          >
                            <Eye className="h-4 w-4 ml-1" />
                            مشاهده جزئیات
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {!loading && applicants.length > 0 && pagination.last_page > 1 && (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="hidden sm:inline">نمایش {pagination.current_page} از {pagination.last_page} صفحه</span>
                    <span className="hidden sm:inline mx-2">|</span>
                    نمایش {pagination.from} تا {pagination.to} از {pagination.total} متقاضی
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

        <Dialog open={isViewApplicantOpen} onOpenChange={(open: boolean) => {
          if (!open) {
            setSelectedApplicant(null);
          }
          setIsViewApplicantOpen(open);
        }}>
          <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">
                جزئیات متقاضی
              </DialogTitle>
            </DialogHeader>
            {selectedApplicant ? (
              <div className="space-y-4 py-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  {selectedApplicant.Aks ? (
                    <Image 
                      src={selectedApplicant.Aks.startsWith('http') 
                        ? selectedApplicant.Aks 
                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${selectedApplicant.Aks.startsWith('storage/') ? selectedApplicant.Aks : `storage/${selectedApplicant.Aks}`}`} 
                      alt={`${selectedApplicant.Fname} ${selectedApplicant.Lname}`} 
                      width={80} 
                      height={80} 
                      className="h-20 w-20 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" 
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">بدون عکس</span>
                    </div>
                  )}
                  <div className="mx-5">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {selectedApplicant.Fname} {selectedApplicant.Lname}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      کد ملی: {selectedApplicant.Mellicode || '-'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-zinc-500 dark:text-zinc-400">شماره موبایل داوطلب :</p>
                    <p className="text-zinc-900 dark:text-zinc-100">{selectedApplicant.Phone || '-'}</p>
                  </div>
                  {/* <div className="space-y-1">
                    <p className="text-zinc-500 dark:text-zinc-400">ایمیل:</p>
                    <p className="text-zinc-900 dark:text-zinc-100">{selectedApplicant.Email || '-'}</p> 
                  </div> */}
                  <div className="space-y-1">
                    <p className="text-zinc-500 dark:text-zinc-400">نام پدر:</p>
                    <p className="text-zinc-900 dark:text-zinc-100">{selectedApplicant.FatherName || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-zinc-500 dark:text-zinc-400">تاریخ تولد:</p>
                    <p className="text-zinc-900 dark:text-zinc-100">{selectedApplicant.Birthday || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-zinc-500 dark:text-zinc-400">وضعیت:</p>
                    <Badge variant={selectedApplicant.status === 1 ? "default" : "outline"} className={
                      selectedApplicant.status === 1
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                    }>
                      {selectedApplicant.status === 1 ? 'فعال' : 'بررسی نشده'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-zinc-500 dark:text-zinc-400">استان:</p>
                    <p className="text-zinc-900 dark:text-zinc-100">{selectedApplicant.Ostan || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-zinc-500 dark:text-zinc-400">شهر:</p>
                    <p className="text-zinc-900 dark:text-zinc-100">{selectedApplicant.City || '-'}</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-zinc-500 dark:text-zinc-400">آدرس:</p>
                    <p className="text-zinc-900 dark:text-zinc-100">{selectedApplicant.Adress || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-zinc-500 dark:text-zinc-400">تاریخ ثبت‌نام:</p>
                    <p className="text-zinc-900 dark:text-zinc-100" dir="ltr">
                      {toJalali(selectedApplicant.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-zinc-500 dark:text-zinc-400">
                اطلاعاتی برای نمایش وجود ندارد
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                variant="outline"
                onClick={() => setIsViewApplicantOpen(false)}
                className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                بستن
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
