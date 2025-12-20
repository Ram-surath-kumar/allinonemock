import { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ROLE_LABELS } from '@/types/erp';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load pages
const Dashboard = lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.Dashboard })));
const UserManagement = lazy(() => import('@/pages/UserManagement').then(module => ({ default: module.UserManagement })));
const Students = lazy(() => import('@/pages/Students').then(module => ({ default: module.Students })));
const Attendance = lazy(() => import('@/pages/Attendance').then(module => ({ default: module.Attendance })));

// Loading fallback component
const PageLoader = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
    <div className="grid gap-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

function AppContent() {
  const { currentUser, login } = useAuth();
  const { orgName, userId, tab } = useParams<{ orgName?: string; userId?: string; tab?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

  // Map tab names to paths
  const tabToPath: Record<string, string> = {
    'dashboard': '/',
    'users': '/users',
    'students': '/students',
    'attendance': '/attendance',
    'academics': '/academics',
    'finance': '/finance',
    'facilities': '/facilities',
    'settings': '/settings',
  };

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

  // Initialize from URL on mount
  useEffect(() => {
    if (orgName && userId) {
      const userIdNum = parseInt(userId, 10);
      if (!isNaN(userIdNum)) {
        // Load user by org name and user_id
        login('', orgName, userIdNum);
      }
    } else if (!currentUser) {
      // Default to admin if no user and no URL params
      login('admin');
    }
  }, [orgName, userId]);

  // Update URL when user changes
  useEffect(() => {
    if (currentUser?.organization && currentUser.user_id) {
      const currentTab = tab || pathToTab[location.pathname] || 'dashboard';
      const newPath = `/${currentUser.organization.org_name}/${currentUser.user_id}/${currentTab}`;
      
      // Only update if URL is different
      if (location.pathname !== newPath && (!orgName || !userId || 
          orgName !== currentUser.organization.org_name || 
          parseInt(userId || '0', 10) !== currentUser.user_id)) {
        navigate(newPath, { replace: true });
      }
    }
  }, [currentUser?.organization?.org_name, currentUser?.user_id]);

  const handleNavigate = (path: string) => {
    const tabName = pathToTab[path] || 'dashboard';
    if (currentUser?.organization && currentUser.user_id) {
      navigate(`/${currentUser.organization.org_name}/${currentUser.user_id}/${tabName}`);
    } else {
      navigate(path);
    }
  };

  // Get current path from URL
  const getCurrentPath = () => {
    if (tab && tabToPath[tab]) {
      return tabToPath[tab];
    }
    return '/';
  };

  const currentPath = getCurrentPath();

  const handleOpenAddUserDialog = () => {
    handleNavigate('/users');
    setAddUserDialogOpen(true);
  };

  const getPageTitle = () => {
    switch (currentPath) {
      case '/':
        return 'Dashboard';
      case '/users':
        return 'User Management';
      case '/students':
        return 'Students';
      case '/attendance':
        return 'Attendance';
      case '/academics':
        return 'Academics';
      case '/finance':
        return 'Finance';
      case '/facilities':
        return 'Facilities';
      case '/settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  const getPageSubtitle = () => {
    if (currentPath === '/') {
      return `Welcome back, ${currentUser?.name.split(' ')[0]}`;
    }
    return undefined;
  };

  const renderContent = () => {
    switch (currentPath) {
      case '/':
        return (
          <Suspense fallback={<PageLoader />}>
            <Dashboard onAddUser={handleOpenAddUserDialog} />
          </Suspense>
        );
      case '/users':
        return (
          <Suspense fallback={<PageLoader />}>
          <UserManagement 
            dialogOpen={addUserDialogOpen} 
            setDialogOpen={setAddUserDialogOpen} 
          />
          </Suspense>
        );
      case '/students':
        return (
          <Suspense fallback={<PageLoader />}>
            <Students />
          </Suspense>
        );
      case '/attendance':
        return (
          <Suspense fallback={<PageLoader />}>
            <Attendance />
          </Suspense>
        );
      case '/academics':
      case '/finance':
      case '/facilities':
      case '/settings':
        return (
          <div className="flex items-center justify-center h-64 rounded-xl border border-border bg-card animate-fade-in">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">{getPageTitle()}</h2>
              <p className="mt-2 text-muted-foreground">
                This section is coming soon. Currently viewing as {currentUser && ROLE_LABELS[currentUser.role]}.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <Suspense fallback={<PageLoader />}>
            <Dashboard onAddUser={handleOpenAddUserDialog} />
          </Suspense>
        );
    }
  };

  return (
    <AppLayout
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
      currentPath={currentPath}
      onNavigate={handleNavigate}
    >
      {renderContent()}
    </AppLayout>
  );
}

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
