import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  BookOpen,
  CreditCard,
  Settings,
  Building2,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Clock,
  FileText,
  Wrench,
  BedDouble,
  Library,
  Settings as SettingsIcon,
  Bus,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/lib/i18n";
import { ROLE_LABELS } from "@/types/erp";
import type { UserRole, User } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/services/api";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  permission?: string;
  roles?: UserRole[];
}

// Note: navItems will be created inside component to use i18n

// Student-specific navigation items
const studentNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  {
    icon: UserIcon,
    label: "Personal Details",
    href: "/student/personal-details",
    roles: ["student"],
  },
  { icon: BookOpen, label: "Grades & Marks", href: "/student/grades-marks", roles: ["student"] },
  { icon: Calendar, label: "Attendance Details", href: "/student/attendance", roles: ["student"] },
  { icon: Clock, label: "Timetable", href: "/student/timetable", roles: ["student"] },
  { icon: FileText, label: "Examinations", href: "/student/examinations", roles: ["student"] },
  { icon: CreditCard, label: "Fee Payment", href: "/student/fee-payment", roles: ["student"] },
];

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed?: boolean;
}

export function Sidebar({ currentPath, onNavigate, collapsed = false }: SidebarProps) {
  const { currentUser, login, logout, hasPermission } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersDropdownOpen, setUsersDropdownOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (usersDropdownOpen && allUsers.length === 0) {
      fetchAllUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersDropdownOpen]);

  const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.getUsers();
      if (response.error) throw new Error(response.error);
      const data = response.data;

      if (data && Array.isArray(data)) {
        interface ApiUserRow {
          id: string;
          loopid?: string;
          org_id?: number;
          user_id?: number;
          name: string;
          email: string;
          role: string;
          permissions?: string[];
          department?: string;
          created_at: string;
          status: string;
          avatar?: string;
        }

        const orgIds = [
          ...new Set(data.filter((u: ApiUserRow) => u.org_id).map((u: ApiUserRow) => u.org_id)),
        ];
        const orgMap = new Map<
          number,
          { id: number; org_id: number; org_code: string; org_name: string }
        >();

        if (orgIds.length > 0) {
          for (const orgId of orgIds) {
            if (orgId) {
              const orgResponse = await api.getOrganizations({ id: String(orgId) });
              if (
                !orgResponse.error &&
                orgResponse.data &&
                Array.isArray(orgResponse.data) &&
                orgResponse.data.length > 0
              ) {
                const org = orgResponse.data[0] as {
                  id: number;
                  org_id: number;
                  org_code: string;
                  org_name: string;
                };
                orgMap.set(org.id, org);
              }
            }
          }
        }

        const mappedUsers: User[] = data.map((row: ApiUserRow) => {
          const org = row.org_id ? orgMap.get(row.org_id) : undefined;
          return {
            id: row.id,
            loopid: row.loopid,
            org_id: row.org_id,
            user_id: String(row.user_id || ""),
            name: row.name,
            email: row.email,
            role: row.role as UserRole,
            permissions: row.permissions || [],
            department: row.department,
            createdAt: new Date(row.created_at),
            status: row.status as "active" | "inactive",
            avatar: row.avatar,
            organization: org
              ? {
                id: org.id,
                org_id: String(org.org_id),
                org_code: org.org_code,
                org_name: org.org_name,
              }
              : undefined,
          };
        });
        setAllUsers(mappedUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

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
    [navItems, currentUser?.role, currentUser?.permissions]
  );

  const handleUserSwitch = async (user: User) => {
    if (!user.organization || !user.user_id) {
      console.error("User does not have organization or user_id");
      return;
    }

    const pathToTab: Record<string, string> = {
      "/": "dashboard",
      "/users": "users",
      "/students": "students",
      "/attendance": "attendance",
      "/academics": "academics",
      "/finance": "finance",
      "/facilities": "facilities",
      "/settings": "settings",
    };

    const currentTab = pathToTab[currentPath] || "dashboard";

    if (user.user_id && user.organization?.org_name) {
      navigate(`/${user.organization.org_name}/${user.user_id}/${currentTab}`);
      await login("", user.organization.org_name, user.user_id);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        "flex h-screen flex-col shadow-depth-2 border-r border-sidebar-border",
        "bg-sidebar backdrop-blur-xl transition-[width] duration-300 ease-out",
        "dark:bg-sidebar/80 dark:glass-modern",
        collapsed ? "w-16" : "w-64"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border",
          "bg-sidebar/50 dark:bg-sidebar/50 backdrop-blur-sm",
          collapsed ? "justify-center px-2 py-4" : "gap-3 px-4 py-4"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 shadow-md shrink-0 transition-transform duration-300 hover:scale-105 hover:shadow-glow overflow-hidden",
            collapsed ? "h-10 w-10" : "h-11 w-11"
          )}
          aria-hidden="true"
        >
          {currentUser?.organization?.org_logo ? (
            <img
              src={currentUser.organization.org_logo}
              alt={currentUser.organization.org_name || "College Logo"}
              className={cn("object-cover", collapsed ? "h-10 w-10" : "h-11 w-11")}
            />
          ) : (
            <GraduationCap
              className={cn("text-sidebar-primary-foreground", collapsed ? "h-5 w-5" : "h-6 w-6")}
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
          <div className="whitespace-nowrap pl-3">
            <h1 className="text-sm font-bold tracking-tight text-sidebar-foreground">
              {currentUser?.organization?.org_name || "College Name"}
            </h1>
            <p className="text-xs text-sidebar-muted font-medium">powered by loopverse</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-2 overflow-y-auto", collapsed ? "px-1.5 py-3" : "p-3")}>
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
                collapsed ? "justify-center w-full py-3" : "justify-start w-full gap-4 px-4 py-3.5",
                collapsed && isActive ? "px-2.5" : collapsed ? "px-1.5" : "",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
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

      {/* User Profile */}
      <div
        className={cn(
          "border-t border-sidebar-border bg-sidebar/50 dark:bg-sidebar/50 backdrop-blur-sm",
          collapsed ? "p-1.5" : "p-3"
        )}
      >
        <DropdownMenu open={usersDropdownOpen} onOpenChange={setUsersDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center rounded-xl text-left",
                "transition-all duration-200 hover:bg-sidebar-accent active:scale-[0.98]",
                collapsed ? "justify-center px-0 py-3" : "justify-start gap-3 px-3 py-3"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sm font-bold text-sidebar-primary-foreground shadow-md shrink-0 transition-transform duration-200 hover:scale-105",
                  collapsed ? "h-10 w-10" : "h-11 w-11"
                )}
              >
                {currentUser ? getInitials(currentUser.name) : "U"}
              </div>
              <div
                className={cn(
                  "overflow-hidden min-w-0 transition-[max-width,opacity] duration-300 ease-out",
                  collapsed ? "max-w-0 opacity-0" : "max-w-[180px] flex-1 opacity-100",
                  collapsed ? "" : "delay-75"
                )}
              >
                <p className="truncate text-sm font-semibold text-sidebar-foreground">
                  {currentUser?.name}
                </p>
                <p className="truncate text-xs text-sidebar-muted font-medium">
                  {currentUser && ROLE_LABELS[currentUser.role]}
                </p>
              </div>
              <div
                className={cn(
                  "shrink-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                  collapsed ? "w-0 opacity-0" : "w-4 opacity-100"
                )}
              >
                <ChevronDown className="h-4 w-4 text-sidebar-muted transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </button>
          </DropdownMenuTrigger>
          {/* @ts-expect-error - DropdownMenuContent accepts children but TypeScript doesn't recognize it from JSX component */}
          <DropdownMenuContent align="end" className="w-64 glass-modern">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {t("sidebar.switchRole")}
            </div>
            {loadingUsers ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                {t("sidebar.loadingUsers")}
              </div>
            ) : allUsers.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                {t("sidebar.noUsersAvailable")}
              </div>
            ) : (
              allUsers.map((user) => (
                /* @ts-expect-error - DropdownMenuItem accepts children but TypeScript doesn't recognize it from JSX component */
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => handleUserSwitch(user)}
                  className={cn(
                    "flex items-center justify-between",
                    currentUser?.id === user.id && "bg-accent"
                  )}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary shrink-0">
                      {getInitials(user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {ROLE_LABELS[user.role]}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
            {/* @ts-expect-error - DropdownMenuItem accepts children but TypeScript doesn't recognize it from JSX component */}
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t("sidebar.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
