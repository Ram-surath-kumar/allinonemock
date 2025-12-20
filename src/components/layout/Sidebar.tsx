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
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS, UserRole } from '@/types/erp';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  permission?: string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Users, label: 'User Management', href: '/users', roles: ['admin', 'vice_head'] },
  { icon: GraduationCap, label: 'Students', href: '/students', permission: 'view_students' },
  { icon: Calendar, label: 'Attendance', href: '/attendance', permission: 'manage_attendance' },
  { icon: BookOpen, label: 'Academics', href: '/academics', permission: 'view_grades' },
  { icon: CreditCard, label: 'Finance', href: '/finance', permission: 'view_finance' },
  { icon: Building2, label: 'Facilities', href: '/facilities', permission: 'manage_facilities' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Sidebar({ currentPath, onNavigate }: SidebarProps) {
  const { currentUser, login, logout, hasPermission } = useAuth();

  const filteredNavItems = navItems.filter(item => {
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.roles && currentUser && !item.roles.includes(currentUser.role)) return false;
    return true;
  });

  const roles: UserRole[] = ['admin', 'vice_head', 'teacher', 'student', 'housekeeping', 'librarian', 'accountant'];

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-semibold">EduAdmin</h1>
          <p className="text-xs text-sidebar-muted">ERP System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;
          
          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-sidebar-accent/50">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sm font-medium text-sidebar-primary-foreground">
                {currentUser?.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{currentUser?.name}</p>
                <p className="truncate text-xs text-sidebar-muted">
                  {currentUser && ROLE_LABELS[currentUser.role]}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-sidebar-muted" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Switch Role (Demo)
            </div>
            {roles.map((role) => (
              <DropdownMenuItem 
                key={role} 
                onClick={() => login(role)}
                className={cn(currentUser?.role === role && "bg-accent")}
              >
                {ROLE_LABELS[role]}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
