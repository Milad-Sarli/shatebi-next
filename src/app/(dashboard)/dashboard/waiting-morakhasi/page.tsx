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
import { format, parseISO } from 'date-fns-jalali';

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
        { status: 4, reject_dalil: modalState.message }, 
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


  function toJalali(date: string | undefined) {
    if (!date) return '-';
    try {
      const parsedDate = parseISO(date);
      return format(parsedDate, 'yyyy/MM/dd - HH:mm');
    } catch (error) {
      console.error('Error parsing date:', error);
      return '-';
    }
  }

  function getLeaveTypeLabel(type: string | number) {
    const typeNum = typeof type === 'string' ? parseInt(type) : type;
    switch (typeNum) {
      case 1:
        return 'ساعتی';
      case 2:
        return 'یک روزه';
      case 3:
        return 'چند روزه';
      default:
        return 'نامشخص';
    }
  }

  function getLeaveTypeBadgeClasses(type: string | number) {
    const typeNum = typeof type === 'string' ? parseInt(type) : type;
    switch (typeNum) {
      case 1: // Hourly - Orange
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700';
      case 2: // Single day - Green
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700';
      case 3: // Multi-day - Purple
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700';
      default: // Unknown - Gray
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  }

  function formatTimeRange(morakhasi: Morakhasi) {
    // Helper to convert to Persian numerals
    const toPersian = (str: string) => str.replace(/\d/g, d => String.fromCharCode(d.charCodeAt(0) + 1728));

    try {
      const typeNum = typeof morakhasi.type === 'string' ? parseInt(morakhasi.type) : morakhasi.type;
      
      // Hourly leave (type 1): show from hour to hour, with date
      if (typeNum === 1 && morakhasi.fromtime_1 && morakhasi.totime_1) {
        const fromTime = parseISO(morakhasi.fromtime_1);
        const toTime = parseISO(morakhasi.totime_1);
        
        const from = toPersian(format(fromTime, 'HH:mm'));
        const to = toPersian(format(toTime, 'HH:mm'));
        const dateStr = toPersian(format(fromTime, 'yyyy/MM/dd'));
        return `${from} تا ${to} — ${dateStr}`;
      }
      
      // Single day leave (type 2): show date from dayli_date
      if (typeNum === 2 && morakhasi.dayli_date) {
        const date = parseISO(morakhasi.dayli_date);
        const dateStr = toPersian(format(date, 'yyyy/MM/dd'));
        return dateStr;
      }
      
      // Multi-day leave (type 3): show from date to date
      if (typeNum === 3 && morakhasi.fromdate && morakhasi.todate) {
        const fromDate = parseISO(morakhasi.fromdate);
        const toDate = parseISO(morakhasi.todate);
        
        const from = toPersian(format(fromDate, 'yyyy/MM/dd'));
        const to = toPersian(format(toDate, 'yyyy/MM/dd'));
        return `${from} تا ${to}`;
      }
      
      // Fallback: show raw times if available
      if (morakhasi.fromtime_1 && morakhasi.totime_1) {
        return `${toPersian(toJalali(morakhasi.fromtime_1))} تا ${toPersian(toJalali(morakhasi.totime_1))}`;
      }
      
      // Another fallback for dates
      if (morakhasi.fromdate && morakhasi.todate) {
        return `${toPersian(toJalali(morakhasi.fromdate))} تا ${toPersian(toJalali(morakhasi.todate))}`;
      }
      
    } catch (error) {
      console.error('Error formatting date range:', error);
    }
    return '-';
  }


  return (
    <PageTransition>
      <div className="container mx-auto max-w-6xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">مرخصی‌های در انتظار تایید</h1>
          <div className="relative w-full sm:w-auto sm:max-w-xs">
            <Input
              type="text"
              placeholder="جستجو (نام، دلیل...)"
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
              onClick={fetchWaitingMorakhasi}
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
              {debouncedSearch ? `هیچ مرخصی با جستجوی "${debouncedSearch}" یافت نشد.` : 'در حال حاضر هیچ مرخصی در انتظار تاییدی وجود ندارد.'}
            </p>
          </div>
        )}

        {!error && morakhasiList.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {morakhasiList.map((morakhasi, index) => (
                <motion.div
                  key={morakhasi.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-4 flex flex-col gap-3 shadow hover:shadow-lg transition-shadow min-h-[140px] border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
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
                    <div className="flex-1">
                      <h2 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                        {(morakhasi.user as User)?.fullname || morakhasi.fullname || 'نامشخص'}
                      </h2>
                    </div>
                  </div>
                  
                  {/* Leave Type Badge */}
                  <div className="flex justify-start mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getLeaveTypeBadgeClasses(morakhasi.type)}`}>
                      {getLeaveTypeLabel(morakhasi.type)}
                    </span>
                  </div>
                  
                  {morakhasi.dalil && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">دلیل :  {morakhasi.dalil}</div>
                  )}
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">
                    {formatTimeRange(morakhasi)}
                  </div>
                  <div className="flex justify-end gap-2 mt-auto">
                    <button
                      onClick={() => openModal('reject', morakhasi.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800 transition font-medium disabled:opacity-50 shadow-sm text-xs"
                    >
                      <XCircle size={14} /> رد
                    </button>
                    <button
                      onClick={() => openModal('approve', morakhasi.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800 transition font-medium disabled:opacity-50 shadow-sm text-xs"
                    >
                      <CheckCircle size={14} /> تایید
                    </button>
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
                  صفحه {pagination.currentPage} از {pagination.lastPage}
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

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={modalState.isOpen && modalState.type === 'reject'}
        onClose={closeModal}
        onConfirm={handleReject}
        title="رد مرخصی"
        confirmText="رد درخواست"
      >
        <div className="space-y-3">
            <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              دلیل رد مرخصی:
            </label>
            <Textarea
                id="rejectReason"
                value={modalState.message}
                onChange={(e) => setModalState(prev => ({ ...prev, message: e.target.value }))}
                placeholder="دلیل رد مرخصی را وارد کنید..."
                rows={3}
                className="w-full border my-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm focus:ring-blue-400 focus:border-blue-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-white"
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
         <div className="space-y-3">
            <label htmlFor="guardMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              پیام به نگهبان (اختیاری):
            </label>
            <Textarea
                id="guardMessage"
                value={modalState.message}
                onChange={(e) => setModalState(prev => ({ ...prev, message: e.target.value }))}
                placeholder="اگر پیامی برای نگهبان دارید، بنویسید..."
                rows={3}
                className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm focus:ring-blue-400 focus:border-blue-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                می‌توانید این فیلد را خالی بگذارید و فقط مرخصی را تایید کنید.
            </p>
        </div>
      </ConfirmationModal>

    </PageTransition>
  );
};

export default WaitingMorakhasiPage;
