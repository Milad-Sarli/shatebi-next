'use client';

import { useEffect, useState } from 'react';
import { AppRoleService, AppRole } from '@/lib/services/approle.service';
import { StudentService, Student } from '@/lib/services/student.service';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/context/auth.context';

const roleTranslations = {
  admin: 'مدیر',
  master: 'استاد',
};

export default function RolesPage() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const { toast } = useToast();
  const { accessToken } = useAuth();

  useEffect(() => {
    if (accessToken) {
      fetchRoles();
      fetchStudents();
    }
  }, [accessToken]);

  const fetchRoles = async () => {
    try {
      const response = await AppRoleService.getAppRoles({}, accessToken!);
      setRoles(response.data);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'در دریافت لیست نقش‌ها مشکلی پیش آمده است',
        variant: 'destructive',
      });
    }
  };

  const fetchStudents = async () => {
    if (!accessToken) return;
    setIsStudentsLoading(true);
    try {
      const response = await StudentService.getStudents({ per_page: 10000 }, accessToken!);
      const studentsArr = response?.data?.data ?? [];
      setStudents(studentsArr);
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'در دریافت لیست دانش‌آموزان مشکلی پیش آمده است',
        variant: 'destructive',
      });
      setStudents([]);
    } finally {
      setIsStudentsLoading(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (open) {
      fetchStudents();
    }
  };

  const handleCreateRole = async () => {
    if (!selectedStudent || !selectedRole) {
      toast({
        title: 'خطا',
        description: 'لطفا دانش‌آموز و نقش را انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await AppRoleService.createAppRole(
        {
          name: selectedRole,
          user_id: parseInt(selectedStudent),
        },
        accessToken!
      );
      toast({
        title: 'موفق',
        description: 'نقش با موفقیت ایجاد شد',
      });
      fetchRoles();
      setSelectedStudent('');
      setSelectedRole('');
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'در ایجاد نقش مشکلی پیش آمده است',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!Array.isArray(students)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-300 via-blue-200 to-purple-200">
        <div className="text-center py-8 text-lg font-semibold text-gray-700">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-300 via-blue-200 to-purple-200 flex items-center justify-center py-10" dir="rtl">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <h1 className="text-3xl font-extrabold text-gray-800 text-center md:text-right">مدیریت نقش‌ها</h1>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-green-400 text-white font-bold px-6 py-2 rounded-lg shadow hover:from-blue-600 hover:to-green-500 transition-all duration-200">
                ایجاد نقش جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl p-6 max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold mb-4">ایجاد نقش جدید</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">دانش‌آموز</label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent} disabled={isStudentsLoading}>
                    <SelectTrigger className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400">
                      <SelectValue placeholder={isStudentsLoading ? 'در حال بارگذاری...' : 'دانش‌آموز را انتخاب کنید'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {isStudentsLoading ? (
                        <div className="py-2 px-3 text-gray-400">در حال بارگذاری...</div>
                      ) : students.length === 0 ? (
                        <div className="py-2 px-3 text-gray-400">دانش‌آموزی یافت نشد</div>
                      ) : (
                        students.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()} className="py-2 px-3 hover:bg-blue-50">
                            {student.Fname} {student.Lname}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">نقش</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400">
                      <SelectValue placeholder="نقش را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin" className="py-2 px-3 hover:bg-blue-50">مدیر</SelectItem>
                      <SelectItem value="master" className="py-2 px-3 hover:bg-blue-50">مربی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleCreateRole}
                  disabled={isLoading || isStudentsLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-green-400 text-white font-bold py-2 rounded-lg shadow hover:from-blue-600 hover:to-green-500 transition-all duration-200"
                >
                  {isLoading ? 'در حال ایجاد...' : 'ایجاد نقش'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <hr className="mb-6 border-gray-200" />
        <div className="overflow-x-auto rounded-lg">
          <Table className="w-full text-center">
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-blue-100 to-green-100">
                <TableHead className="text-gray-700 font-bold text-lg">شناسه کاربر</TableHead>
                <TableHead className="text-gray-700 font-bold text-lg">نام نقش</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="py-6 text-gray-400">هیچ نقشی وجود ندارد</TableCell>
                </TableRow>
              ) : (
                roles.map((role, idx) => (
                  <TableRow
                    key={role.id}
                    className={
                      idx % 2 === 0
                        ? 'bg-white hover:bg-blue-50 transition-all duration-150'
                        : 'bg-gray-50 hover:bg-blue-50 transition-all duration-150'
                    }
                  >
                    <TableCell className="py-3 text-lg text-gray-700">{role.user_id}</TableCell>
                    <TableCell className="py-3 text-lg font-semibold text-gray-800">
                      {roleTranslations[role.name as keyof typeof roleTranslations] || role.name}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
