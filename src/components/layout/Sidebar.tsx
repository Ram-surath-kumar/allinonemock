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
import { ROLE_LABELS, UserRole, User } from '@/types/erp';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from('users')
        .select('*, organizations(*)')
        .order('role', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        const mappedUsers: User[] = data.map((row) => ({
          id: row.id,
          loopid: row.loopid,
          org_id: row.org_id,
          user_id: row.user_id,
          name: row.name,
          email: row.email,
          role: row.role as UserRole,
          permissions: row.permissions || [],
          department: row.department,
          createdAt: new Date(row.created_at),
          status: row.status as 'active' | 'inactive',
          avatar: row.avatar,
          organization: row.organizations ? {
            id: row.organizations.id,
            org_id: row.organizations.org_id,
            org_code: row.organizations.org_code,
            org_name: row.organizations.org_name,
          } : undefined,
        }));
        setAllUsers(mappedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.roles && currentUser && !item.roles.includes(currentUser.role)) return false;
    return true;
  });

  const handleUserSwitch = async (user: User) => {
    if (!user.organization || !user.user_id) {
      console.error('User does not have organization or user_id');
      return;
    }
    
    // Get current tab from path
    const pathToTab: Record<string, string> = {
      '/': 'dashboard',
      '/users': 'users',
      '/students': 'students',
      '/attendance': 'attendance',
      '/academics': 'academics',
      '/finance': 'finance',
      '/facilities': 'facilities',
      '/settings': 'settings',
    };
    
    const currentTab = pathToTab[currentPath] || 'dashboard';
    
    // Navigate to new user's URL with current tab
    navigate(`/${user.organization.org_name}/${user.user_id}/${currentTab}`);
    
    // Login the user
    await login('', user.organization.org_name, user.user_id);
  };

  return (
    <aside className="flex h-screen w-64 flex-col bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95 text-sidebar-foreground shadow-xl border-r border-sidebar-border/50">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border/50 px-6 bg-sidebar/50 backdrop-blur-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 shadow-lg shadow-sidebar-primary/20">
          <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight">EduAdmin</h1>
          <p className="text-xs text-sidebar-muted font-medium">ERP System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;
          
          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 relative group",
                isActive 
                  ? "bg-gradient-to-r from-sidebar-primary/20 to-sidebar-primary/10 text-sidebar-accent-foreground shadow-md shadow-sidebar-primary/10" 
                  : "text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:shadow-sm"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-transform duration-200",
                isActive ? "scale-110" : "group-hover:scale-110"
              )} />
              <span className="relative z-10">{item.label}</span>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-sidebar-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-sidebar-border/50 p-4 bg-sidebar/50 backdrop-blur-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 hover:bg-sidebar-accent/50 hover:shadow-md active:scale-[0.98]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sm font-bold text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/20">
                {currentUser?.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold">{currentUser?.name}</p>
                <p className="truncate text-xs text-sidebar-muted font-medium">
                  {currentUser && ROLE_LABELS[currentUser.role]}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-sidebar-muted transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Switch Role (Demo)
            </div>
            {loadingUsers ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Loading users...
              </div>
            ) : allUsers.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                No users available
              </div>
            ) : (
              allUsers.map((user) => (
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
                      {user.name.split(' ').map(n => n[0]).join('')}
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
