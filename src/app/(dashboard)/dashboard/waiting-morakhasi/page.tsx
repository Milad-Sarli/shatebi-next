'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MorakhasiService, type Morakhasi } from '@/lib/services/morakhasi.service';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/context/auth.context';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { PageTransition } from '@/components/ui/page-transition';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon, CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Textarea } from '@/components/ui/textarea';

// Define a basic User interface based on expected properties
interface User {
  fullname?: string;
  personnel_code?: string;
  aks?: string;
  // Add other user properties if known and used
}

// Define a local interface for the actual structure of response.data
// This assumes pagination fields are flat, not under a 'meta' object.
interface ActualApiResponseData {
  data: Morakhasi[]; // The list of items
  links?: { first: string | null; last: string | null; prev: string | null; next: string | null };
  current_page?: number;
  last_page?: number;
  total?: number;
  per_page?: number;
  from?: number;
  to?: number;
  // Include other fields if they are also flat (e.g., path from original meta)
}

interface MorakhasiFiltersState {
  page: number;
  per_page: number;
  search: string;
  type?: string; // Optional: if you need to filter by type for pending
}

// Define state for modals
interface ModalState {
  isOpen: boolean;
  morakhasiId: number | null;
  message: string;
  type: 'approve' | 'reject' | null;
}

const WaitingMorakhasiPage: React.FC = () => {
  const { accessToken, user } = useAuth();
  const [morakhasiList, setMorakhasiList] = useState<Morakhasi[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<MorakhasiFiltersState>({
    page: 1,
    per_page: 9, // e.g., 3x3 grid
    search: '',
    type: undefined, // example if you need to set a default type
  });
  const debouncedSearch = useDebounce(filters.search, 500);

  const [pagination, setPagination] = useState<{ currentPage: number; lastPage: number; total: number } | null>(null);

  // Modal state
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    morakhasiId: null,
    message: '',
    type: null,
  });

  const fetchWaitingMorakhasi = useCallback(async () => {
    if (!accessToken || !user) {
      setIsLoading(false);
      // Optionally, set an error or a message asking the user to log in
      setError("لطفا ابتدا وارد شوید.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const apiFilters = {
        page: filters.page,
        per_page: filters.per_page,
        search: debouncedSearch,
        type: filters.type, // Added type filter
      };
      // serviceCallResponse is { status: string, data: PaginatedResponse<Morakhasi> }
      // The type PaginatedResponse<Morakhasi> from the service expects a .meta object for pagination.
      // However, the runtime error indicates .meta is undefined.
      const serviceCallResponse = await MorakhasiService.getPendingAcceptanceMorakhasiList(accessToken, apiFilters);
      
      // We cast serviceCallResponse.data to our local, presumably correct, interface (ActualApiResponseData)
      // which expects flat pagination fields.
      const apiData = serviceCallResponse.data as unknown as ActualApiResponseData;

      if (apiData) {
        setMorakhasiList(apiData.data || []); // apiData.data is the list of Morakhasi items
        setPagination({
          currentPage: apiData.current_page ?? 1, // Access directly, not via .meta
          lastPage: apiData.last_page ?? 1,       // Access directly
          total: apiData.total ?? 0,             // Access directly
        });
      } else {
        // This case might occur if serviceCallResponse.data itself is null/undefined
        setMorakhasiList([]);
        setPagination(null);
        const R_T_ERROR = "پاسخ API نامعتبر است یا داده‌ای برای صفحه بندی وجود ندارد.";
        setError(R_T_ERROR);
        toast.error(R_T_ERROR);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast.error(`خطا در دریافت لیست مرخصی‌ها: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, user, filters.page, filters.per_page, debouncedSearch, filters.type]);

  useEffect(() => {
    fetchWaitingMorakhasi();
  }, [fetchWaitingMorakhasi]);

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const openModal = (type: 'approve' | 'reject', morakhasiId: number) => {
    setModalState({ isOpen: true, morakhasiId, message: '', type });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, morakhasiId: null, message: '', type: null });
  };

  const handleApprove = async () => {
    if (!accessToken || !modalState.morakhasiId || modalState.type !== 'approve') {
        toast.error("خطای احراز هویت یا اطلاعات نامعتبر.");
        closeModal();
        return;
    }
    
    try {
      setIsLoading(true);
      await MorakhasiService.updateMorakhasi(
        modalState.morakhasiId,
        { status: 1, guardmessage: modalState.message || undefined }, // send undefined if message is empty
        accessToken
      );
      toast.success('مرخصی با موفقیت تایید شد.');
      fetchWaitingMorakhasi(); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`خطا در تایید مرخصی: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      closeModal();
    }
  };

  const handleReject = async () => {
    if (!accessToken || !modalState.morakhasiId || modalState.type !== 'reject') {
      toast.error("خطای احراز هویت یا اطلاعات نامعتبر.");
      closeModal();
      return;
    }

    if (!modalState.message) { // Require reject reason
        toast.warn("لطفا دلیل رد مرخصی را وارد کنید.");
        // Keep modal open by not calling closeModal()
        return; 
    }

    try {
      setIsLoading(true);
      await MorakhasiService.updateMorakhasi(
        modalState.morakhasiId,
        { status: 2, reject_dalil: modalState.message }, 
        accessToken
      );
      toast.info('مرخصی رد شد.');
      fetchWaitingMorakhasi();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`خطا در رد مرخصی: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      closeModal();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeZone: 'Asia/Tehran' }).format(new Date(dateString));
    } catch {
      return dateString; 
    }
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    // Assuming timeString is HH:MM:SS or HH:MM
    const parts = timeString.split(':');
    if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  }

  return (
    <PageTransition>
      <div className="container mx-auto p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">مرخصی‌های در انتظار تایید</h1>
          <div className="relative w-full sm:w-auto sm:max-w-xs">
            <SearchIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="جستجو (نام، دلیل...)"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              className="pr-9 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded-md shadow-sm"
            />
          </div>
        </div>

        {isLoading && morakhasiList.length === 0 && (
          <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-300">در حال بارگذاری اطلاعات...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)] p-4 text-center text-red-600 dark:text-red-400">
            <AlertTriangle className="w-12 h-12 mb-4" />
            <p className="text-lg mb-2">خطا در دریافت اطلاعات</p>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={fetchWaitingMorakhasi}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              تلاش مجدد
            </button>
          </div>
        )}

        {!isLoading && !error && morakhasiList.length === 0 && (
          <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)] p-4 text-center">
            <Info className="w-12 h-12 text-gray-500 dark:text-gray-400 mb-4" />
            <p className="text-xl text-gray-700 dark:text-gray-200">
              {debouncedSearch ? `هیچ مرخصی با جستجوی "${debouncedSearch}" یافت نشد.` : 'در حال حاضر هیچ مرخصی در انتظار تاییدی وجود ندارد.'}
            </p>
          </div>
        )}

        {!error && morakhasiList.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-5 border border-gray-200 dark:border-gray-700 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden mr-3 shrink-0">
                        {(morakhasi.user as User)?.aks ? (
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${(morakhasi.user as User)?.aks}`}
                            alt={((morakhasi.user as User)?.fullname || morakhasi.fullname || 'User') + ' image'}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = '/images/default-avatar.png'; }}
                          />
                        ) : (
                          <span className="text-xl font-semibold text-gray-500 dark:text-gray-400">
                           {((morakhasi.user as User)?.fullname || morakhasi.fullname || 'N A').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-100 leading-tight">
                          {(morakhasi.user as User)?.fullname || morakhasi.fullname || 'نامشخص'}
                        </h2>
                        {(morakhasi.user as User)?.personnel_code && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            کد پرسنلی: {(morakhasi.user as User)?.personnel_code}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      <strong>دلیل مرخصی:</strong> {morakhasi.dalil || <span className="text-gray-400 dark:text-gray-500 italic">ثبت نشده</span>}
                    </p>
                    
                    {morakhasi.type === 1 && ( // ساعتی
                      <>
                        <p className="text-sm text-gray-600 dark:text-gray-300"><strong>تاریخ:</strong> {formatDate(morakhasi.dayli_date)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <strong>ساعت:</strong> {formatTime(morakhasi.fromtime_1)} الی {formatTime(morakhasi.totime_1)}
                        </p>
                      </>
                    )}
                    {morakhasi.type === 2 && ( // روزانه
                      <>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <strong>از تاریخ:</strong> {formatDate(morakhasi.fromdate)} <br /><strong>تا تاریخ:</strong> {formatDate(morakhasi.todate)}
                        </p>
                        {(morakhasi.fromtime_2 && morakhasi.totime_2 && morakhasi.fromtime_2 !== "00:00:00" && morakhasi.totime_2 !== "00:00:00")  && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            <strong>ساعات خاص:</strong> {formatTime(morakhasi.fromtime_2)} الی {formatTime(morakhasi.totime_2)}
                          </p>
                        )}
                      </>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">شناسه: {morakhasi.id}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 space-x-reverse">
                    <button
                      onClick={() => openModal('reject', morakhasi.id)}
                      disabled={isLoading}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 disabled:opacity-50 flex items-center gap-1"
                    >
                      <XCircle size={18} /> رد
                    </button>
                    <button
                      onClick={() => openModal('approve', morakhasi.id)}
                      disabled={isLoading}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 disabled:opacity-50 flex items-center gap-1"
                    >
                      <CheckCircle size={18} /> تایید
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {pagination && pagination.lastPage > 1 && (
              <div className="mt-8 flex justify-center items-center space-x-2 space-x-reverse">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1 || isLoading}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                   قبلی
                </button>
                <span className="text-gray-700 dark:text-gray-200">
                  صفحه {pagination.currentPage} از {pagination.lastPage} (کل: {pagination.total})
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.lastPage || isLoading}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  بعدی
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={modalState.isOpen && modalState.type === 'reject'}
        onClose={closeModal}
        onConfirm={handleReject}
        title="رد مرخصی"
        confirmText="رد درخواست"
        isConfirmDisabled={isLoading || !modalState.message} // Disable if no message for reject
      >
        <div className="space-y-2">
            <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              دلیل رد مرخصی (الزامی):
            </label>
            <Textarea
                id="rejectReason"
                value={modalState.message}
                onChange={(e) => setModalState(prev => ({ ...prev, message: e.target.value }))}
                placeholder="مثال: عدم هماهنگی با سرپرست واحد"
                rows={3}
                className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            />
        </div>
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={modalState.isOpen && modalState.type === 'approve'}
        onClose={closeModal}
        onConfirm={handleApprove}
        title="تایید مرخصی"
        confirmText="تایید و ارسال پیام"
      >
         <div className="space-y-2">
            <label htmlFor="guardMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              پیام به نگهبان (اختیاری):
            </label>
            <Textarea
                id="guardMessage"
                value={modalState.message}
                onChange={(e) => setModalState(prev => ({ ...prev, message: e.target.value }))}
                placeholder="مثال: لطفا در صورت خروج همکاری لازم صورت پذیرد."
                rows={3}
                className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
                می‌توانید این فیلد را خالی بگذارید و فقط مرخصی را تایید کنید.
            </p>
        </div>
      </ConfirmationModal>

    </PageTransition>
  );
};

export default WaitingMorakhasiPage;
