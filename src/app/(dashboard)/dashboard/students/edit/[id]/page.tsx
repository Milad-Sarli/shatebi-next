"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/auth.context";
import { Student, StudentService } from "@/lib/services/student.service";
import { StudentForm } from "../../student-form";
import { PageTransition } from "@/components/ui/page-transition";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditStudentPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [student, setStudent] = React.useState<Student | null>(null);
  const [loading, setLoading] = React.useState(true);

  const studentId = params?.id as string;

  React.useEffect(() => {
    const fetchStudent = async () => {
      if (!accessToken || !studentId) return;

      try {
        setLoading(true);
        const response = await StudentService.getStudent(parseInt(studentId), accessToken);
        setStudent(response.data);
      } catch (error) {
        console.error("خطا در دریافت اطلاعات قرآن آموز:", error);
        toast.error("خطا در دریافت اطلاعات قرآن آموز");
        router.push("/dashboard/students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [accessToken, studentId, router]);

  const handleSuccess = () => {
    toast.success("قرآن آموز با موفقیت ویرایش شد");
    router.push("/dashboard/students");
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            در حال بارگذاری...
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!student) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              قرآن آموز یافت نشد
            </h2>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/students")}
              className="border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <ArrowRight className="ml-2 h-4 w-4" />
              بازگشت به لیست
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg bg-white dark:bg-zinc-900 p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/students")}
              className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              ویرایش قرآن آموز
            </h1>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <CardTitle className="text-zinc-900 dark:text-zinc-100">
              ویرایش اطلاعات {student.Fname} {student.Lname}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <StudentForm
              student={student}
              onSuccess={handleSuccess}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
} 