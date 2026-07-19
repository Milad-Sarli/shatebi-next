"use client";

import { WeekAbsentService, WeekAbsent, WeekAbsentStudent } from '@/lib/services/weekAbsent.service';
import { useAuth } from '@/lib/context/auth.context';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns-jalali';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function WeekAbsentDetailPage() {
  const { id } = useParams();
  const { accessToken } = useAuth();
  const router = useRouter();
  const [record, setRecord] = useState<WeekAbsent | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // 12 students per page for better mobile experience

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken || !id) return;
      setLoading(true);
    try {
        const response = await WeekAbsentService.getById(Number(id), accessToken);
        if (response.status === 'success') {
          setRecord(response.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, accessToken]);

  const handleStatusChange = async (studentId: number, currentStatus: string | number) => {
    if (!record || !accessToken) return;
    const numericCurrentStatus = Number(currentStatus);
    setUpdatingStatus(studentId);
    try {
      const newStatusForApi = String(numericCurrentStatus === 1 ? 0 : 1);
      
      // Update local state immediately for better UX
      setRecord(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          students: prev.students.map(student => 
            student.student_id === studentId 
              ? { ...student, status: (numericCurrentStatus === 1 ? 0 : 1) }
              : student
          )
        };
      });

      // Send update to server
      const updatedStudents = record.students.map(student => 
        student.student_id === studentId 
          ? { ...student, status: newStatusForApi }
          : student
      );

      const response = await WeekAbsentService.update(Number(id), {
        date: record.date,
        students: updatedStudents
      }, accessToken);

      if (response.status !== 'success') {
        // Revert local state if server update failed
        setRecord(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            students: prev.students.map(student => 
              student.student_id === studentId 
                ? { ...student, status: currentStatus }
                : student
            )
          };
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      // Revert local state on error
      setRecord(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          students: prev.students.map(student => 
            student.student_id === studentId 
              ? { ...student, status: numericCurrentStatus }
              : student
          )
        };
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) return <div className="p-8 text-center">در حال بارگذاری...</div>;
  if (!record) return <div className="p-8 text-center text-red-500">رکورد یافت نشد.</div>;

  // Pagination calculations
  const totalStudents = record.students.length;
  const totalPages = Math.ceil(totalStudents / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = record.students.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-3 sm:gap-6 w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
      <Button onClick={() => router.push('/dashboard/week-absents')} className="mb-4">بازگشت به لیست</Button>
      <Card>
        <CardHeader>
          <CardTitle>جزئیات حضور و غیاب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div>تاریخ: <span className="font-bold">{record.date ? format(new Date(record.date), 'yyyy/MM/dd') : '-'}</span></div>
            <div>ثبت کننده: <span className="font-bold">{record.user ? `${record.user.fname} ${record.user.lname}` : '-'}</span></div>
          </div>
          {/* Mobile view: Cards */}
          <div className="md:hidden">
            <h3 className="font-bold mb-2">دانش آموزان ({totalStudents} نفر)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnimatePresence>
              {currentStudents.map((student: WeekAbsentStudent, idx: number) => (
                <motion.div 
                  key={student.student_id}
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 32 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  layout
                >
                  <Card className="p-3 sm:p-4 flex flex-col items-center text-center border rounded-2xl shadow bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 dark:border-zinc-700 dark:text-zinc-100 min-w-0 w-full max-w-xs mx-auto sm:max-w-none sm:w-auto">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-2 text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {student.student?.Fname?.charAt(0) || '?'}
                    </div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 mb-1 text-base sm:text-lg">{student.student?.Fname} {student.student?.Lname}</div>

                    <div className="flex items-center justify-center gap-2 mb-1">
                      {student.absent === "1" ? (
                        <Badge variant="destructive">غایب</Badge>
                      ) : student.delay === "1" ? (
                        <Badge variant="secondary">تاخیر</Badge>
                      ) : (
                        <Badge variant="default">حاضر</Badge>
                      )}
                      {Number(student.status) === 1 ? (
                        <Badge 
                          variant="outline" 
                          className="text-green-600 border-green-600 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900 transition-colors"
                          onClick={() => handleStatusChange(student.student_id, student.status)}
                        >
                          {updatingStatus === student.student_id ? '...' : 'کنترل شده'}
                        </Badge>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className="text-orange-600 border-orange-600 cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900 transition-colors"
                          onClick={() => handleStatusChange(student.student_id, student.status)}
                        >
                          {updatingStatus === student.student_id ? '...' : 'کنترل نشده'}
                        </Badge>
                      )}
                    </div>
                    {student.delay === "1" && student.delay_time && (
                      <span className="inline-block bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-semibold px-2 py-0.5 rounded mb-1">تاخیر: {student.delay_time}</span>
                    )}
                    {student.absent === "1" && student.absent_reason && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{student.absent_reason}</span>
                    )}
                  </Card>
                </motion.div>
              ))}
              </AnimatePresence>
            </div>
          </div>
          {/* Desktop view: Table */}
          <div className="hidden md:block">
            <h3 className="font-bold mb-2">قرآن آموزان ({totalStudents} نفر)</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">نام</TableHead>
                  <TableHead className="text-right">نام پدر</TableHead>
                  <TableHead className="text-right">وضعیت</TableHead>
                  <TableHead className="text-right">تاخیر</TableHead>
                  <TableHead className="text-right">مدت زمان تاخیر</TableHead>
                  <TableHead className="text-right">کنترل</TableHead>
                  <TableHead className="text-right">جزئیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody> 
                {currentStudents.map((student) => (
                  <TableRow key={student.student_id}>
                    <TableCell className="text-right">{student.student?.Fname} {student.student?.Lname}</TableCell>
                    <TableCell className="text-right">{student.student?.FatherName || '-'}</TableCell>
                    <TableCell className="text-right">
                      {student.absent === "1" ? <Badge variant="destructive">غایب</Badge> : student.delay === "1" ? <Badge variant="secondary">تاخیر</Badge> : <Badge variant="default">حاضر</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {student.delay === "1" ? "دارد" : "ندارد"}
                    </TableCell>
                    <TableCell className="text-right">
                      {student.delay === "1" && student.delay_time}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(student.status) === 1 ? (
                        <Badge 
                          variant="outline" 
                          className="text-green-600 border-green-600 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900 transition-colors"
                          onClick={() => handleStatusChange(student.student_id, student.status)}
                        >
                          {updatingStatus === student.student_id ? '...' : 'کنترل شده'}
                        </Badge>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className="text-orange-600 border-orange-600 cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900 transition-colors"
                          onClick={() => handleStatusChange(student.student_id, student.status)}
                        >
                          {updatingStatus === student.student_id ? '...' : 'کنترل نشده'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(student.delay) === 1 && student.delay_time && (
                        <span className="inline-block bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-semibold px-2 py-0.5 rounded">تاخیر: {student.delay_time}</span>
                      )}
                      {Number(student.absent) === 1 && student.absent_reason && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{student.absent_reason}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 px-2 space-y-4">
              {/* Mobile pagination */}
              <div className="flex flex-col gap-3 sm:hidden">
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  صفحه {currentPage} از {totalPages} ({totalStudents} دانش آموز)
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3"
                  >
                    <ChevronRight className="h-4 w-4" />
                    قبلی
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage <= 2) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 1) {
                        pageNum = totalPages - 2 + i;
                      } else {
                        pageNum = currentPage - 1 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0 text-xs"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3"
                  >
                    بعدی
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Desktop pagination */}
              <div className="hidden sm:flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  صفحه {currentPage} از {totalPages} ({totalStudents} دانش آموز)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronRight className="h-4 w-4" />
                    قبلی
                  </Button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1"
                  >
                    بعدی
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </PageTransition>
  );
}