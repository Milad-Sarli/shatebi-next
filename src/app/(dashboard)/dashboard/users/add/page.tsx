"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/ui/page-transition";
import { UserForm } from "../user-form";

export default function AddUserPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/dashboard/users");
  };

  const handleCancel = () => {
    router.push("/dashboard/users");
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-3 sm:gap-6 w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {/* Header */}
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg p-4 overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 dark:from-blue-500/5 dark:via-emerald-500/5 dark:to-blue-500/5" />
          {/* Content */}
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
                افزودن کاربر جدید
              </h1>
            </div>
          </div>
        </div>
        {/* User Form Card */}
        <Card>
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <UserIcon className="h-5 w-5" />
              اطلاعات کاربر
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <UserForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
} 