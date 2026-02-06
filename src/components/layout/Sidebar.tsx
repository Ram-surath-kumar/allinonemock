import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  BookOpen,
  CreditCard,
  Settings,
  Building2,
  FileText,
  Wrench,
  BedDouble,
  Library,
  Bus,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/lib/i18n";
import type { UserRole } from "@/types";
import React, { useRef, useMemo } from "react";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  permission?: string;
  roles?: UserRole[];
}

// Note: navItems will be created inside component to use i18n


interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed?: boolean;
}

export function Sidebar({ currentPath, onNavigate, collapsed = false }: SidebarProps) {
  const { currentUser, hasPermission } = useAuth();
  const { t } = useI18n();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Create navItems inside component to use i18n - memoized to prevent recreation on every render
  const navItems: NavItem[] = useMemo(() => {
    if (currentUser?.role === 'student') {
      return [
        { icon: LayoutDashboard, label: t("sidebar.dashboard") || "Dashboard", href: "/" },
        { icon: MessageSquare, label: "Chat", href: "/chat" },
        { icon: FileText, label: "Examination and Results", href: "/student/examinations", roles: ["student"] },
        { icon: CreditCard, label: "Fee Payment", href: "/student/fee-payment", roles: ["student"] },
        { icon: Settings, label: t("sidebar.settings") || "Settings", href: "/settings" },
      ];
    }

    return [
      { icon: LayoutDashboard, label: t("sidebar.dashboard"), href: "/" },
      { icon: MessageSquare, label: "Chat", href: "/chat" },
      {
        icon: Users,
        label: t("sidebar.userManagement"),
        href: "/users",
        roles: ["admin", "vice_head"],
      },
      {
        icon: GraduationCap,
        label: t("sidebar.students"),
        href: "/students",
        permission: "view_students",
      },
      {
        icon: Calendar,
        label: t("sidebar.attendance"),
        href: "/attendance",
        permission: "manage_attendance",
      },
      {
        icon: BookOpen,
        label: t("sidebar.academicGov"),
        href: "/governance/academic",
        roles: ["admin", "vice_head"],
      },
      {
        icon: FileText,
        label: t("sidebar.misReports"),
        href: "/governance/mis",
        roles: ["admin", "vice_head"],
      },
      {
        icon: CreditCard,
        label: t("sidebar.finance"),
        href: "/finance",
        permission: "view_finance",
      },
      {
        icon: Building2,
        label: t("sidebar.facilities"),
        href: "/facilities",
        permission: "manage_facilities",
      },
      {
        icon: BedDouble,
        label: t("sidebar.hostel"),
        href: "/hostel",
        roles: ["admin", "vice_head"],
      },
      {
        icon: Library,
        label: t("sidebar.library"),
        href: "/library",
        permission: "manage_library",
      },
      {
        icon: Bus,
        label: t("sidebar.transportation"),
        href: "/transport",
        permission: "view_transport",
      },
      {
        icon: FileText,
        label: currentUser?.role === "teacher" ? "Examination & Evaluation" : t("sidebar.examinations"),
        href: "/exam",
        roles: ["admin", "vice_head", "teacher"],
      },
      { icon: Wrench, label: t("sidebar.tools"), href: "/tools", roles: ["admin", "vice_head"] },
      { icon: ShieldCheck, label: "Admin Console", href: "/admin-console", roles: ["admin"] },
      { icon: Settings, label: t("sidebar.settings"), href: "/settings" },
    ];
  }, [t, currentUser?.role]);

  const filteredNavItems = useMemo(
    () =>
      navItems.filter((item) => {
        if (item.permission && !hasPermission(item.permission)) return false;
        if (item.roles && currentUser && !item.roles.includes(currentUser.role)) return false;
        return true;
      }),
    [navItems, currentUser, hasPermission]
  );

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        "flex h-screen flex-col shadow-depth-2 border-r border-sidebar-border",
        "bg-sidebar transition-[width] duration-300 ease-out",
        "bg-white/95 backdrop-blur-md dark:bg-sidebar/80 dark:glass-modern",
        collapsed ? "w-16" : "w-64"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border",
          "bg-white/40 dark:bg-sidebar/50 backdrop-blur-sm shadow-sm z-10 h-[64px]",
          collapsed ? "justify-center px-2 py-3" : "gap-3 px-5 py-3"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 shadow-md shrink-0 transition-transform duration-300 hover:scale-105 hover:shadow-glow overflow-hidden",
            collapsed ? "h-9 w-9" : "h-10 w-10"
          )}
          aria-hidden="true"
        >
          {currentUser?.organization?.org_logo ? (
            <img
              src={currentUser.organization.org_logo}
              alt={currentUser.organization.org_name || "College Logo"}
              className={cn("object-cover", collapsed ? "h-9 w-9" : "h-10 w-10")}
            />
          ) : (
            <GraduationCap
              className={cn("text-sidebar-primary-foreground", collapsed ? "h-4 w-4" : "h-5 w-5")}
            />
          )}
        </div>
        <div
          className={cn(
            "overflow-hidden transition-[max-width,opacity] duration-300 ease-out",
            collapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100",
            collapsed ? "" : "delay-50"
          )}
        >
          <div className="whitespace-nowrap pl-2">
            <h1 className="text-xs font-bold tracking-tight text-sidebar-foreground uppercase leading-tight">
              {currentUser?.organization?.org_name || "College Name"}
            </h1>
            <p className="text-[9px] text-sidebar-muted font-bold uppercase tracking-widest mt-0.5 opacity-60 leading-tight">powered by loopverse</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-1.5 overflow-y-auto", collapsed ? "px-1.5 py-3" : "p-3")}>
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;

          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              className={cn(
                "group relative flex items-center rounded-xl text-sm font-medium",
                "transition-all duration-200",
                "hover:scale-[1.02] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-sidebar-primary focus-visible:outline-offset-2",
                "active:scale-95 transition-all duration-200",
                collapsed ? "justify-center w-full py-4" : "justify-start w-full gap-4 px-4 py-3.5",
                collapsed && isActive ? "px-2.5" : collapsed ? "px-1.5" : "",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20 ring-1 ring-sidebar-primary/50"
                  : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground hover:shadow-sm"
              )}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "shrink-0 transition-all duration-200",
                  "h-5 w-5",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )}
              />

              <span
                className={cn(
                  "relative z-10 whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-300 ease-out",
                  collapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100",
                  collapsed ? "" : "delay-75"
                )}
              >
                {item.label}
              </span>

              {isActive && !collapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-sidebar-primary-foreground/30" />
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-sidebar-accent text-sidebar-foreground text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap z-50 border border-sidebar-border">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
