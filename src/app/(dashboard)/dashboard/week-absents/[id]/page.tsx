"use client";

import { WeekAbsentService, WeekAbsent, WeekAbsentStudent } from '@/lib/services/weekAbsent.service';
import { useAuth } from '@/lib/context/auth.context';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns-jalali';
import { motion, AnimatePresence } from 'framer-motion';

export default function WeekAbsentDetailPage() {
  const { id } = useParams();
  const { accessToken } = useAuth();
  const router = useRouter();
  const [record, setRecord] = useState<WeekAbsent | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

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

  const handleStatusChange = async (studentId: number, currentStatus: number) => {
    if (!record || !accessToken) return;
    
    setUpdatingStatus(studentId);
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      
      // Update local state immediately for better UX
      setRecord(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          students: prev.students.map(student => 
            student.student_id === studentId 
              ? { ...student, status: newStatus }
              : student
          )
        };
      });

      // Send update to server
      const updatedStudents = record.students.map(student => 
        student.student_id === studentId 
          ? { ...student, status: newStatus }
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
              ? { ...student, status: currentStatus }
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

  return (
    <div className="container mx-auto p-6 space-y-6">
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
          <div>
            <h3 className="font-bold mb-2">دانش آموزان</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnimatePresence>
              {record.students.map((student: WeekAbsentStudent, idx: number) => (
                <motion.div
                  key={student.student_id}
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 32 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  layout
                >
                  <Card className="p-3 sm:p-4 flex flex-col items-center text-center border rounded-2xl shadow bg-gradient-to-br from-zinc-50 to-zinc-100 min-w-0 w-full max-w-xs mx-auto sm:max-w-none sm:w-auto">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-2 text-xl sm:text-2xl font-bold text-emerald-600">
                      {student.student?.Fname?.charAt(0) || '?'}
                    </div>
                    <div className="font-medium text-zinc-900 mb-1 text-base sm:text-lg">{student.student?.Fname} {student.student?.Lname}</div>
                    <div className="text-xs text-zinc-500 mb-2">کد دانش آموزی: {student.student?.StudentCode}</div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {student.absent ? (
                        <Badge variant="destructive">غایب</Badge>
                      ) : student.delay ? (
                        <Badge variant="secondary">تاخیر</Badge>
                      ) : (
                        <Badge variant="default">حاضر</Badge>
                      )}
                      {student.status === 1 ? (
                        <Badge 
                          variant="outline" 
                          className="text-green-600 border-green-600 cursor-pointer hover:bg-green-50 transition-colors"
                          onClick={() => handleStatusChange(student.student_id, student.status)}
                        >
                          {updatingStatus === student.student_id ? '...' : 'کنترل شده'}
                        </Badge>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className="text-orange-600 border-orange-600 cursor-pointer hover:bg-orange-50 transition-colors"
                          onClick={() => handleStatusChange(student.student_id, student.status)}
                        >
                          {updatingStatus === student.student_id ? '...' : 'کنترل نشده'}
                        </Badge>
                      )}
                    </div>
                    {student.delay && student.delay_time && (
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded mb-1">تاخیر: {student.delay_time}</span>
                    )}
                    {student.absent && student.absent_reason && (
                      <span className="text-xs text-gray-500">{student.absent_reason}</span>
                    )}
                  </Card>
                </motion.div>
              ))}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 