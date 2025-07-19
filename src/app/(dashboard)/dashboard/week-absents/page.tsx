'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { useToast } from '@/components/ui/use-toast';
import { WeekAbsentService, WeekAbsent, WeekAbsentStudent, WeekAbsentFilters } from '@/lib/services/weekAbsent.service';
import { useAuth } from '@/lib/context/auth.context';
import { Plus, Search, Edit, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';  
import { useRouter } from 'next/navigation'; 
import { DateObject } from 'react-multi-date-picker';
import DateSelector from '../optimizedNumbers/add/DateSelector'; 
  
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

  // Effect to reset page when other filters change
  useEffect(() => {
    if (filters.page !== 1) {
      setFilters(prev => ({ ...prev, page: 1 }));
    }
  }, [filters.search, filters.date, filters.sort_by, filters.sort_order, filters.page]);

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge variant="secondary">در انتظار تایید</Badge>;
      case 1:
        return <Badge variant="default">تایید شده</Badge>;
      default:
        return <Badge variant="outline">نامشخص</Badge>;
    }
  };

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
    <div className="container mx-auto p-6 space-y-6 bg-white dark:bg-zinc-950 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100">حضور و غیاب هفتگی</h1>
          <h2 className="text-lg sm:text-xl font-medium text-gray-600 dark:text-zinc-400">لیست حضور و غیاب</h2>
        </div>
        <Button  
          onClick={() => router.push('/dashboard/week-absents/add')}
          className="bg-gray-700 dark:bg-zinc-700 text-white hover:bg-gray-800 dark:hover:bg-zinc-600 rounded-lg w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 ml-2" />
          <span className="hidden sm:inline">افزودن حضور و غیاب جدید</span>
          <span className="sm:hidden">افزودن جدید</span>
        </Button>
      </div>

      {/* Search Section */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-zinc-500 w-4 h-4" />
          <Input
            placeholder="جستجو..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pr-10 bg-gray-50 dark:bg-zinc-900 border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-400"
          />
        </div>
        <div className="flex-1">
          <DateSelector selectedDate={selectedDate} onChange={handleDateChange} />
        </div>
        <Button 
          variant="outline" 
          className="bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 w-full sm:w-auto" 
          onClick={() => loadAttendanceRecords()}
        >
          <Search className="w-4 h-4 ml-2 sm:ml-1" />
          <span className="sm:hidden">جستجو</span>
          <span className="hidden sm:inline">جستجو</span>
        </Button>
      </div>

      {/* Attendance Records Table - Desktop */}
      {loading ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">در حال بارگذاری...</div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/20">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                  <TableHead className="text-right text-gray-700 dark:text-zinc-300 font-medium">#</TableHead>
                  <TableHead className="text-right text-gray-700 dark:text-zinc-300 font-medium">تاریخ</TableHead>
                  <TableHead className="text-right text-gray-700 dark:text-zinc-300 font-medium">تعداد دانش آموز</TableHead>
                  <TableHead className="text-right text-gray-700 dark:text-zinc-300 font-medium">وضعیت</TableHead>
                  <TableHead className="text-right text-gray-700 dark:text-zinc-300 font-medium">ثبت کننده</TableHead>
                  <TableHead className="text-right text-gray-700 dark:text-zinc-300 font-medium">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record, index) => (
                  <TableRow key={record.id} className="border-b border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                    <TableCell className="text-right text-gray-900 dark:text-zinc-100">{index + 1}</TableCell>
                    <TableCell className="text-right text-gray-900 dark:text-zinc-100">
                      {new DateObject({ date: record.date }).convert(persian, persian_fa).format('YYYY/MM/DD')}
                    </TableCell> 
                    <TableCell className="text-right text-gray-900 dark:text-zinc-100">{record.students.length} نفر</TableCell>
                    <TableCell className="text-right">{getStatusBadge(record.students[0]?.status || 0)}</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 border-green-300 dark:border-green-800 rounded-lg px-3 py-1">
                        {record.user ? `${record.user.fname} ${record.user.lname}` : '-'}
                      </Badge>
                    </TableCell> 
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/week-absents/${record.id}`)}
                          className="bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-300 dark:border-zinc-600 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          مشاهده
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(record);
                            setFormData({
                              date: record.date,
                              students: record.students
                            });
                            setIsEditDialogOpen(true);
                          }}
                          className="bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-300 dark:border-zinc-600 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
                        >
                          <Edit className="w-4 h-4 ml-1" />
                          ویرایش
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => record.id && handleDelete(record.id)}
                          className="bg-gray-50 dark:bg-zinc-800 text-red-600 dark:text-red-400 border-gray-300 dark:border-zinc-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50"
                        >
                          <Trash2 className="w-4 h-4 ml-1" />
                          حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View - Minimalist Design */}
          <div className="md:hidden space-y-4">
            {attendanceRecords.map((record, index) => (
              <Card key={record.id} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden dark:shadow-zinc-900/20">
                {/* Minimalist Header */}
                <div className="border-b border-gray-100 dark:border-zinc-700 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-zinc-300">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                          {new DateObject({ date: record.date }).convert(persian, persian_fa).format('YYYY/MM/DD')}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(record.students[0]?.status || 0)}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Compact Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{record.students.length}</span>
                      </div>
                      <span className="text-gray-600 dark:text-zinc-400">دانش آموز</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-zinc-400 truncate max-w-20">
                        {record.user ? `${record.user.fname} ${record.user.lname}` : 'نامشخص'}
                      </span>
                    </div>
                  </div>

                  {/* Icon-based Action Buttons */}
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/week-absents/${record.id}`)}
                      className="h-9 w-9 p-0 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                      title="مشاهده"
                    >
                      <Eye className="w-4 h-4" />
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
                      className="h-9 w-9 p-0 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-amber-600 dark:text-amber-400"
                      title="ویرایش"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => record.id && handleDelete(record.id)}
                      className="h-9 w-9 p-0 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
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
                  {pagination.links.map((link, index) => {
                    if (link.label === "...") {
                      return (
                        <span key={index} className="px-2 text-zinc-900 dark:text-slate-400">
                          ...
                        </span>
                      );
                    }
                    if (link.url === null) return null;
                    const page = parseInt(link.label);
                    if (isNaN(page)) return null;
                    return (
                      <Button
                        key={index}
                        variant={link.active ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={`${
                          link.active
                            ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {link.label}
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
        </>
      )}

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
                  <p className="text-zinc-900 dark:text-zinc-100">{format(new Date(selectedRecord.date), 'yyyy/MM/dd', { locale: faIR })}</p>
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
