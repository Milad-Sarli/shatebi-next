"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/context/auth.context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import PusherTest from "@/components/PusherTest";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import NotificationDisplay, { Notification } from "@/components/NotificationDisplay";
import { fetchNotifications } from "@/lib/services/notification.service";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { user, accessToken, logout } = useAuth();
  // const { theme, toggleTheme } = useTheme();

  // Notification state for mobile header
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  React.useEffect(() => {
    if (!accessToken) return;
    fetchNotifications(accessToken).then(setNotifications);
  }, [accessToken]);
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: sidebarOpen ? 0 : "100%" }}
        transition={{ type: "spring", damping: 20 }}
        className="fixed inset-y-0 right-0 z-50 w-72 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-xl md:hidden"
      >
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center justify-between mb-6">
            <Link prefetch href="/dashboard" className="flex items-center gap-2">
              <Image src="/fav-icon.png" alt="Logo" width={32} height={32} className="h-8 w-8" />
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                سامانه جامع آموزشی
                <br />
                <span className="text-sm">دارالقرآن امام شاطبی (رح)</span>
              </span>
            </Link>
            <Button
              variant="ghost" 
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <Sidebar className="flex-1" setSidebarOpen={setSidebarOpen} />
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src="/avatars/default.svg"
                    alt={user?.username}
                  />
                  <AvatarFallback className="bg-blue-600 text-white dark:bg-blue-500">
                    {getUserInitials(user?.username || "")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-0.5 text-sm">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {user?.username}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {user?.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
              
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="relative h-7 w-7 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          aria-label="Notifications"
                        >
                          <Bell className="h-4 w-4" />
                          {/* TODO: Add badge for unread count if needed */}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-80 bg-white dark:bg-zinc-900  border border-zinc-200 dark:border-zinc-800 p-0"
                        align="end"
                      >
                        <div className="p-2 border-b  border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-700 dark:text-zinc-200 text-sm text-right">اعلان‌ها</div>
                        <NotificationDisplay />
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <ThemeToggleButton  variant="circle-blur" start="bottom-right" />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                    align="end"
                  >
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      خروج از حساب کاربری
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Desktop sidebar */}
      <div className="sticky top-0 h-screen w-64 border-l border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 hidden md:block relative overflow-hidden">
        {/* Wavy gradient background */}
        <div className="absolute inset-0 -z-10">
          <svg width="100%" height="100%" viewBox="0 0 320 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              <linearGradient id="sidebarGradient" x1="0" y1="0" x2="0" y2="1" gradientTransform="scale(1 4)">
                <stop offset="0%" stopColor="#40ffaa" />
                <stop offset="100%" stopColor="#4079ff" />
              </linearGradient>
            </defs>
            <path d="M0,0 Q80,80 160,0 T320,0 V800 H0 Z" fill="url(#sidebarGradient)" fillOpacity="0.18" />
            <path d="M0,200 Q80,280 160,200 T320,200 V800 H0 Z" fill="url(#sidebarGradient)" fillOpacity="0.12" />
          </svg>
        </div>
        {/* End wavy gradient background */}
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between mb-6">
            <Link prefetch href="/dashboard" className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Image src="/fav-icon.png" alt="Logo" width={32} height={32} className="h-8 w-8" />
              <div className="overflow-hidden w-48 sm:w-64 md:w-80" style={{ direction: "rtl" }}>
                <span
                  className="inline-block whitespace-nowrap text-base font-semibold text-blue-600 dark:text-blue-400 animate-marquee"
                  style={{
                    animation: "marquee 5s linear infinite",
                  }}
                >
                  سامانه جامع آموزشی دارالقرآن امام شاطبی (رح)
                </span>
                <style jsx>{`
                  @keyframes marquee {
                    0% {
                      transform: translateX(-100%);
                    }
                    100% {
                      transform: translateX(100%);
                    }
                  }
                `}</style>
            </div>
            </div>
            </Link>
          
          </div>
          <Sidebar className="flex-1" setSidebarOpen={setSidebarOpen} />
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src="/avatars/default.svg"
                    alt={user?.fname + " " + user?.lname}
                  />
                  <AvatarFallback className="bg-blue-600 text-white dark:bg-blue-500">
                    {getUserInitials(user?.username || "")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-0.5 text-sm">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {user?.fname + " " + user?.lname}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {user?.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="relative h-7 w-7 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          aria-label="Notifications"
                        >
                          <Bell className="h-4 w-4" />
                          {/* TODO: Add badge for unread count if needed */}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0"
                        align="end"
                      >
                        <div className="p-2 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-700 dark:text-zinc-200 text-sm text-right">اعلان‌ها</div>
                        <NotificationDisplay />
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <ThemeToggleButton  variant="circle-blur" start="bottom-right" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                    align="end"
                  >
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      خروج از حساب کاربری
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 relative overflow-hidden">
     
        {/* Header for mobile */}
        <div className="sticky top-0 z-30 flex items-center p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {/* Add Logo and Title here for mobile view */}
          <div className="flex items-center gap-2 mx-auto">
            <Image src="/fav-icon.png" alt="Logo" width={24} height={24} className="h-6 w-6" />
            <div className="overflow-hidden w-48 sm:w-64 md:w-80" style={{ direction: "rtl" }}>
              <span
                className="inline-block whitespace-nowrap text-base font-semibold text-blue-600 dark:text-blue-400 animate-marquee"
                style={{
                  animation: "marquee 10s linear infinite",
                }}
              >
                سامانه جامع آموزشی دارالقرآن امام شاطبی (رح)
              </span>
              <style jsx>{`
                @keyframes marquee {
                  0% {
                    transform: translateX(100%);
                  }
                  100% {
                    transform: translateX(-100%);
                  }
                }
              `}</style>
            </div>
          </div>
          {/* Notification Bell on left */}
          <div className="relative ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="relative rounded-full p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  aria-label="اعلان‌ها"
                >
                  <Bell className="h-5 w-5 text-blue-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0"
                align="end"
              >
                <div className="p-2 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-700 dark:text-zinc-200 text-sm text-right">
                  اعلان‌ها
                </div>
                <NotificationDisplay />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="p-4 md:p-6 relative">
          <AnimatePresence mode="wait">
            {children}
            </AnimatePresence>
            <PusherTest />
        </div>
      </div>
    </div>
  );
}
