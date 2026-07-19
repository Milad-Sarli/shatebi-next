'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MorakhasiService, type Morakhasi, type ListForGuardFilters } from '@/lib/services/morakhasi.service';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/context/auth.context';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { PageTransition } from '@/components/ui/page-transition';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search as SearchIcon, AlertTriangle, Info, Loader2, LogOut, LogIn} from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
// Textarea might not be needed if guard actions don't include messages
// import { Textarea } from '@/components/ui/textarea'; 
import { format, parseISO } from 'date-fns-jalali';

// Define a basic User interface based on expected properties
interface User {
  fullname?: string;
  personnel_code?: string;
  aks?: string;
 dayli_date?: string; // اضافه شدن فیلد dayli_date برای مرخصی‌های یک‌روزه
}

// Enhanced Morakhasi interface for guard page
// interface GuardMorakhasi extends Morakhasi {
//   user?: User;
//   acceptedBy?: AcceptedBy;
//   tenant?: Tenant;
//   dayli_date?: string; // اضافه شدن فیلد dayli_date برای مرخصی‌های یک‌روزه
// }

// This interface describes the actual flat structure of the API response for pagination
// interface ActualApiResponseData {
//   data: Morakhasi[];
//   links?: { first: string | null; last: string | null; prev: string | null; next: string | null };
//   current_page?: number;
//   last_page?: number;
//   total?: number;
//   per_page?: number;
//   from?: number;
//   to?: number;
// }

// Adjusted filters state for guard page, maps to ListForGuardFilters
interface GuardMorakhasiFiltersState {
  page: number;
  per_page: number;
  search: string;
  type?: string; 
  status?: number;
}

// Define state for modals for guard actions
interface ModalState {
  isOpen: boolean;
  morakhasiId: number | null;
  type: 'allowExit' | 'markEntry' | 'confirmLate' | null;
}

// State for late confirmation modal
interface LateModalState {
  isOpen: boolean;
  morakhasiId: number | null;
}

interface PaginationInfo {
  current_page?: number;
  last_page?: number;
  total?: number;
  per_page?: number;
}

interface NestedData extends PaginationInfo {
  data?: Morakhasi[];
}

interface ApiObject extends PaginationInfo {
  data?: Morakhasi[] | NestedData;
  meta?: PaginationInfo;
  status?: string;
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
    status: undefined,
  });
  const debouncedSearch = useDebounce(filters.search, 500);

  const [pagination, setPagination] = useState<{ currentPage: number; lastPage: number; total: number; perPage: number } | null>(null);

  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    morakhasiId: null,
    type: null,
  });

  const [lateModalState, setLateModalState] = useState<LateModalState>({
    isOpen: false,
    morakhasiId: null,
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
        status: filters.status,
      };
      
      const serviceCallResponse = await MorakhasiService.listMorakhasiForGuard(accessToken, apiFilters);
      // پشتیبانی از هر دو ساختار پاسخ: تخت و تو در تو (status + data)
      const raw: unknown = serviceCallResponse?.data ?? null;

      if (raw) {
        let list: Morakhasi[] = [];
        let currentPage = filters.page ?? 1;
        let lastPage = 1;
        let total = 0;
        let perPage = filters.per_page ?? 10;

        if (Array.isArray(raw)) {
          list = raw as Morakhasi[];
          total = list.length;
        } else if (typeof raw === 'object' && raw !== null) {
          const obj = raw as ApiObject;
          if (obj.status && obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
            const nested = obj.data as NestedData;
            list = Array.isArray(nested.data) ? nested.data : [];
            currentPage = nested.current_page ?? currentPage;
            lastPage = nested.last_page ?? lastPage;
            total = nested.total ?? list.length;
            perPage = nested.per_page ?? perPage;
          } else {
            const flatData = (obj.data as Morakhasi[] | undefined) ?? [];
            list = Array.isArray(flatData) ? flatData : [];
            const meta = obj.meta as PaginationInfo | undefined;
            currentPage = meta?.current_page ?? obj.current_page ?? currentPage;
            lastPage = meta?.last_page ?? obj.last_page ?? lastPage;
            total = meta?.total ?? obj.total ?? list.length;
            perPage = meta?.per_page ?? obj.per_page ?? perPage;
          }
        }

        setMorakhasiList(list);
        setPagination({ currentPage, lastPage, total, perPage });
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
  }, [accessToken, user, filters.page, filters.per_page, debouncedSearch, filters.type, filters.status]);

  useEffect(() => {
    fetchGuardMorakhasiList();
  }, [fetchGuardMorakhasiList]);

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const openModal = (type: 'allowExit' | 'markEntry' | 'confirmLate', morakhasiId: number) => {
    setModalState({ isOpen: true, morakhasiId, type });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, morakhasiId: null, type: null });
  };

  const closeLateModal = () => {
    setLateModalState({ 
      isOpen: false, 
      morakhasiId: null
    });
  };

  // تابع برای یافتن اطلاعات مرخصی بر اساس ID
  const getCurrentMorakhasi = () => {
    if (!modalState.morakhasiId && !lateModalState.morakhasiId) return null;
    const targetId = modalState.morakhasiId || lateModalState.morakhasiId;
    return morakhasiList.find(m => m.id === targetId);
  };

  const handleAllowExit = async () => {
    if (!accessToken || !modalState.morakhasiId || modalState.type !== 'allowExit') {
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
      toast.success('اجازه خروج با موفقیت ثبت شد.');
      fetchGuardMorakhasiList(); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`خطا در ثبت اجازه خروج: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      closeModal();
    }
  };

  const handleMarkEntry = async () => {
    if (!accessToken || !modalState.morakhasiId || modalState.type !== 'markEntry') {
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
      toast.success('ورود با موفقیت ثبت شد.');
      
      // بلافاصله مودال تاخیر را باز کن
      setLateModalState({
        isOpen: true,
        morakhasiId: modalState.morakhasiId
      });
      
      fetchGuardMorakhasiList();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`خطا در ثبت ورود: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      closeModal();
    }
  };

  const handleLateConfirmation = async (isLate: boolean) => {
    if (!accessToken || !lateModalState.morakhasiId) {
      toast.error("خطای احراز هویت یا اطلاعات نامعتبر.");
      closeLateModal();
      return;
    }

    try {
      setIsLoading(true);
      
      if (!isLate) {
        // اگر دیر نکرده، late = 0 و مودال را ببند
        await MorakhasiService.updateMorakhasiByGuard(
          lateModalState.morakhasiId,
          { late: 0 },
          accessToken
        );
        toast.success('عدم تاخیر ثبت شد.');
      } else {
        // اگر دیر کرده، late = 1 و مودال را ببند
        await MorakhasiService.updateMorakhasiByGuard(
          lateModalState.morakhasiId,
          { late: 1 },
          accessToken
        );
        toast.success('تاخیر ثبت شد.');
      }
      
      closeLateModal();
      fetchGuardMorakhasiList();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`خطا در ثبت وضعیت تاخیر: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // تابع handleLateTimeSubmit حذف شده چون دیگر نیازی نیست

  // Remove the formatTimeRange function as we're now handling time display inline
  // function formatTimeRange(morakhasi: GuardMorakhasi) {
  //   // Implementation removed - now handled inline in the component
  // }

  function getStatusBadge(morakhasi: Morakhasi) {
    if ((morakhasi.exit_ok === 1 || morakhasi.exit_ok === "1") && (morakhasi.checked === 1 || morakhasi.checked === "1")) {
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">تکمیل شده</span>;
    }
    if (morakhasi.exit_ok === 1 || morakhasi.exit_ok === "1") {
      return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">خارج شده</span>;
    }
    if (morakhasi.checked === 1 || morakhasi.checked === "1") { // This case might be less common if exit_ok must be 1 first
      return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">بررسی شده</span>;
    }
    // New mapping based on your status keys:
    // 1 = accepted, 2 = waiting, 3 = expired, 4 = rejected
    if (morakhasi.status === 1 || morakhasi.status === "1") {
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">تایید شده</span>;
    }
    if (morakhasi.status === 2 || morakhasi.status === "2") {
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">در انتظار تایید</span>;
    }
    if (morakhasi.status === 3 || morakhasi.status === "3") {
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300">منقضی شده</span>;
    }
    if (morakhasi.status === 4 || morakhasi.status === "4") {
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">رد شده</span>;
    }
    // 5 = used (استعمال شده)
    if (morakhasi.status === 5 || morakhasi.status === "5") {
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">استعمال شده</span>;
    }
    return null;
  }


  // function formatDateTime(date: string | undefined) {
  //   if (!date) return '-';
  //   try {
  //     return format(parseISO(date), 'yyyy/MM/dd - HH:mm');
  //   } catch {
  //     return '-';
  //   }
  // }

  return (
    <PageTransition>
      <div className="flex flex-col gap-3 sm:gap-6 w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {/* Header and Search Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-6 text-center mx-auto">کنترل تردد و مرخصی‌ها (نگهبانی)</h1>
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              این لیست مرخصی‌ها 
              <span className='text-yellow-600 px-2'>
              (فقط برای یک هفته)
              </span>
           هست
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-center">
            {/* Search Bar */}
            <div className="relative flex-1 lg:max-w-lg">
              <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="جستجو نام، کد پرسنلی..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                className="pr-10 text-right bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors rounded-lg shadow-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-48">
              <Select
                value={filters.status !== undefined ? String(filters.status) : 'all'}
                onValueChange={(value) =>
                  setFilters(prev => ({
                    ...prev,
                    status: value === 'all' ? undefined : Number(value),
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="w-full text-right bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors rounded-lg shadow-sm">
                  <SelectValue placeholder="فیلتر وضعیت" />
                </SelectTrigger>
                <SelectContent className="text-right">
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="1">تایید شده</SelectItem>
                  <SelectItem value="2">در انتظار</SelectItem>
                  <SelectItem value="3">منقضی شده</SelectItem>
                  <SelectItem value="4">رد شده</SelectItem>
                  <SelectItem value="5">استعمال شده</SelectItem>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mb-8">
              {morakhasiList
                .map((morakhasi, index) => (
                  <motion.div
                    key={morakhasi.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: [0.4, 0, 0.2, 1],
                  }}
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
                      <div className="flex items-baseline gap-1">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                          {(morakhasi.user as User)?.fullname || morakhasi.fullname || 'نامشخص'}
                        </h2>
                      </div>
                      {(morakhasi.user as User)?.personnel_code && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          کد: {(morakhasi.user as User)?.personnel_code}
                        </p>
                      )}
                    </div>
                    <div className="text-left">
                      {getStatusBadge(morakhasi)}
                    </div>
                  </div>

                  {morakhasi.dalil && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                      <span className="font-medium text-gray-700 dark:text-gray-200">دلیل:</span> {morakhasi.dalil}
                    </div>
                  )}

                  {/* نمایش پیام نگهبان اگر وجود داشته باشد */}
                  {morakhasi.guardmessage && (
                    <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg mb-1">
                      <span className="font-medium">پیام نگهبان:</span> {morakhasi.guardmessage}
                    </div>
                  )}

                  {/* نمایش اطلاعات تایید کننده */}
                  {morakhasi.accepted_by && (
                    <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg mb-1">
                      <span className="font-medium"></span> {morakhasi.accepted_by}
                    </div>
                  )}
                  
                  {(morakhasi.type === "1" || morakhasi.type === 1) && ( // ساعتی
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">
                      <div>تاریخ: {(() => {
                        try {
                          const date = morakhasi.fromtime_1 ? format(parseISO(morakhasi.fromtime_1), 'yyyy/MM/dd') :
                                       morakhasi.dayli_date ? format(parseISO(morakhasi.dayli_date), 'yyyy/MM/dd') : '-';
                          return date;
                        } catch {
                          return '-';
                        }
                      })()}</div>
                      <div>ساعت: {(() => {
                        try {
                          const fromTime = morakhasi.fromtime_1 ? format(parseISO(morakhasi.fromtime_1), 'HH:mm') : '';
                          const toTime = morakhasi.totime_1 ? format(parseISO(morakhasi.totime_1), 'HH:mm') : '';
                          return fromTime && toTime ? `${fromTime} الی ${toTime}` : '-';
                        } catch {
                          return '-';
                        }
                      })()}</div>
                    </div>
                  )}
                  {(morakhasi.type === "2" || morakhasi.type === 2) && ( // یک‌روزه
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">
                      <div>تاریخ: {(() => {
                        try {
                          const date = morakhasi.dayli_date ? format(parseISO(morakhasi.dayli_date), 'yyyy/MM/dd') :
                                       morakhasi.fromdate ? format(parseISO(morakhasi.fromdate), 'yyyy/MM/dd') : '-';
                          return date;
                        } catch {
                          return '-';
                        }
                      })()}</div>
                      <div>نوع: تمام روز</div>
                    </div>
                  )}
                  {(morakhasi.type === "3" || morakhasi.type === 3) && ( // چندروزه
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">
                      <div>از: {(() => {
                        try {
                          return morakhasi.fromdate ? format(parseISO(morakhasi.fromdate), 'yyyy/MM/dd') : '-';
                        } catch {
                          return '-';
                        }
                      })()}</div>
                      <div>تا: {(() => {
                        try {
                          return morakhasi.todate ? format(parseISO(morakhasi.todate), 'yyyy/MM/dd') : '-';
                        } catch {
                          return '-';
                        }
                      })()}</div>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2 mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
                    {/* دکمه اجازه خروج - نمایش زمانی که exit_ok برابر 0 یا null باشد */}
                    {(morakhasi.status === 1 || morakhasi.status === "1") && (morakhasi.exit_ok === 0 || morakhasi.exit_ok === null || morakhasi.exit_ok === "0") && (
                      <button
                        onClick={() => openModal('allowExit', morakhasi.id)}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 transition font-medium disabled:opacity-50 shadow-sm text-xs"
                      >
                        <LogOut size={14} /> اجازه خروج
                      </button>
                    )}
                    
                    {/* دکمه ثبت ورود - نمایش زمانی که exit_ok برابر 1 و checked null یا 0 باشد */}
                    {(morakhasi.status === 1 || morakhasi.status === "1") && (morakhasi.exit_ok === 1 || morakhasi.exit_ok === "1") && 
                     (morakhasi.checked === null || morakhasi.checked === 0 || morakhasi.checked === "0") && (
                      <button
                        onClick={() => openModal('markEntry', morakhasi.id)}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800 transition font-medium disabled:opacity-50 shadow-sm text-xs"
                      >
                        <LogIn size={14} /> ثبت ورود
                      </button>
                    )}
                    
                    {/* پیام‌های وضعیت */}
                    {(morakhasi.status === 1 || morakhasi.status === "1") && (morakhasi.exit_ok === 1 || morakhasi.exit_ok === "1") && 
                     (morakhasi.checked === 1 || morakhasi.checked === "1") && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">فرآیند تکمیل شده</p>
                    )}
                  </div>
                  </motion.div>
                ))}
            </div>

            {pagination && pagination.lastPage > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
                  نمایش {((pagination.currentPage - 1) * pagination.perPage) + 1} تا {Math.min(pagination.currentPage * pagination.perPage, pagination.total)} از {pagination.total} مورد
                </div>
                
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1 || isLoading}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <span className="text-lg">&#8594;</span>
                    <span className="hidden sm:inline">قبلی</span>
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.lastPage) }, (_, i) => {
                      let pageNum;
                      if (pagination.lastPage <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage >= pagination.lastPage - 2) {
                        pageNum = pagination.lastPage - 4 + i;
                      } else {
                        pageNum = pagination.currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
                            pagination.currentPage === pageNum
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.lastPage || isLoading}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <span className="hidden sm:inline">بعدی</span>
                    <span className="text-lg">&#8592;</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={modalState.isOpen && modalState.type === 'allowExit'}
        onClose={closeModal}
        onConfirm={handleAllowExit}
        title="تایید اجازه خروج"
        description={
          <div>
            آیا از صدور اجازه خروج برای این کاربر اطمینان دارید؟
            {getCurrentMorakhasi() && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">قرآن آموز: </span>
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {getCurrentMorakhasi()?.fullname}
                </span>
              </div>
            )}
          </div>
        }
        confirmText="اجازه خروج"
        cancelText="انصراف"
        variant="warning"
      />

      <ConfirmationModal
        isOpen={modalState.isOpen && modalState.type === 'markEntry'}
        onClose={closeModal}
        onConfirm={handleMarkEntry}
        title="تایید ثبت ورود"
        description={
          <div>
            آیا از ثبت ورود این کاربر اطمینان دارید؟
            {getCurrentMorakhasi() && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">دانش‌آموز: </span>
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                  {getCurrentMorakhasi()?.fullname}
                </span>
              </div>
            )}
          </div>
        }
        confirmText="ثبت ورود"
        cancelText="انصراف"
        variant="default"
      />

      {/* Late Confirmation Modal */}
      {lateModalState.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              تایید وضعیت تاخیر
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              آیا این کاربر دیر کرده است؟
            </p>
            
            {getCurrentMorakhasi() && (
              <div className="mb-6 p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">دانش‌آموز: </span>
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                  {getCurrentMorakhasi()?.fullname}
                </span>
              </div>
            )}
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handleLateConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                خیر، دیر نکرده
              </button>
              <button
                onClick={() => handleLateConfirmation(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
              >
                بله، دیر کرده
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Selector Modal - حذف شده */}

    </PageTransition>
  );
};

export default GuardPage;
