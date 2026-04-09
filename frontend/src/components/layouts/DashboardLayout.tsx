/**
 * Dashboard Layout Component
 * Shared layout for student and company dashboards
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  FileText,
  Briefcase,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Users,
  PlusCircle,
  LayoutDashboard,
  Zap,
  Activity,
  AlertTriangle,
  Server,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/NotificationBell";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const studentNavItems: NavItem[] = [
  { name: "My Resumes", href: "/student/resumes", icon: FileText },
  { name: "Job Search", href: "/student/jobs", icon: Briefcase },
  { name: "Applications", href: "/student/applications", icon: ClipboardList },
  { name: "Settings", href: "/student/settings", icon: Settings },
];

const companyNavItems: NavItem[] = [
  { name: "Job Postings", href: "/company/jobs", icon: Briefcase },
  { name: "Applicants", href: "/company/applicants", icon: Users },
  { name: "Settings", href: "/company/settings", icon: Settings },
];

const adminNavItems: NavItem[] = [
  { name: "Overview", href: "/admin#overview", icon: Activity },
  { name: "System Health", href: "/admin#health", icon: Server },
  { name: "Users", href: "/admin#users", icon: Users },
  { name: "Errors", href: "/admin#errors", icon: AlertTriangle },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()!;
  const { user, logout, isStudent, isCompany, isAdmin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateHash = () => setCurrentHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  const navItems = isAdmin ? adminNavItems : isCompany ? companyNavItems : studentNavItems;
  const dashboardHome = isAdmin
    ? "/admin#overview"
    : isCompany
      ? "/company/jobs"
      : "/student/resumes";
  const effectiveHash = currentHash || (pathname === "/admin" ? "#overview" : "");

  const userMenuLink = isAdmin ? "/admin#overview" : isCompany ? "/company/settings" : "/student/settings";
  const userMenuLabel = isAdmin ? "Overview" : "Settings";
  const UserMenuIcon = isAdmin ? LayoutDashboard : Settings;

  const activeNavName = useMemo(() => {
    const activeItem = navItems.find((item) => {
      const [itemPath, itemHash] = item.href.split("#");
      if (pathname !== itemPath) {
        return pathname.startsWith(itemPath) && !itemHash;
      }
      if (!itemHash) {
        return pathname.startsWith(itemPath);
      }
      return effectiveHash === `#${itemHash}`;
    });

    return activeItem?.name || "Dashboard";
  }, [effectiveHash, navItems, pathname]);

  const isNavItemActive = (item: NavItem) => {
    const [itemPath, itemHash] = item.href.split("#");

    if (pathname !== itemPath) {
      return pathname.startsWith(itemPath) && !itemHash;
    }

    if (!itemHash) {
      return pathname.startsWith(itemPath);
    }

    return effectiveHash === `#${itemHash}`;
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-surface-900 transition-transform duration-200 lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col border-r border-surface-200 dark:border-surface-800">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-surface-200 dark:border-surface-800">
            <Link href={dashboardHome} className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-surface-900 dark:text-white">
                SmartCareer
              </span>
            </Link>
            <button
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-surface-500" />
            </button>
          </div>

          {/* AI Feature CTA */}
          {isStudent && (
            <div className="mx-4 mt-4 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5" />
                <span className="font-semibold">AI Resume Builder</span>
              </div>
              <p className="text-sm text-brand-100 mb-3">
                Generate a professional resume in seconds
              </p>
              <Link
                href="/student/resumes/new"
                className="flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                Create with AI
              </Link>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive = isNavItemActive(item);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                      : "text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-brand-500" : "")} />
                  {item.name}
                  {item.badge && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-surface-200 dark:border-surface-800 p-4">
            <div className="flex items-center gap-3">
              <UserAvatar name={user?.full_name || "User"} imageUrl={user?.avatar_url} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                  {user?.full_name}
                </p>
                <p className="text-xs text-surface-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-surface-200 bg-white/80 px-4 backdrop-blur-xl dark:border-surface-800 dark:bg-surface-900/80 sm:px-6">
          {/* Mobile menu button */}
          <button
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6 text-surface-600" />
          </button>

          {/* Page title - shown on mobile */}
          <div className="lg:hidden font-medium text-surface-900 dark:text-white">
            {activeNavName}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <ThemeToggle />
            
            {/* Notifications */}
            <NotificationBell />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                <UserAvatar name={user?.full_name || "User"} imageUrl={user?.avatar_url} size="sm" />
                <ChevronDown className="h-4 w-4 text-surface-500" />
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-surface-200 bg-white p-1 shadow-lg dark:border-surface-700 dark:bg-surface-800">
                    <div className="border-b border-surface-200 px-3 py-2 dark:border-surface-700">
                      <p className="text-sm font-medium text-surface-900 dark:text-white">
                        {user?.full_name}
                      </p>
                      <p className="text-xs text-surface-500">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href={userMenuLink}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <UserMenuIcon className="h-4 w-4" />
                        {userMenuLabel}
                      </Link>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
















