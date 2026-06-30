"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { StudentForm } from "../student-form";
import { PageTransition } from "@/components/ui/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AddStudentPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/dashboard/students");
    // Assuming StudentForm or the service it uses handles success toast messages
  };

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg p-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 dark:from-blue-500/5 dark:via-emerald-500/5 dark:to-blue-500/5" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
              افزودن قرآن آموز جدید
            </h1>
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/students')}
              className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
            >
              <ArrowLeft className="ml-2 h-4 w-4" />
              بازگشت به لیست قرآن آموزان
            </Button>
          </div>
        </div>

        <Card className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-md">
          <CardContent className="p-6">
            <StudentForm onSuccess={handleSuccess} />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
} 