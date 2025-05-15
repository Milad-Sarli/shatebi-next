/* eslint-disable */
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  GraduationCap,
  BookOpen,
  Shield,
  Briefcase,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth.context";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

const items = [
  {
    title: "مدیریت کاربران",
    href: "/dashboard/users",
    icon: Users,
    requiredRole: "admin"
  },
  {
    title: "نقش‌ها و دسترسی‌ها",
    href: "/dashboard/roles",
    icon: Shield,
    requiredRole: "admin"
  },
  {
    title: "دروس",
    href: "/dashboard/lessons",
    icon: BookOpen,
    requiredRole: "admin"
  },
  {
    title: "قرآن آموزان",
    href: "/dashboard/students",
    icon: GraduationCap,
    requiredRole: "admin"
  },
  {
    title: "اساتید و مربیان ",
    href: "/dashboard/masters",
    icon: Briefcase,
    requiredRole: "admin"
  },
  {
    title: "کلاس‌ها",
    href: "/dashboard/optimizedClasses",
    icon: BookOpen,
    requiredRole: "admin"
  },
  {
    title: "نمرات",
    href: "/dashboard/optimizedNumbers",
    icon: GraduationCap,
    requiredRole: ["admin", "master"]
  },
  {
    title: "ثبت نمرات",
    href: "/dashboard/optimizedNumbers/add", 
    icon: GraduationCap,
    requiredRole: ["admin", "master"]
  },
  {
    title: "متقاضیان ثبت نام", 
    href: "/dashboard/applicants",
    icon: UserPlus,
    requiredRole: "admin"
  },
];

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const hasRequiredRole = (requiredRole: string | string[]) => {
    if (!user?.app_roles) return false;
    if (Array.isArray(requiredRole)) {
      return requiredRole.some(role => user?.app_roles?.some(userRole => userRole.name === role) ?? false);
    }
    return user?.app_roles?.some(role => role.name === requiredRole) ?? false;
  };

  const filteredItems = items.filter(item => {
    if (!item.requiredRole) return true;
    return hasRequiredRole(item.requiredRole);
  });

  return (
    <nav className={cn("space-y-2", className)} {...props}>
      {filteredItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              isActive ? "bg-accent" : "transparent"
            )}
          >
            <Icon className="ml-2 h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
