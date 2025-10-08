'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MorakhasiService, type Morakhasi, type ListForGuardFilters } from '@/lib/services/morakhasi.service';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/context/auth.context';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { PageTransition } from '@/components/ui/page-transition';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon, AlertTriangle, Info, Loader2, LogOut, LogIn } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
// Textarea might not be needed if guard actions don't include messages
// import { Textarea } from '@/components/ui/textarea'; 
import dayjs from 'dayjs';
import jalaliday from 'jalaliday';
dayjs.extend(jalaliday);

// Define a basic User interface based on expected properties
interface User {
  fullname?: string;
  personnel_code?: string;
  aks?: string;
}

// This interface describes the actual flat structure of the API response for pagination
interface ActualApiResponseData {
  data: Morakhasi[];
  links?: { first: string | null; last: string | null; prev: string | null; next: string | null };
  current_page?: number;
  last_page?: number;
  total?: number;
  per_page?: number;
  from?: number;
  to?: number;
}

// Adjusted filters state for guard page, maps to ListForGuardFilters
interface GuardMorakhasiFiltersState {
  page: number;
  per_page: number;
  search: string;
  type?: string; 
}

// Define state for modals for guard actions
interface ModalState {
  isOpen: boolean;
  morakhasiId: number | null;
  // message: string; // Guard actions might not need a message
  type: 'markExit' | 'markChecked' | null;
}

const GuardPage: React.FC = () => {
  const { accessToken, user } = useAuth();
  const [morakhasiList, setMorakhasiList] = useState<Morakhasi[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<GuardMorakhasiFiltersState>({
    page: 1,
    per_page: 10, // Adjusted for guard view, perhaps more items
    search: '',
    type: undefined, 
  });
  const debouncedSearch = useDebounce(filters.search, 500);

  const [pagination, setPagination] = useState<{ currentPage: number; lastPage: number; total: number } | null>(null);

  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    morakhasiId: null,
    // message: '',
    type: null,
  });

  const fetchGuardMorakhasiList = useCallback(async () => {
    if (!accessToken || !user) {
      setIsLoading(false);
      setError("لطفا ابتدا وارد شوید.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const apiFilters: ListForGuardFilters = { // Ensure this matches the service
        page: filters.page,
        per_page: filters.per_page,
        search: debouncedSearch,
        type: filters.type,
      };
      
      const serviceCallResponse = await MorakhasiService.listMorakhasiForGuard(accessToken, apiFilters);
      const apiData = serviceCallResponse.data as unknown as ActualApiResponseData;

      if (apiData) {
        setMorakhasiList(apiData.data || []);
        setPagination({
          currentPage: apiData.current_page ?? 1,
          lastPage: apiData.last_page ?? 1,
          total: apiData.total ?? 0,
        });
      } else {
        setMorakhasiList([]);
        setPagination(null);
        const R_T_ERROR = "پاسخ API نامعتبر است یا داده‌ای برای صفحه بندی وجود ندارد.";
        setError(R_T_ERROR);
        toast.error(R_T_ERROR);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast.error(`خطا در دریافت لیست مرخصی‌ها برای نگهبانی: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, user, filters.page, filters.per_page, debouncedSearch, filters.type]);

  useEffect(() => {
    fetchGuardMorakhasiList();
  }, [fetchGuardMorakhasiList]);

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const openModal = (type: 'markExit' | 'markChecked', morakhasiId: number) => {
    setModalState({ isOpen: true, morakhasiId, type });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, morakhasiId: null, type: null });
  };

  const handleMarkExit = async () => {
    if (!accessToken || !modalState.morakhasiId || modalState.type !== 'markExit') {
        toast.error("خطای احراز هویت یا اطلاعات نامعتبر.");
        closeModal();
        return;
    }
    
    try {
      setIsLoading(true);
      await MorakhasiService.updateMorakhasiByGuard(
        modalState.morakhasiId,
        { exit_ok: 1 }, 
        accessToken
      );
      toast.success('خروج کاربر با موفقیت ثبت شد.');
      fetchGuardMorakhasiList(); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`خطا در ثبت خروج: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      closeModal();
    }
  };

  const handleMarkChecked = async () => { // Assuming 'checked' means entry or confirmation
    if (!accessToken || !modalState.morakhasiId || modalState.type !== 'markChecked') {
      toast.error("خطای احراز هویت یا اطلاعات نامعتبر.");
      closeModal();
      return;
    }

    try {
      setIsLoading(true);
      await MorakhasiService.updateMorakhasiByGuard(
        modalState.morakhasiId,
        { checked: 1 },
        accessToken
      );
      toast.info('ورود/بررسی کاربر با موفقیت ثبت شد.');
      fetchGuardMorakhasiList();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`خطا در ثبت ورود/بررسی: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      closeModal();
    }
  };

  function getStatusBadge(morakhasi: Morakhasi) {
    if (morakhasi.exit_ok === 1 && morakhasi.checked === 1) {
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">تکمیل شده</span>;
    }
    if (morakhasi.exit_ok === 1) {
      return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">خارج شده</span>;
    }
    if (morakhasi.checked === 1) { // This case might be less common if exit_ok must be 1 first
      return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">بررسی شده</span>;
    }
    if (morakhasi.status === 0) { // Pending manager approval
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">منتظر تایید مدیر</span>;
    }
    if (morakhasi.status === 1) { // Approved by manager
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">تایید شده</span>;
    }
    if (morakhasi.status === 2) { // Rejected by manager
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">رد شده</span>;
    }
    return null;
  }


  function toJalali(date: string | undefined) {
    if (!date) return '-';
    return dayjs(date).calendar('jalali').locale('fa').format('YYYY/MM/DD - HH:mm');
  }

  return (
    <PageTransition>
      <div className="container mx-auto max-w-7xl p-6"> {/* Max width increased slightly */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">کنترل تردد و مرخصی‌ها (نگهبانی)</h1>
          <div className="relative w-full sm:w-auto sm:max-w-xs">
            <Input
              type="text"
              placeholder="جستجو (نام، کد پرسنلی...)"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-400 dark:focus:border-blue-500 rounded-full shadow-sm transition placeholder:text-gray-400 text-gray-900 dark:text-white"
            />
            <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {isLoading && morakhasiList.length === 0 && (
          <div className="flex flex-col justify-center items-center h-[calc(100vh-250px)]">
            <Loader2 className="w-14 h-14 text-blue-500 animate-spin mb-4" />
            <p className="text-lg text-gray-500 dark:text-gray-300 font-medium">در حال بارگذاری اطلاعات...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col justify-center items-center h-[calc(100vh-250px)] p-4 text-center text-red-500 dark:text-red-400">
            <AlertTriangle className="w-10 h-10 mb-3" />
            <p className="text-base mb-1 font-semibold">خطا در دریافت اطلاعات</p>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={fetchGuardMorakhasiList}
              className="px-5 py-2 bg-blue-500 text-white rounded-full shadow hover:bg-blue-600 transition-colors font-medium"
            >
              تلاش مجدد
            </button>
          </div>
        )}

        {!isLoading && !error && morakhasiList.length === 0 && (
          <div className="flex flex-col justify-center items-center h-[calc(100vh-250px)] p-4 text-center">
            <Info className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-lg text-gray-600 dark:text-gray-200 font-medium">
              {debouncedSearch ? `هیچ موردی با جستجوی "${debouncedSearch}" یافت نشد.` : 'در حال حاضر هیچ مرخصی برای نمایش وجود ندارد.'}
            </p>
          </div>
        )}

        {!error && morakhasiList.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"> {/* Adjusted grid for potentially more items */}
              {morakhasiList.map((morakhasi, index) => (
                <motion.div
                  key={morakhasi.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-4 flex flex-col justify-between min-h-[200px] border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 ease-out group"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden mr-3 shrink-0 border-2 border-gray-200 dark:border-gray-700 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-colors">
                                {(morakhasi.user as User)?.aks ? (
                                <Image
                                    src={(() => {
                                      const aks = (morakhasi.user as User)?.aks;
                                      if (!aks) return '/avatars/default.svg';
                                      if (aks.startsWith('http')) return aks;
                                      return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${aks.startsWith('storage/') ? aks : `storage/${aks}`}`;
                                    })()}
                                    alt={((morakhasi.user as User)?.fullname || morakhasi.fullname || 'User') + ' image'}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.currentTarget.src = '/avatars/default.svg'; }}
                                />
                                ) : (
                                <span className="text-base font-bold text-gray-400 dark:text-gray-500">
                                    {((morakhasi.user as User)?.fullname || morakhasi.fullname || 'N A').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                                </span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                                {(morakhasi.user as User)?.fullname || morakhasi.fullname || 'نامشخص'}
                                </h2>
                                {(morakhasi.user as User)?.personnel_code && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    کد: {(morakhasi.user as User)?.personnel_code}
                                </p>
                                )}
                            </div>
                        </div>
                        <div className="text-left">
                            {getStatusBadge(morakhasi)}
                        </div>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-1.5 line-clamp-2">
                      <span className="font-medium text-gray-700 dark:text-gray-200">دلیل:</span> {morakhasi.dalil || <span className="text-gray-400 dark:text-gray-500 italic">ثبت نشده</span>}
                    </p>
                    
                    {morakhasi.type === 1 && ( // ساعتی
                      <>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium">تاریخ:</span> <span className="font-semibold text-blue-600 dark:text-blue-400">{toJalali(morakhasi.fromtime_1)?.split('-')[0].trim()}</span>
                        </p>
                         <p className="text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium">ساعت:</span> <span className="font-semibold text-indigo-600 dark:text-indigo-400">{toJalali(morakhasi.fromtime_1)?.split('-')[1].trim()}</span> الی <span className="font-semibold text-red-600 dark:text-red-400">{toJalali(morakhasi.totime_1)?.split('-')[1].trim()}</span>
                        </p>
                      </>
                    )}
                    {morakhasi.type === 2 && ( // روزانه
                      <>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium">از:</span> <span className="font-semibold text-blue-600 dark:text-blue-400">{toJalali(morakhasi.fromtime_1)}</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium">تا:</span> <span className="font-semibold text-red-600 dark:text-red-400">{toJalali(morakhasi.totime_1)}</span>
                        </p>
                      </>
                    )}
                     <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1.5">ID: {morakhasi.id}</p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                    {morakhasi.status === 1 && !morakhasi.exit_ok && ( // Approved by manager AND not yet exited
                        <button
                        onClick={() => openModal('markExit', morakhasi.id)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors font-medium disabled:opacity-60 shadow-md text-xs"
                        >
                        <LogOut size={15} /> ثبت خروج
                        </button>
                    )}
                    {morakhasi.status === 1 && morakhasi.exit_ok === 1 && morakhasi.checked !== 1 && ( // Approved, Exited, AND not yet checked (returned/completed)
                        <button
                        onClick={() => openModal('markChecked', morakhasi.id)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors font-medium disabled:opacity-60 shadow-md text-xs"
                        >
                        <LogIn size={15} /> ثبت ورود/تکمیل
                        </button>
                    )}
                     {/* Show a message if actions are completed or not applicable */}
                    {morakhasi.status !== 1 && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">منتظر تایید مدیر</p>
                    )}
                    {morakhasi.status === 1 && morakhasi.exit_ok === 1 && morakhasi.checked === 1 && (
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">فرآیند تکمیل شده</p>
                    )}


                  </div>
                </motion.div>
              ))}
            </div>

            {pagination && pagination.lastPage > 1 && (
              <div className="mt-10 flex justify-center items-center gap-4">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1 || isLoading}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-40"
                  aria-label="قبلی"
                >
                  <span className="text-lg">&#8594;</span>
                </button>
                <span className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                  صفحه {pagination.currentPage} از {pagination.lastPage} (کل: {pagination.total})
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.lastPage || isLoading}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-40"
                  aria-label="بعدی"
                >
                  <span className="text-lg">&#8592;</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modals for Guard Actions */}
      <ConfirmationModal
        isOpen={modalState.isOpen && modalState.type === 'markExit'}
        onClose={closeModal}
        onConfirm={handleMarkExit}
        title="تایید خروج کاربر"
        confirmText="تایید و ثبت خروج"
        isConfirmDisabled={isLoading}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          آیا از ثبت خروج برای این درخواست مرخصی اطمینان دارید؟ این عمل قابل بازگشت نیست.
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={modalState.isOpen && modalState.type === 'markChecked'}
        onClose={closeModal}
        onConfirm={handleMarkChecked}
        title="تایید ورود/تکمیل مرخصی"
        confirmText="تایید و ثبت"
        isConfirmDisabled={isLoading}
      >
         <p className="text-sm text-gray-600 dark:text-gray-300">
          آیا از ثبت ورود یا تکمیل این درخواست مرخصی اطمینان دارید؟
        </p>
      </ConfirmationModal>

    </PageTransition>
  );
};

export default GuardPage;
