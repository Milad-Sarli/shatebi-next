"use client";

import * as React from "react";
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/context/auth.context";
import { MasterService, Master, MasterFilters, PaginationResponse } from "@/lib/services/master.service";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageTransition } from "@/components/ui/page-transition";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MasterForm } from "./master-form";
import Image from "next/image";
import Link from "next/link";

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

export default function MastersPage() {
  const { accessToken } = useAuth();
  const [masters, setMasters] = React.useState<Master[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<MasterFilters>({
    page: 1,
    per_page: 10,
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
  const [masterToDelete, setMasterToDelete] = React.useState<number | null>(null);
  const [masterToEdit, setMasterToEdit] = React.useState<Master | null>(null);

  // Reference to track if a search is already in progress
  const searchInProgress = React.useRef(false);

  const fetchMasters = React.useCallback(async (searchTerm?: string) => {
    if (!accessToken) return;
    if (searchInProgress.current) return;

    try {
      searchInProgress.current = true;
      setLoading(true);
      
      const searchQuery = searchTerm !== undefined ? searchTerm : debouncedSearch;
      
      const response = await MasterService.getMasters(
        {
          page: filters.page,
          per_page: filters.per_page,
          search: searchQuery || undefined,
          tenant_id: filters.tenant_id,
        },
        accessToken
      );
      console.log(response)
      // Update masters state with the data array from the response
      if (response.data) {
        setMasters(response.data.data);
        
        // Update pagination from the response
        setPagination({
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          total: response.data.total,
          per_page: response.data.per_page,
          from: response.data.from,
          to: response.data.to
        });
      }
    } catch (error) {
      toast.error("خطا در دریافت لیست استادها");
      console.error(error);
    } finally {
      setLoading(false);
      searchInProgress.current = false;
    }
  }, [accessToken, filters, debouncedSearch]);

  // Effect for page and per_page changes
  React.useEffect(() => {
    // Only fetch if not triggered by a search change
    if (!searchInProgress.current) {
      fetchMasters();
    }
  }, [filters.page, filters.per_page, filters.tenant_id, fetchMasters]);

  // Effect to handle debounced search changes
  React.useEffect(() => {
    // Reset to first page when search changes
    if (filters.page !== 1) {
      setFilters(prev => ({ ...prev, page: 1 }));
    } else {
      fetchMasters();
    }
  }, [debouncedSearch, fetchMasters, filters.page]);

  const handlePageChange = (page: number) => {
    if (page !== filters.page) {
      setFilters((prev) => ({ ...prev, page }));
      // No need to call fetchMasters here as the filters change will trigger the useEffect
    }
  };

  const handleDeleteMaster = (id: number) => {
    setMasterToDelete(id);
  };

  const confirmDelete = async () => {
    if (!accessToken || !masterToDelete) return;

    try {
      await MasterService.deleteMaster(masterToDelete, accessToken);
      toast.success("استاد با موفقیت حذف شد");
      fetchMasters();
    } catch (error) {
      toast.error("خطا در حذف استاد");
      console.error(error);
    } finally {
      setMasterToDelete(null);
    }
  };

  const handleEditMaster = (master: Master) => {
    setMasterToEdit(master);
  };

  const handleSearch = () => {
    if (filters.page !== 1) {
      setFilters(prev => ({ ...prev, page: 1 }));
    } else {
      fetchMasters(searchInput);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg bg-white dark:bg-zinc-900 p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">مدیریت استادها</h1>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Link href="/dashboard/masters/add" passHref>
              <Button className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                <Plus className="ml-2 h-4 w-4" />
                افزودن استاد
              </Button>
            </Link>
          </div>
        </div>

        <Card className="border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="text-zinc-900 dark:text-zinc-100">لیست استادها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
                <Input
                  placeholder="جستجو بر اساس نام، کد ملی یا شماره تلفن..."
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
                    <th className="whitespace-nowrap px-4 py-3 font-medium">تصویر</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">نام کامل</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">کد ملی</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">شماره تلفن</th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium">مرکز</th>
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
                    ) : masters.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400">
                          هیچ استادی یافت نشد
                        </td>
                      </tr>
                    ) : (
                      masters.map((master, index) => (
                        <motion.tr
                          key={master.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                            {pagination.from ? pagination.from + index : index + 1}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="relative h-8 w-8 overflow-hidden rounded-full">
                              {master.aks ? (
                                <Image
                                  src={master.aks.startsWith('http') 
                                    ? master.aks 
                                    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${master.aks.startsWith('storage/') ? master.aks : `storage/${master.aks}`}`}
                                  alt={master.fullname}
                                  className="h-full w-full object-cover"
                                  width={32}
                                  height={32}
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300">
                                  {master.fullname.substring(0, 1)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{master.fullname}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{master.mellicode}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{master.phone}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{master.tenant?.name}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex h-8 w-8 p-0 items-center justify-center text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                onClick={() => handleEditMaster(master)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex h-8 w-8 p-0 items-center justify-center text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                onClick={() => handleDeleteMaster(master.id)}
                              >
                                <Trash2 className="h-4 w-4" />
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
              <AnimatePresence mode="wait">
                {loading ? (
                  <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    در حال بارگذاری...
                  </div>
                ) : masters.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    هیچ استادی یافت نشد
                  </div>
                ) : (
                  masters.map((master, index) => (
                    <motion.div
                      key={master.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-center mb-4">
                          <div className="relative h-12 w-12 overflow-hidden rounded-full mr-3">
                            {master.aks ? (
                              <Image
                                src={master.aks.startsWith('http') 
                                  ? master.aks 
                                  : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${master.aks.startsWith('storage/') ? master.aks : `storage/${master.aks}`}`}
                                alt={master.fullname}
                                className="h-full w-full object-cover"
                                width={48}
                                height={48}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300 text-lg">
                                {master.fullname.substring(0, 1)}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{master.fullname}</h3>
                            {master.tenant?.name && (
                              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                مرکز: {master.tenant.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                          <div>
                            <p className="text-zinc-500 dark:text-zinc-400">کد ملی:</p>
                            <p className="text-zinc-900 dark:text-zinc-100">{master.mellicode}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500 dark:text-zinc-400">شماره تلفن:</p>
                            <p className="text-zinc-900 dark:text-zinc-100">{master.phone}</p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            onClick={() => handleEditMaster(master)}
                          >
                            <Edit className="h-4 w-4 ml-1" />
                            ویرایش
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            onClick={() => handleDeleteMaster(master.id)}
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

            {!loading && masters.length > 0 && pagination.last_page > 1 && (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="hidden sm:inline">نمایش {pagination.current_page} از {pagination.last_page} صفحه</span>
                    <span className="hidden sm:inline mx-2">|</span>
                    نمایش {pagination.from} تا {pagination.to} از {pagination.total} استاد
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

        <Dialog open={masterToEdit !== null} onOpenChange={(open: boolean) => !open && setMasterToEdit(null)}>
          <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">ویرایش استاد</DialogTitle>
            </DialogHeader>
            <MasterForm
              master={masterToEdit || undefined}
              onSuccess={() => {
                setMasterToEdit(null);
                fetchMasters();
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={masterToDelete !== null} onOpenChange={(open: boolean) => !open && setMasterToDelete(null)}>
          <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 w-[90vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-zinc-100">تایید حذف استاد</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-zinc-600 dark:text-zinc-400">آیا از حذف این استاد اطمینان دارید؟</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setMasterToDelete(null)}
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

