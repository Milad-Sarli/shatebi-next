"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as motion from "motion/react-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OTPInput } from "@/components/ui/otp-input";

export default function VerifyPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [otp, setOtp] = React.useState("");
  const router = useRouter();

  async function onSubmit() {
    setIsLoading(true);

    try {
      // TODO: Call your API endpoint here
      console.log(otp);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r"
      >
        <div className="absolute inset-0 bg-[url('/mosque-pattern.svg')] bg-cover bg-no-repeat opacity-50" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <img src="/logo.svg" alt="Logo" className="h-8 w-8 ml-2" />
          سامانه مدیریت دارالقرآن
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;خیرُکُم مَن تَعَلَّمَ القُرآنَ و عَلَّمَهُ&rdquo;
            </p>
            <footer className="text-sm">پیامبر اکرم (ص)</footer>
          </blockquote>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:p-8"
      >
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card>
            <CardHeader>
              <CardTitle>تایید کد</CardTitle>
              <CardDescription>
                لطفا کد ارسال شده به تلفن همراه خود را وارد نمایید
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <OTPInput
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={onSubmit}
                className="w-full"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? "در حال بررسی..." : "تایید و ورود"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
} 