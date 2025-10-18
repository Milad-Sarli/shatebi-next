'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

import { useToast } from '@/components/ui/use-toast';
import { WeekAbsentService, WeekAbsent, WeekAbsentStudent, WeekAbsentFilters } from '@/lib/services/weekAbsent.service';
import { useAuth } from '@/lib/context/auth.context';
import { Plus, Search, Edit, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns-jalali';
import { useRouter } from 'next/navigation'; 
import { DateObject } from 'react-multi-date-picker';
import DateSelector from '../optimizedNumbers/add/DateSelector'; 
import { AnimatePresence, motion } from 'framer-motion'; 
  
interface AttendanceFormData {
  date: string;
  students: WeekAbsentStudent[];
}

export default function WeekAbsentsPage() {
  const { user, accessToken } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  // Debug authentication state
  console.log('Auth state:', { user, accessToken, isAuthenticated: !!accessToken });
  
  const [attendanceRecords, setAttendanceRecords] = useState<WeekAbsent[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    links: [] as Array<{ url: string | null; label: string; active: boolean }>,
  });
  const [perPage] = useState(10);
  
  // Filters
  const [filters, setFilters] = useState<WeekAbsentFilters>({
    page: 1,
    search: '',
    date: '',
    sort_by: 'date',
    sort_order: 'desc'
  });
  const [selectedDate, setSelectedDate] = useState<DateObject | null>(null);
  
  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WeekAbsent | null>(null);
  
  // Form data for edit
  const [formData, setFormData] = useState<AttendanceFormData>({
    date: format(new Date(), 'yyyy-MM-dd'),
    students: []
  });

  // Load attendance records
  const loadAttendanceRecords = useCallback(async (page = 1, limit = 10, currentFilters = filters) => {
    if (!accessToken) {
      console.log('No access token available');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Loading attendance records with filters:', currentFilters);
      const response = await WeekAbsentService.getAll(accessToken, {
        ...currentFilters,
        page: page,
        per_page: limit
      });
      
      console.log('API Response:', response);
      
      if (response.status === 'success') {
        setAttendanceRecords(response.data.data);
        setPagination({
          current_page: response.data.current_page,
          last_page: Math.ceil(response.data.total / response.data.per_page),
          total: response.data.total,
          links: [],
        });
        console.log('Attendance records set:', response.data.data);
      }
    } catch (error) {
      console.error('Error loading attendance records:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری رکوردهای حضور و غیاب',
        type: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken, toast, filters]);

  // Update attendance record
  const handleUpdate = async () => {
    if (!accessToken || !selectedRecord?.id) return;
    
    try {
      const response = await WeekAbsentService.update(selectedRecord.id, formData, accessToken);
      if (response.status === 'success') {
        toast({
          title: 'موفقیت',
          description: 'حضور و غیاب با موفقیت بروزرسانی شد'
        });
        setIsEditDialogOpen(false);
        loadAttendanceRecords();
      }
    } catch {
      toast({
        title: 'خطا',
        description: 'خطا در بروزرسانی حضور و غیاب',
        type: 'destructive'
      });
    }
  };

  // Delete attendance record
  const handleDelete = async (id: number) => {
    if (!accessToken) return;
    
    if (!confirm('آیا از حذف این رکورد اطمینان دارید؟')) return;
    
    try {
      const response = await WeekAbsentService.delete(id, accessToken);
      if (response.status === 'success') {
        toast({
          title: 'موفقیت',
          description: 'رکورد با موفقیت حذف شد'
        });
        loadAttendanceRecords();
      }
    } catch {
      toast({
        title: 'خطا',
        description: 'خطا در حذف رکورد',
        type: 'destructive'
      });
    }
  };

  // Update student attendance
  const updateStudentAttendance = (studentId: number, field: keyof WeekAbsentStudent, value: string | boolean | null) => {
    setFormData(prev => ({
      ...prev,
      students: prev.students.map(student => 
        student.student_id === studentId 
          ? { ...student, [field]: value }
          : student
      )
    }));
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof WeekAbsentFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'search' && !value) {
      setSelectedDate(null);
      setFilters(prev => ({...prev, date: ''}))
    }
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleDateChange = (date: DateObject | null) => {
    setSelectedDate(date);
    if (date) {
      handleFilterChange('date', date.format('YYYY-MM-DD'));
    } else {
      handleFilterChange('date', '');
    }
  };

  // Initial load when accessToken becomes available
  useEffect(() => {
    if (accessToken) {
      console.log('Initial load with access token');
      loadAttendanceRecords(1, perPage, filters);
    }
  }, [accessToken, loadAttendanceRecords, perPage, filters]);

  // Effect to load attendance records when page changes
  useEffect(() => {
    if (accessToken) {
      loadAttendanceRecords(filters.page, perPage, filters);
    }
  }, [filters.page, accessToken, loadAttendanceRecords, perPage, filters]);



  const getAttendanceStatus = (student: WeekAbsentStudent) => {
    if (student.absent) {
      return <Badge variant="destructive">غایب</Badge>;
    } else if (student.delay) {
      return <Badge variant="secondary">تاخیر</Badge>;
    } else {
      return <Badge variant="default">حاضر</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg p-4 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 dark:from-blue-500/5 dark:via-emerald-500/5 dark:to-blue-500/5"></div>
        {/* Content */}
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
            حضور و غیاب هفتگی
          </h1>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10"
            onClick={() => router.push('/dashboard/week-absents/add')}
          >
            <Plus className="w-4 h-4" />
            افزودن حضور و غیاب
          </Button>
        </div>
      </div>

      <Card className="border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
        <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
          <CardTitle className="text-zinc-900 dark:text-zinc-100">لیست حضور و غیاب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
              <Input
                placeholder="جستجو..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pr-9 border-zinc-200 bg-white placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:ring-zinc-700"
              />
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={() => loadAttendanceRecords()}
              className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              جستجو
            </Button>
            <div className="flex flex-col sm:flex-row gap-2">
              <DateSelector selectedDate={selectedDate} onChange={handleDateChange} />
            </div>
          </div>

            {/* Desktop table view */}
            {loading ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                در حال بارگذاری...
              </div>
            ) : (
              <div className="relative overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 hidden md:block">
                <table className="w-full text-right text-sm">
                  <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">#</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">تاریخ</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">تعداد دانش آموز</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">ثبت کننده</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    <AnimatePresence mode="wait">
                      {attendanceRecords.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400">
                            هیچ رکوردی یافت نشد
                          </td>
                        </tr>
                      ) : ( 
                        attendanceRecords.map((record, index) => (
                          <motion.tr
                            key={record.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                              {(pagination.current_page - 1) * perPage + index + 1}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">
                              {format(new Date(record.date), 'yyyy/MM/dd')}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{record.students.length} نفر</td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300">
                                {record.user ? `${record.user.fname} ${record.user.lname}` : '-'}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                onClick={() => router.push(`/dashboard/week-absents/${record.id}`)}
                              >
                                <Eye className="w-4 h-4 ml-1" />
                                مشاهده
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setFormData({
                                    date: record.date,
                                    students: record.students
                                  });
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4 ml-1" />
                                ویرایش
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                onClick={() => record.id && handleDelete(record.id)}
                              >
                                <Trash2 className="w-4 h-4 ml-1" />
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
            )}

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            <AnimatePresence mode="wait">
              {attendanceRecords.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 text-center text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
                >
                  هیچ رکوردی یافت نشد
                </motion.div>
              ) : (
                attendanceRecords.map((record) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-zinc-900 dark:text-zinc-100 font-medium">
                            {format(new Date(record.date), 'yyyy/MM/dd')}
                          </div>
                          <div className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                            {record.students.length} دانش آموز
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                        <span className="font-medium">ثبت کننده:</span>{' '}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300">
                          {record.user ? `${record.user.fname} ${record.user.lname}` : '-'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center border-t border-zinc-100 dark:border-zinc-800 divide-x divide-zinc-100 dark:divide-zinc-800 rtl:divide-x-reverse">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/week-absents/${record.id}`)}
                        className="flex-1 rounded-none h-10 text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                      >
                        <Eye className="w-4 h-4 ml-1" />
                        مشاهده
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRecord(record);
                          setFormData({
                            date: record.date,
                            students: record.students
                          });
                          setIsEditDialogOpen(true);
                        }}
                        className="flex-1 rounded-none h-10 text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                      >
                        <Edit className="w-4 h-4 ml-1" />
                        ویرایش
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => record.id && handleDelete(record.id)}
                        className="flex-1 rounded-none h-10 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {!loading && attendanceRecords.length > 0 && ( 
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="hidden sm:inline">نمایش {pagination.current_page} از {pagination.last_page} صفحه</span>
                  <span className="hidden sm:inline mx-2">|</span>
                  نمایش {(pagination.current_page - 1) * perPage + 1} تا {Math.min(pagination.current_page * perPage, pagination.total)} از {pagination.total} رکورد حضور و غیاب
                </div>
              </div> 
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.current_page === 1}
                    className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    اولین
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === pagination.last_page || 
                      (page >= pagination.current_page - 1 && page <= pagination.current_page + 1)
                    )
                    .map((page, index, array) => {
                      // Add ellipsis
                      if (index > 0 && page - array[index - 1] > 1) {
                        return (
                          <React.Fragment key={`ellipsis-${page}`}>
                            <span className="px-2 text-zinc-500 dark:text-zinc-400">
                              ...
                            </span>
                            <Button
                              key={page}
                              variant={pagination.current_page === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className={`${
                                pagination.current_page === page
                                  ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                              }`}
                            >
                              {page}
                            </Button>
                          </React.Fragment>
                        );
                      }
                      return (
                        <Button
                          key={page}
                          variant={pagination.current_page === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className={`${
                            pagination.current_page === page
                              ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                              : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          }`}
                        >
                          {page}
                        </Button>
                      );
                    })
                  }
                </div>  
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.last_page)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    آخرین
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-zinc-100">جزئیات حضور و غیاب</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-700 dark:text-zinc-300">تاریخ</Label>
                  <p className="text-zinc-900 dark:text-zinc-100">{format(new Date(selectedRecord.date), 'yyyy/MM/dd')}</p>
                </div>
                <div>
                  <Label className="text-zinc-700 dark:text-zinc-300">ثبت کننده</Label>
                  <p className="text-zinc-900 dark:text-zinc-100">{selectedRecord.user ? `${selectedRecord.user.fname} ${selectedRecord.user.lname}` : '-'}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-zinc-700 dark:text-zinc-300">دانش آموزان</Label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedRecord.students.map((student) => (
                    <Card key={student.student_id} className="p-4 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {student.student?.Fname} {student.student?.Lname}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-zinc-400">
                            کد دانش آموزی: {student.student?.StudentCode}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getAttendanceStatus(student)}
                          
                          {student.delay && student.delay_time && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-zinc-400">
                              <span className="mr-1">{student.delay_time}</span>
                            </div>
                          )}
                          
                          {student.absent && student.absent_reason && (
                            <p className="text-sm text-gray-500 dark:text-zinc-400">{student.absent_reason}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-zinc-100">ویرایش حضور و غیاب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-date" className="text-zinc-700 dark:text-zinc-300">تاریخ</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300">دانش آموزان</Label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {formData.students.map((student) => (
                  <Card key={student.student_id} className="p-4 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {student.student?.Fname} {student.student?.Lname}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-zinc-400">
                          کد دانش آموزی: {student.student?.StudentCode}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Select
                          value={student.absent ? 'absent' : student.delay ? 'delay' : 'present'}
                          onValueChange={(value) => {
                            updateStudentAttendance(student.student_id, 'absent', value === 'absent');
                            updateStudentAttendance(student.student_id, 'delay', value === 'delay');
                          }}
                        >
                          <SelectTrigger className="w-32 border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                            <SelectItem value="present" className="dark:text-zinc-100 dark:focus:bg-zinc-700">حاضر</SelectItem>
                            <SelectItem value="delay" className="dark:text-zinc-100 dark:focus:bg-zinc-700">تاخیر</SelectItem>
                            <SelectItem value="absent" className="dark:text-zinc-100 dark:focus:bg-zinc-700">غایب</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {student.delay && (
                          <Input
                            type="time"
                            value={student.delay_time || ''}
                            onChange={(e) => updateStudentAttendance(student.student_id, 'delay_time', e.target.value)}
                            className="w-32 border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          />
                        )}
                        
                        {student.absent && (
                          <Input
                            placeholder="دلیل غیبت"
                            value={student.absent_reason || ''}
                            onChange={(e) => updateStudentAttendance(student.student_id, 'absent_reason', e.target.value)}
                            className="w-48 border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                          />
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                انصراف
              </Button>
              <Button 
                onClick={handleUpdate}
                className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                بروزرسانی
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
