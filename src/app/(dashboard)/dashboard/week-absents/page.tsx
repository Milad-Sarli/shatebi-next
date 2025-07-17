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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/use-toast';
import { WeekAbsentService, WeekAbsent, WeekAbsentStudent, WeekAbsentFilters } from '@/lib/services/weekAbsent.service';
import { useAuth } from '@/lib/context/auth.context';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(15);
  
  // Filters
  const [filters, setFilters] = useState<WeekAbsentFilters>({
    search: '',
    date: '',
    sort_by: 'date',
    sort_order: 'desc'
  });
  
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
  const loadAttendanceRecords = useCallback(async () => {
    if (!accessToken) {
      console.log('No access token available');
      return;
    }
    
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
    setLoading(true);
    try {
      console.log('Loading attendance records with filters:', filters);
      const response = await WeekAbsentService.getAll(accessToken, {
        ...filters,
        per_page: perPage
      });
      
      console.log('API Response:', response);
      
      if (response.status === 'success') {
        setAttendanceRecords(response.data.data);
        setTotalPages(Math.ceil(response.data.total / perPage));
        console.log('Attendance records set:', response.data.data);
      }
    } catch {
      console.error('Error loading attendance records');
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری رکوردهای حضور و غیاب',
        type: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters, perPage, toast]);

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
  };

  // Initial load when accessToken becomes available
  useEffect(() => {
    if (accessToken) {
      console.log('Initial load with access token');
      loadAttendanceRecords();
    }
  }, [accessToken, loadAttendanceRecords]);

  // Load data on filter changes
  useEffect(() => {
    console.log('useEffect triggered - loading attendance records');
    console.log('Current filters:', filters);
    console.log('Current page:', currentPage);
    console.log('Access token available:', !!accessToken);
    
    if (accessToken) {
      loadAttendanceRecords();
    }
  }, [currentPage, perPage, filters, accessToken, loadAttendanceRecords]);

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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">حضور و غیاب هفتگی</h1>
          <h2 className="text-xl font-bold text-gray-900 mt-2">لیست حضور و غیاب</h2>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/week-absents/add')}
          className="bg-gray-700 text-white hover:bg-gray-800 rounded-lg"
        >
          <Plus className="w-4 h-4 ml-2" />
          افزودن حضور و غیاب جدید
        </Button>
      </div>

      {/* Search Section */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="جستجو..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pr-10 bg-gray-100 border-gray-300 rounded-lg"
          />
        </div>
        <Button variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 rounded-lg hover:bg-gray-200">
          جستجو
        </Button>
      </div>

      {/* Attendance Records Table */}
      {loading ? (
        <div className="text-center py-8">در حال بارگذاری...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="text-gray-700 font-medium">#</TableHead>
                  <TableHead className="text-gray-700 font-medium">تاریخ</TableHead>
                  <TableHead className="text-gray-700 font-medium">تعداد دانش آموز</TableHead>
                  <TableHead className="text-gray-700 font-medium">وضعیت</TableHead>
                  <TableHead className="text-gray-700 font-medium">ثبت کننده</TableHead>
                  <TableHead className="text-gray-700 font-medium">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record, index) => (
                  <TableRow key={record.id} className="border-b border-gray-100">
                    <TableCell className="text-gray-900">{index + 1}</TableCell>
                    <TableCell className="text-gray-900">
                      {format(new Date(record.date), 'yyyy/MM/dd', { locale: faIR })}
                    </TableCell>
                    <TableCell className="text-gray-900">{record.students.length} نفر</TableCell>
                    <TableCell>{getStatusBadge(record.students[0]?.status || 0)}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 border-green-300 rounded-lg px-3 py-1">
                        {record.user ? `${record.user.fname} ${record.user.lname}` : '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/week-absents/${record.id}`)}
                          className="bg-gray-100 text-gray-700 border-gray-300 rounded-lg hover:bg-gray-200"
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
                          className="bg-gray-100 text-gray-700 border-gray-300 rounded-lg hover:bg-gray-200"
                        >
                          <Edit className="w-4 h-4 ml-1" />
                          ویرایش
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => record.id && handleDelete(record.id)}
                          className="bg-gray-100 text-red-600 border-gray-300 rounded-lg hover:bg-red-50"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>جزئیات حضور و غیاب</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>تاریخ</Label>
                  <p>{format(new Date(selectedRecord.date), 'yyyy/MM/dd', { locale: faIR })}</p>
                </div>
                <div>
                  <Label>ثبت کننده</Label>
                  <p>{selectedRecord.user ? `${selectedRecord.user.fname} ${selectedRecord.user.lname}` : '-'}</p>
                </div>
              </div>
              
              <div>
                <Label>دانش آموزان</Label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedRecord.students.map((student) => (
                    <Card key={student.student_id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">
                            {student.student?.Fname} {student.student?.Lname}
                          </p>
                          <p className="text-sm text-gray-500">
                            کد دانش آموزی: {student.student?.StudentCode}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getAttendanceStatus(student)}
                          
                          {student.delay && student.delay_time && (
                            <div className="flex items-center text-sm text-gray-500">
                              <span className="mr-1">{student.delay_time}</span>
                            </div>
                          )}
                          
                          {student.absent && student.absent_reason && (
                            <p className="text-sm text-gray-500">{student.absent_reason}</p>
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ویرایش حضور و غیاب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-date">تاریخ</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>دانش آموزان</Label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {formData.students.map((student) => (
                  <Card key={student.student_id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">
                          {student.student?.Fname} {student.student?.Lname}
                        </p>
                        <p className="text-sm text-gray-500">
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
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">حاضر</SelectItem>
                            <SelectItem value="delay">تاخیر</SelectItem>
                            <SelectItem value="absent">غایب</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {student.delay && (
                          <Input
                            type="time"
                            value={student.delay_time || ''}
                            onChange={(e) => updateStudentAttendance(student.student_id, 'delay_time', e.target.value)}
                            className="w-32"
                          />
                        )}
                        
                        {student.absent && (
                          <Input
                            placeholder="دلیل غیبت"
                            value={student.absent_reason || ''}
                            onChange={(e) => updateStudentAttendance(student.student_id, 'absent_reason', e.target.value)}
                            className="w-48"
                          />
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                انصراف
              </Button>
              <Button onClick={handleUpdate}>
                بروزرسانی
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
