import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  BookOpen,
  CreditCard,
  Building2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Clock,
  FileText,
  Wrench,
  BedDouble,
  Library
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS, UserRole, User } from '@/types/erp';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { UIConfiguration } from '@/config/UIConfiguration';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Users, label: 'User Management', href: '/users', roles: ['admin', 'vice_head'] },
  { icon: GraduationCap, label: 'Students', href: '/students', permission: 'view_students' },
  { icon: Calendar, label: 'Attendance', href: '/attendance', permission: 'manage_attendance' },
  { icon: BookOpen, label: 'Academic Gov.', href: '/governance/academic', permission: 'view_grades' },
  { icon: FileText, label: 'MIS Reports', href: '/governance/mis', permission: 'admin' },
  { icon: CreditCard, label: 'Finance', href: '/finance', permission: 'view_finance' },
  { icon: Building2, label: 'Facilities', href: '/facilities', permission: 'manage_facilities' },
  { icon: BedDouble, label: 'Hostel', href: '/hostel' },
  { icon: Library, label: 'Library', href: '/library' },
  { icon: FileText, label: 'Examinations', href: '/exam', roles: ['admin', 'vice_head'] },
  { icon: Wrench, label: 'Tools', href: '/tools', roles: ['admin', 'vice_head'] },
];

// Student-specific navigation items
const studentNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: UserIcon, label: 'Personal Details', href: '/student/personal-details', roles: ['student'] },
  { icon: GraduationCap, label: 'Grades & Marks', href: '/student/grades-marks', roles: ['student'] },
  { icon: Calendar, label: 'Attendance Details', href: '/student/attendance', roles: ['student'] },
  { icon: Clock, label: 'Timetable', href: '/student/timetable', roles: ['student'] },
  { icon: CreditCard, label: 'Fee Payment', href: '/student/fee-payment', roles: ['student'] },
];



export function Sidebar({ currentPath, onNavigate }) {
  const { currentUser, logout, hasPermission } = useAuth();
  // Sidebar collapse state - only enabled if minimizeSidebar is true in UIConfiguration
  const [collapsed, setCollapsed] = useState(UIConfiguration.minimizeSidebar ? true : false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const sidebarRef = useRef(null);

  // Handle hover with 500ms delay - only if minimizeSidebar is enabled
  useEffect(() => {
    // If minimizeSidebar is disabled, always keep sidebar expanded
    if (!UIConfiguration.minimizeSidebar) {
      setCollapsed(false);
      return;
    }

    // Only handle hover collapse/expand if minimizeSidebar is enabled
    if (isHovered) {
      hoverTimeoutRef.current = setTimeout(() => {
        setCollapsed(false);
      }, 500);
    } else {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      // Immediately collapse to hide text first, then width will follow
      setCollapsed(true);
    }

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [isHovered]);

  const filteredNavItems = navItems.filter(item => {
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.roles && currentUser && !item.roles.includes(currentUser.role)) return false;
    return true;
  });

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside
      ref={sidebarRef}
      onMouseEnter={() => UIConfiguration.minimizeSidebar && setIsHovered(true)}
      onMouseLeave={() => UIConfiguration.minimizeSidebar && setIsHovered(false)}
      className={cn(
        "flex h-screen flex-col shadow-depth-2 border-r border-sidebar-border",
        "bg-sidebar backdrop-blur-xl transition-[width] duration-300 ease-out",
        "dark:bg-sidebar/80 dark:glass-modern",
        collapsed ? "w-16" : "w-64"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo - Synced with topbar styling */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border",
        "bg-card/70 backdrop-blur-xl shadow-sm",
        collapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"
      )}>
        <div className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm shrink-0 transition-transform duration-200 hover:scale-105 overflow-hidden",
          collapsed ? "h-9 w-9" : "h-10 w-10"
        )} aria-hidden="true">
          {currentUser?.organization?.org_logo ? (
            <img
              src={currentUser.organization.org_logo}
              alt={currentUser.organization.org_name || "College Logo"}
              className={cn(
                "object-cover",
                collapsed ? "h-9 w-9" : "h-10 w-10"
              )}
            />
          ) : (
            <GraduationCap className={cn(
              "text-primary-foreground",
              collapsed ? "h-4 w-4" : "h-5 w-5"
            )} />
          )}
        </div>
        <div className={cn(
          "overflow-hidden transition-[max-width,opacity] duration-300 ease-out",
          collapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100",
          collapsed ? "" : "delay-50"
        )}>
          <div className="whitespace-nowrap">
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              {currentUser?.organization?.org_name || "College Name"}
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium leading-tight">powered by loopverse</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 space-y-2 overflow-y-auto",
        collapsed ? "px-1.5 py-2" : "px-3 py-2"
      )}>
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;

          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              className={cn(
                "group relative flex items-center rounded-lg text-sm font-medium",
                "transition-all duration-200",
                "hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-sidebar-primary focus-visible:outline-offset-2",
                collapsed
                  ? "justify-center w-full py-2"
                  : "justify-start w-full gap-3 px-3 py-2.5",
                collapsed && isActive
                  ? "px-2.5"
                  : collapsed
                    ? "px-1.5"
                    : "",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg border-l-4 border-primary-foreground font-semibold"
                  : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground hover:shadow-sm border-l-4 border-transparent"
              )}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn(
                "shrink-0 transition-all duration-200",
                "h-5 w-5",
                isActive ? "scale-110 text-primary-foreground" : "group-hover:scale-110"
              )} />

              <span className={cn(
                "relative z-10 whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-300 ease-out",
                collapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100",
                collapsed ? "" : "delay-75"
              )}>
                {item.label}
              </span>

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

      {/* User Profile */}
      <div className={cn(
        "border-t border-sidebar-border bg-card/70 backdrop-blur-xl shadow-sm",
        collapsed ? "p-1 pb-1" : "px-3 pt-1.5 pb-1"
      )}>
        <div className={cn(
          "flex w-full items-center rounded-lg",
          "transition-all duration-200",
          collapsed
            ? "justify-center px-0 py-2"
            : "justify-between gap-2.5 px-2.5 py-2"
        )}>
          <div className={cn(
            "flex items-center gap-2.5 flex-1 min-w-0",
            collapsed && "justify-center"
          )}>
            <div className={cn(
              "flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-xs font-semibold text-primary-foreground shadow-sm shrink-0 transition-transform duration-200 hover:scale-105",
              collapsed ? "h-8 w-8" : "h-9 w-9"
            )}>
              {currentUser ? getInitials(currentUser.name) : 'U'}
            </div>
            <div className={cn(
              "overflow-hidden min-w-0 transition-[max-width,opacity] duration-300 ease-out",
              collapsed ? "max-w-0 opacity-0" : "max-w-[180px] flex-1 opacity-100",
              collapsed ? "" : "delay-75"
            )}>
              <p className="truncate text-xs font-semibold text-foreground leading-tight">{currentUser?.name}</p>
              <p className="truncate text-[10px] text-muted-foreground font-medium leading-tight mt-0.5">
                {currentUser && ROLE_LABELS[currentUser.role]}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className={cn(
              "shrink-0 p-1.5 rounded-md transition-all duration-200",
              "hover:bg-sidebar-accent hover:text-destructive",
              "text-sidebar-muted",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
              collapsed ? "" : "delay-75"
            )}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
