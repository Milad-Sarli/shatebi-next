"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/context/auth.context";
import { useTheme } from "@/lib/context/theme.context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Aurora from "@/components/reactbit/backgrounds/Aurora/Aurora";
import GradientText from "@/components/reactbit/texts/GradientText";
interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
          <Link href="/dashboard">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <img src="/fav-icon.png" alt="Logo" className="h-8 w-8" />
                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  دارالقرآن
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </Link>
          <Sidebar className="flex-1" />
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-7 w-7 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  {theme === "light" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Button>
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
      <div className="sticky top-0 h-screen w-64 border-l border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 hidden md:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <img src="/fav-icon.png" alt="Logo" className="h-8 w-8" />
              <GradientText
                colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
                animationSpeed={3}
                showBorder={false}
                className="text-xl font-bold"
              >
                دارالقرآن
              </GradientText>
            </div>
          </div>
          <Sidebar className="flex-1" />
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-7 w-7 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  {theme === "light" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Button>
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
      <div className="flex-1 relative">
        <div className="absolute -top-10 w-full h-full">
          <Aurora
            colorStops={["#00CFFF", "#6CF964", "#00CFFF"]}
            blend={0.2}
            amplitude={0.2}
            speed={0.5}
            />
        </div>
        {/* Header for mobile */}
        <div className="sticky top-0 z-30 flex items-center p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="ml-auto text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 md:p-6 relative">
          <AnimatePresence mode="wait">
            {children}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
