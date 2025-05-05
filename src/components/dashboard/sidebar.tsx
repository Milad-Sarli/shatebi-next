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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

const items = [
  {
    title: "مدیریت کاربران",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "نقش‌ها و دسترسی‌ها",
    href: "/dashboard/roles",
    icon: Shield,
  },
  {
    title: "دروس",
    href: "/dashboard/lessons",
    icon: BookOpen,
  },
  {
    title: "دانش آموزان",
    href: "/dashboard/students",
    icon: GraduationCap,
  },
  {
    title: "اساتید",
    href: "/dashboard/masters",
    icon: Briefcase,
  },
  {
    title: "کلاس‌ها",
    href: "/dashboard/optimizedClasses",
    icon: BookOpen,
  },
  {
    title: "نمرات",
    href: "/dashboard/optimizedNumbers",
    icon: GraduationCap,
  },
];

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("space-y-2", className)} {...props}>
      {items.map((item) => {
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
