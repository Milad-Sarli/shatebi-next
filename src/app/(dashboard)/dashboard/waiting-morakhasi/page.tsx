'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MorakhasiService, type Morakhasi, type PendingMorakhasiFilters } from '@/lib/services/morakhasi.service';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/context/auth.context';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { PageTransition } from '@/components/ui/page-transition';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon, CheckCircle, XCircle, AlertTriangle, Info, Loader2, Filter } from 'lucide-react';
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
  FatherName?: string;
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
  type?: number; // Changed to number to match API expectation (integer)
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
    type: undefined, // No default type filter
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
      // Clean the filters object - remove undefined values
      const apiFilters: PendingMorakhasiFilters = {
        page: filters.page,
        per_page: filters.per_page,
      };
      
      if (debouncedSearch) {
        apiFilters.search = debouncedSearch;
      }
      
      if (filters.type) {
        apiFilters.type = filters.type;
      }
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

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleTypeFilterChange = (value: string) => {
    const typeValue = value === 'all' ? undefined : parseInt(value); // Convert to integer as API expects
    setFilters(prev => ({ ...prev, type: typeValue, page: 1 }));
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



  function getLeaveTypeLabel(type: string | number | undefined) {
    if (type === undefined) return 'نامشخص';
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

  function getLeaveTypeBadgeClasses(type: string | number | undefined) {
    if (type === undefined) return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
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
    const toPersian = (str: string) => str.replace(/\d/g, d => String.fromCharCode(d.charCodeAt(0) + 1728));
    const isFullDateTime = (s?: string) => !!s && /\d{4}-\d{2}-\d{2}/.test(s);

    try {
      const typeNum = typeof morakhasi.type === 'string' ? parseInt(morakhasi.type) : morakhasi.type;
      const fmtDate = (iso: string) => toPersian(format(parseISO(iso), 'yyyy/MM/dd'));
      const fmtTime = (isoOrTime: string) => {
        if (isFullDateTime(isoOrTime)) {
          return toPersian(format(parseISO(isoOrTime.replace(' ', 'T')), 'HH:mm'));
        }
        return toPersian(isoOrTime);
      };

      if (typeNum === 1 && morakhasi.fromtime_1 && morakhasi.totime_1) {
        const date = morakhasi.dayli_date ? fmtDate(morakhasi.dayli_date) : (isFullDateTime(morakhasi.fromtime_1) ? fmtDate(morakhasi.fromtime_1.replace(' ', 'T')) : undefined);
        const timeLine = `ساعت: ${fmtTime(morakhasi.fromtime_1)} تا ${fmtTime(morakhasi.totime_1)}`;
        return date ? `تاریخ: ${date}\n${timeLine}` : timeLine;
      }

      if (typeNum === 2 && morakhasi.dayli_date) {
        return `تاریخ: ${fmtDate(morakhasi.dayli_date)}`;
      }

      if (typeNum === 3 && morakhasi.fromdate && morakhasi.todate) {
        const dateLine = `تاریخ: ${fmtDate(morakhasi.fromdate)} تا ${fmtDate(morakhasi.todate)}`;
        if (morakhasi.fromtime_2 && morakhasi.totime_2) {
          return `${dateLine}\nساعت: ${fmtTime(morakhasi.fromtime_2)} تا ${fmtTime(morakhasi.totime_2)}`;
        }
        if (morakhasi.fromtime_1 && morakhasi.totime_1) {
          return `${dateLine}\nساعت: ${fmtTime(morakhasi.fromtime_1)} تا ${fmtTime(morakhasi.totime_1)}`;
        }
        return dateLine;
      }

      if (morakhasi.fromtime_1 && morakhasi.totime_1) {
        return `ساعت: ${fmtTime(morakhasi.fromtime_1)} تا ${fmtTime(morakhasi.totime_1)}`;
      }
      if (morakhasi.fromdate && morakhasi.todate) {
        return `تاریخ: ${fmtDate(morakhasi.fromdate)} تا ${fmtDate(morakhasi.todate)}`;
      }
    } catch {
      return '-';
    }
    return '-';
  }


  return (
    <PageTransition>
      <div className="flex flex-col gap-3 sm:gap-6 w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
          {/* Header and Search/Filter Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-6 text-center mx-auto">مرخصی‌های در انتظار تایید</h1>
            
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-center">
              {/* Search Bar */}
              <div className="relative flex-1 lg:max-w-lg">
                <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="جستجو نام قرآن آموز ، دلیل..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pr-10 text-right bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors rounded-lg shadow-sm"
                />
              </div>
              
              {/* Type Filter */}
              <div className="flex items-center gap-2 lg:min-w-[200px]">
                <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Select value={filters.type?.toString() || 'all'} onValueChange={handleTypeFilterChange}>
                  <SelectTrigger dir='rtl' className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-lg shadow-sm">
                    <SelectValue placeholder="نوع مرخصی" />
                  </SelectTrigger>
                  <SelectContent dir='rtl'>
                    <SelectItem value="all">همه انواع</SelectItem>
                    <SelectItem value="1">ساعتی</SelectItem>
                    <SelectItem value="3">چند روزه</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mb-8">
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
                          {((morakhasi.user as User)?.fullname || morakhasi.fullname || 'N A').split(' - ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-sm flex font-semibold text-gray-900 dark:text-white leading-tight">
                        {(morakhasi.user as User)?.fullname || morakhasi.fullname || 'نامشخص'}
                        {morakhasi.student?.FatherName && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-normal mr-2 px-2">
                            {morakhasi.student.FatherName}
                          </p>
                        )}
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
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2 whitespace-pre-line">
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
              <div className="mt-8 sm:mt-10 flex justify-center items-center gap-2 sm:gap-4 px-4">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1 || isLoading}
                  className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  aria-label="صفحه قبلی"
                >
                  <span className="text-lg sm:text-xl font-medium">&#8594;</span>
                </button>
                
                <div className="flex items-center justify-center min-w-0 px-2 sm:px-4">
                  <span className="text-gray-700 dark:text-gray-200 text-sm sm:text-base font-medium whitespace-nowrap">
                    صفحه {pagination.currentPage} از {pagination.lastPage}
                  </span>
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.lastPage || isLoading}
                  className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  aria-label="صفحه بعدی"
                >
                  <span className="text-lg sm:text-xl font-medium">&#8592;</span>
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
