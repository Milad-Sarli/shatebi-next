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
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth.context";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

// Define a type for nav items
interface NavItem {
  title: string;
  href?: string; // Optional for groups that are not direct links
  icon: React.ElementType;
  requiredRole?: string | string[];
  subItems?: Omit<NavItem, 'subItems' | 'isGroup'>[]; // Sub-items don't have further sub-items
  isGroup?: boolean; // To distinguish groups in the processed list
}

const items: NavItem[] = [
  {
    title: "مدیریت کاربران",
    href: "/dashboard/users",
    icon: Users,
    requiredRole: "admin",
  },
  {
    title: "نقش‌ها و دسترسی‌ها",
    href: "/dashboard/roles",
    icon: Shield,
    requiredRole: "admin",
  },
  {
    title: "دروس",
    href: "/dashboard/lessons",
    icon: BookOpen,
    requiredRole: "admin",
  },
  {
    title: "قرآن آموزان",
    href: "/dashboard/students",
    icon: GraduationCap,
    requiredRole: "admin",
  },
  {
    title: "اساتید و مربیان ",
    href: "/dashboard/masters",
    icon: Briefcase,
    requiredRole: "admin",
  },
  {
    title: "کلاس‌ها",
    href: "/dashboard/optimizedClasses",
    icon: BookOpen,
    requiredRole: "admin",
  },
  {
    title: "نمرات",
    href: "/dashboard/optimizedNumbers",
    icon: GraduationCap,
    requiredRole: ["admin", "master"],
  },
  {
    title: "ثبت نمرات",
    href: "/dashboard/optimizedNumbers/add",
    icon: GraduationCap,
    requiredRole: ["admin", "master"],
  },
  {
    title: "متقاضیان ثبت نام",
    href: "/dashboard/applicants",
    icon: UserPlus,
    requiredRole: "admin",
  },
  {
    title: "مدیریت مرخصی ها",
    icon: BookOpen, // Or a more generic group icon if preferred
    subItems: [
      {
        title: "مرخصی‌ها",
        href: "/dashboard/leaves",
        icon: BookOpen,
      },
      {
        title: "درخواست مرخصی جدید",
        href: "/dashboard/leaves/new",
        icon: BookOpen,
        requiredRole: ["admin", "master"],
      },
      {
        title: "مرخصی‌های در انتظار تایید",
        href: "/dashboard/waiting-morakhasi",
        icon: Clock, // Changed to Clock icon to represent waiting/pending status
        requiredRole: "admin",
      },
      {
        title: "نگهبانی",
        href: "/dashboard/guard",
        icon: Shield, // Icon specific to this sub-item
        requiredRole: ["admin", "guard"],
      },
    ],
  },
  {
    title: "گزارشات و آمار ها",
    href: "/dashboard/reports",
    icon: BookOpen,
    requiredRole: "admin",
  },
];

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({});

  const hasRequiredRole = (requiredRole?: string | string[]) => {
    // If no requiredRole is specified, the item is visible to everyone.
    if (!requiredRole) return true;
    if (!user?.app_roles) return false;

    const userRoles = user.app_roles.map(role => role.name);

    if (Array.isArray(requiredRole)) {
      return requiredRole.some(role => userRoles.includes(role));
    }
    return userRoles.includes(requiredRole);
  };

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const processedItems = React.useMemo(() => {
    return items.map(item => {
      if (item.subItems) {
        const visibleSubItems = item.subItems.filter(subItem => hasRequiredRole(subItem.requiredRole));
        if (visibleSubItems.length > 0) {
          return { ...item, subItems: visibleSubItems, isGroup: true };
        }
        return null; // Filter out group if no subItems are visible
      }
      if (hasRequiredRole(item.requiredRole)) {
        return { ...item, isGroup: false };
      }
      return null;
    }).filter(Boolean) as NavItem[];
  }, [user, items]);


  return (
    <nav className={cn("space-y-2", className)} {...props}>
      {processedItems.map((item) => {
        const Icon = item.icon;
        const isOpen = item.isGroup && item.title ? openSections[item.title] : false;

        if (item.isGroup && item.subItems && item.subItems.length > 0) {
          const isGroupActive = item.subItems.some(sub => sub.href && pathname === sub.href);
          return (
            <div key={item.title} className="space-y-1">
              <button
                onClick={() => toggleSection(item.title)}
                className={cn(
                  "group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  isGroupActive ? "bg-accent text-accent-foreground" : "transparent",
                  "justify-between" // Ensures title is to the left and chevron to the right
                )}
              >
                <div className="flex items-center">
                  <Icon className="ml-2 h-4 w-4" />
                  <span className="text-right">{item.title}</span>
                </div>
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {isOpen && (
                <div className="mr-4 mt-1 space-y-1 border-r border-gray-700 pr-2"> {/* Indent sub-items & add a visual indicator */}
                  {item.subItems.map(subItem => {
                    // Ensure subItem.icon is a valid component. If not, provide a default or handle.
                    const SubIcon = subItem.icon || BookOpen; // Fallback icon if needed
                    const isSubActive = pathname === subItem.href;
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href!}
                        className={cn(
                          "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground w-full",
                          isSubActive ? "bg-accent text-accent-foreground" : "transparent"
                        )}
                      
                      >
                        <SubIcon className="ml-2 h-4 w-4" />
                        <span className="text-right">{subItem.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        } else if (!item.isGroup && item.href) { // Regular item
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "transparent"
              )}
            >
              <Icon className="ml-2 h-4 w-4" />
              <span className="text-right">{item.title}</span>
            </Link>
          );
        }
        return null;
      })}
    </nav>
  );
}
