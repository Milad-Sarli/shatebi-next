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
  Home,
  BookMarked,
  ListChecks,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth.context";
import { Calendar } from "react-multi-date-picker";
import { getRequiredRoles, hasRole, type RequiredRole } from "@/lib/config/route-permissions";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  setSidebarOpen?: (open: boolean) => void;
}

// Define a type for nav items
interface NavItem {
  title: string;
  href?: string; // Optional for groups that are not direct links
  icon: React.ElementType;
  requiredRole?: RequiredRole;
  subItems?: Omit<NavItem, 'subItems' | 'isGroup'>[]; // Sub-items don't have further sub-items
  isGroup?: boolean; // To distinguish groups in the processed list
}

// Menu structure is defined here (titles, icons, grouping). The required role
// for each entry is derived from the single source of truth in
// `@/lib/config/route-permissions` so menu visibility and direct-URL access
// control can never diverge.
const rawItems: Omit<NavItem, 'requiredRole'>[] = [
  {
    title: "داشبورد",
    href: "/dashboard",
    icon: Home,
  },
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
    title: "قرآن آموزان",
    href: "/dashboard/students",
    icon: GraduationCap,
  },
  {
    title: "اساتید و مربیان ",
    href: "/dashboard/masters",
    icon: Briefcase,
  },
  {
    title: "کلاس‌ها",
    href: "/dashboard/optimizedClasses",
    icon: BookOpen,
  },
  {
    title: "ثبت نمرات",
    href: "/dashboard/optimizedNumbers/add",
    icon: GraduationCap,
  },
  {
    title: "نمرات",
    href: "/dashboard/optimizedNumbers",
    icon: GraduationCap,
  },
  {
    title: "متقاضیان ثبت نام",
    href: "/dashboard/applicants",
    icon: UserPlus,
  },
  {
    title: "حضور غیاب هفتگی",
    href: "/dashboard/week-absents",
    icon: Clock,
  },
  {
    title: "مدیریت مرخصی ها",
    icon: BookOpen,
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
      },
      {
        title: "مرخصی‌های در انتظار تایید",
        href: "/dashboard/waiting-morakhasi",
        icon: Clock,
      },
      {
        title: "نگهبانی",
        href: "/dashboard/guard",
        icon: Shield,
      },
    ],
  },
  {
    title: "جزء خوانی قرآن",
    icon: BookMarked,
    subItems: [
      {
        title: "داشبورد جزء خوانی",
        href: "/dashboard/juz",
        icon: Library,
      },
      {
        title: "مدیریت تکالیف هفتگی",
        href: "/dashboard/juz/assignments",
        icon: ListChecks,
      },
      {
        title: "ثبت قرائت",
        href: "/dashboard/juz/reading-logs",
        icon: BookMarked,
      },
      {
        title: "لیست تکالیف",
        href: "/dashboard/juz/task-list",
        icon: ListChecks,
      },
    ],
  },
  {
    title: "گزارشات و آمار ها",
    href: "/dashboard/reports",
    icon: BookOpen,
  },
  {
    title: "درجه بندی",
    href: "/dashboard/degrees",
    icon: GraduationCap,
  },
];

// Attach requiredRole from the central permission config (longest-prefix match).
const items: NavItem[] = rawItems.map((item) => {
  if (item.subItems) {
    return {
      ...item,
      requiredRole: getRequiredRoles(item.subItems[0]?.href ?? ''),
      subItems: item.subItems.map((sub) => ({
        ...sub,
        requiredRole: getRequiredRoles(sub.href ?? ''),
      })),
    };
  }
  return { ...item, requiredRole: getRequiredRoles(item.href ?? '') };
});

export function Sidebar({ className, setSidebarOpen, ...props }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({});

  const hasRequiredRole = (requiredRole?: RequiredRole) => {
    if (!user?.app_roles) return requiredRole ? false : true;
    const userRoles = user.app_roles.map((role) => role.name);
    return hasRole(userRoles, requiredRole ?? null);
  };

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const processedItems = React.useMemo(() => {
    return items.map(item => {
      if (item.subItems) {
        if (!hasRequiredRole(item.requiredRole)) return null;
        const visibleSubItems = item.subItems.filter(subItem => hasRequiredRole(subItem.requiredRole));
        if (visibleSubItems.length > 0) {
          return { ...item, subItems: visibleSubItems, isGroup: true };
        }
        return null;
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
                        onClick={() => setSidebarOpen && setSidebarOpen(false)}
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
              onClick={() => setSidebarOpen && setSidebarOpen(false)}
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
