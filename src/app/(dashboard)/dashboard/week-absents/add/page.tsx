'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { WeekAbsentService, WeekAbsentStudent } from '@/lib/services/weekAbsent.service';
import { CurrentlyStudyingStudentsService, CurrentlyStudyingStudent } from '@/lib/services/currently-studying-students.service';
import { useAuth } from '@/lib/context/auth.context';
import { Calendar, Save, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DateSelector from '../../optimizedNumbers/add/DateSelector';
import { DateObject } from 'react-multi-date-picker';

interface AttendanceFormData {
  date: string;
  students: WeekAbsentStudent[];
}

export default function AddWeekAbsentPage() {
  const { user, accessToken } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Form data
  const [formData, setFormData] = useState<AttendanceFormData>({
    date: '',
    students: []
  });

  // Date state for picker
  const [selectedDate, setSelectedDate] = useState<DateObject | null>(null);
  const [startedDate, setStartedDate] = useState<string | null>(null); // For change warning

  // Infinite scroll states
  const [students, setStudents] = useState<CurrentlyStudyingStudent[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastStudentRef = useRef<HTMLDivElement | null>(null);

  // Attendance state for each student
  const [attendance, setAttendance] = useState<Record<number, WeekAbsentStudent>>({});

  // Watch for date change to reset students and attendance
  useEffect(() => {
    setStudents([]);
    setAttendance({});
    setPage(1);
    setHasMore(true);
    setTotalStudents(0);
    setFormData(prev => ({ ...prev, date: selectedDate ? selectedDate.format('YYYY/MM/DD') : '' }));
  }, [selectedDate]);

  // Load students paginated
  const loadStudents = useCallback(async () => {
    if (!accessToken || !user?.tenant_id || !selectedDate || loadingStudents || !hasMore) return;
    setLoadingStudents(true);
    try {
      const response = await CurrentlyStudyingStudentsService.getCurrentlyStudyingStudents(
        user.tenant_id,
        { per_page: 15, paginate: 'on', page },
        accessToken
      );
      
      if (response.status === 'success') {
        let newStudents: CurrentlyStudyingStudent[] = [];
        let total = 0;
        
        if (Array.isArray(response.data)) {
          newStudents = response.data;
          total = response.data.length;
          setHasMore(false);
        } else {
          newStudents = response.data.data;
          total = response.data.total;
          setHasMore(response.data.current_page < response.data.last_page);
        }
        
        setTotalStudents(total);
        setStudents(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const filtered = newStudents.filter(s => !existingIds.has(s.id));
          return [...prev, ...filtered];
        });
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری دانش آموزان',
        type: 'destructive'
      });
    } finally {
      setLoadingStudents(false);
    }
  }, [accessToken, user, selectedDate, loadingStudents, hasMore, toast, page]);

  // Infinite scroll observer (attach only to last item, cleanup on unmount/change)
  useEffect(() => {
    if (observer.current) observer.current.disconnect();
    if (lastStudentRef.current && hasMore && !loadingStudents) {
      observer.current = new window.IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          setPage(prev => prev + 1);
        }
      });
      observer.current.observe(lastStudentRef.current);
    }
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [students, hasMore, loadingStudents]);

  // Load students when page or date changes
  useEffect(() => {
    if (selectedDate) {
      loadStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedDate]);

  // Handle attendance toggle
  const toggleAbsent = (student: CurrentlyStudyingStudent) => {
    setAttendance(prev => {
      const current = prev[student.id];
      if (current?.absent) {
        // Remove absent
        const { absent_reason, ...rest } = current;
        return { ...prev, [student.id]: { ...rest, absent: false, absent_reason: undefined } };
      } else {
        return {
          ...prev,
          [student.id]: {
            student_id: student.id,
            absent: true,
            delay: false,
            delay_time: null,
            absent_reason: '',
            status: 0,
            student: {
              id: student.id,
              Fname: student.Fname,
              Lname: student.Lname,
              Mellicode: student.Mellicode,
              StudentCode: student.StudentCode
            }
          }
        };
      }
    });
  };

  const toggleDelay = (student: CurrentlyStudyingStudent) => {
    setAttendance(prev => {
      const current = prev[student.id];
      if (current?.delay) {
        // Remove delay
        const { delay_time, ...rest } = current;
        return { ...prev, [student.id]: { ...rest, delay: false, delay_time: undefined } };
      } else {
        return {
          ...prev,
          [student.id]: {
            student_id: student.id,
            absent: false,
            delay: true,
            delay_time: '',
            absent_reason: null,
            status: 0,
            student: {
              id: student.id,
              Fname: student.Fname,
              Lname: student.Lname,
              Mellicode: student.Mellicode,
              StudentCode: student.StudentCode
            }
          }
        };
      }
    });
  };

  // Handle absent reason and delay time
  const setAbsentReason = (studentId: number, reason: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], absent_reason: reason }
    }));
  };
  const setDelayTime = (studentId: number, time: string) => {
    // Convert 'HH:mm' to 'HH:mm:00' for H:i:s format
    let formatted = time;
    if (time && /^\d{2}:\d{2}$/.test(time)) {
      formatted = time + ':00';
    }
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], delay_time: formatted }
    }));
  };

  // Create attendance records for all students (including present ones)
  const createAllAttendanceRecords = () => {
    const allAttendanceRecords: WeekAbsentStudent[] = students.map(student => {
      const existingRecord = attendance[student.id];
      if (existingRecord) {
        return existingRecord;
      } else {
        // Create default present record
        return {
          student_id: student.id,
          absent: false,
          delay: false,
          delay_time: null,
          absent_reason: null,
          status: 0,
          student: {
            id: student.id,
            Fname: student.Fname,
            Lname: student.Lname,
            Mellicode: student.Mellicode,
            StudentCode: student.StudentCode
          }
        };
      }
    });
    return allAttendanceRecords;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!accessToken || !selectedDate) return;
    
    const allAttendanceRecords = createAllAttendanceRecords();
    setFormData(prev => ({ ...prev, students: allAttendanceRecords }));
    
    try {
      const response = await WeekAbsentService.create({ 
        date: selectedDate.format('YYYY/MM/DD'), 
        students: allAttendanceRecords 
      }, accessToken);
      
      if (response.status === 'success') {
        setStartedDate(selectedDate.format('YYYY/MM/DD'));
        toast({
          title: 'موفقیت',
          description: 'حضور و غیاب با موفقیت ثبت شد'
        });
        router.push('/dashboard/week-absents');
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ثبت حضور و غیاب',
        type: 'destructive'
      });
    }
  };

  // Handle date change warning
  const handleDateChange = (date: DateObject | null) => {
    if (startedDate && date && startedDate !== date.format('YYYY/MM/DD')) {
      if (!window.confirm(`شما حضور و غیاب تاریخ ${startedDate} را شروع کردید. آیا مطمئن هستید که می‌خواهید برای تاریخ ${date.format('YYYY/MM/DD')} حضور و غیاب را شروع کنید؟`)) {
        return;
      }
    }
    setSelectedDate(date);
  };

  // Calculate attendance statistics
  const absentCount = Object.values(attendance).filter(a => a.absent).length;
  const delayCount = Object.values(attendance).filter(a => a.delay).length;
  const presentCount = students.length - absentCount - delayCount;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">افزودن حضور و غیاب جدید</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/week-absents')}
          className="bg-gray-100 text-gray-700 border-gray-300 rounded-lg hover:bg-gray-200"
        >
          بازگشت به لیست
        </Button>
      </div>
      
      <Card className="max-w-md mx-auto mt-12 shadow-lg rounded-2xl border border-gray-100">
        <CardHeader className="flex flex-col items-center justify-center text-center pb-0">
          <CardTitle className="flex items-center justify-center text-xl font-bold text-gray-800 mb-2">
            <Calendar className="w-6 h-6 ml-2 text-blue-500" />
            انتخاب تاریخ
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6 pt-0 pb-8">
          <div className="w-full flex flex-col items-center">
            <Label htmlFor="date" className="text-base text-gray-500 mb-2">تاریخ حضور و غیاب</Label>
            <div className="w-64">
              <DateSelector
                selectedDate={selectedDate}
                onChange={handleDateChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 ml-2" />
              لیست قرآن‌آموزان
            </CardTitle>
            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <p className="text-blue-800">
                تاریخ انتخاب شده: {selectedDate.format('YYYY/MM/DD')}
              </p>
              <p className="text-blue-600 mt-2">
                تعداد کل: {totalStudents} نفر | بارگذاری شده: {students.length} نفر
              </p>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4 space-x-reverse">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 mx-1">
                  تاخیر: {delayCount}
                </Badge>
                <Badge variant="destructive" className="bg-red-100 text-red-800 mx-1">
                  غایب: {absentCount}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
              {students.map((student, idx) => {
                const att = attendance[student.id] || { absent: false, delay: false };
                const isLast = idx === students.length - 1;
                return (
                  <div
                    key={student.id}
                    ref={isLast ? lastStudentRef : undefined}
                    className="flex flex-col p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 mb-3">
                      <p className="font-medium text-gray-900 mb-1">
                        {student.Fname} {student.Lname}
                      </p>
                      <p className="text-sm text-gray-500">
                        کد: {student.StudentCode}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant={att.absent ? 'destructive' : 'outline'}
                        size="sm"
                        className={`transition-colors ${att.absent ? 'bg-red-500 text-white hover:bg-red-600' : 'hover:bg-gray-50'}`}
                        onClick={() => toggleAbsent(student)}
                      >
                        غیبت
                      </Button>
                      {att.absent && (
                        <Input
                          placeholder="دلیل غیبت"
                          value={att.absent_reason || ''}
                          onChange={e => setAbsentReason(student.id, e.target.value)}
                          className="text-sm"
                          size={1}
                        />
                      )}
                      <Button
                        type="button"
                        variant={att.delay ? 'secondary' : 'outline'}
                        size="sm"
                        className={`transition-colors ${att.delay ? 'bg-yellow-400 text-white hover:bg-yellow-500' : 'hover:bg-gray-50'}`}
                        onClick={() => toggleDelay(student)}
                      >
                        تاخیر
                      </Button>
                      {att.delay && (
                        <Input
                          type="time"
                          step="1"
                          value={att.delay_time ? att.delay_time.slice(0, 5) : ''}
                          onChange={e => setDelayTime(student.id, e.target.value)}
                          className="text-sm rounded-full border border-gray-300 px-3 py-1 focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 bg-gray-50 placeholder:text-gray-400 text-right"
                          size={1}
                          placeholder="ساعت تاخیر..."
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              {loadingStudents && (
                <div className="col-span-full text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">در حال بارگذاری...</p>
                </div>
              )}
              {!hasMore && students.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-400">
                  دانش‌آموزی یافت نشد.
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <Button
                onClick={handleSubmit}
                disabled={loadingStudents || students.length === 0}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <Save className="w-4 h-4 ml-2" />
                ثبت حضور و غیاب
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 