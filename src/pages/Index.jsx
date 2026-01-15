import { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Login } from '@/pages/Login';
import { ROLE_LABELS } from '@/types/erp';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load pages with better code splitting
const Dashboard = lazy(() =>
  import('@/pages/Dashboard').then(module => ({ default: module.Dashboard }))
);
const UserManagement = lazy(() =>
  import('@/pages/UserManagement').then(module => ({ default: module.UserManagement }))
);
const Students = lazy(() =>
  import('@/pages/Students').then(module => ({ default: module.Students }))
);
const Admissions = lazy(() =>
  import('@/pages/Admissions').then(module => ({ default: module.Admissions }))
);

// ... (existing lazy imports remain)


const PersonalDetails = lazy(() =>
  import('@/pages/student/PersonalDetails').then(module => ({ default: module.PersonalDetails }))
);
const GradesMarks = lazy(() =>
  import('@/pages/student/GradesMarks').then(module => ({ default: module.GradesMarks }))
);
const AttendanceDetails = lazy(() =>
  import('@/pages/student/AttendanceDetails').then(module => ({ default: module.AttendanceDetails }))
);
const Timetable = lazy(() =>
  import('@/pages/student/Timetable').then(module => ({ default: module.Timetable }))
);
const FeePayment = lazy(() =>
  import('@/pages/student/FeePayment').then(module => ({ default: module.FeePayment }))
);
const Tools = lazy(() =>
  import('@/pages/Tools').then(module => ({ default: module.Tools }))
);
const Finance = lazy(() =>
  import('@/pages/Finance').then(module => ({ default: module.Finance }))
);
const HostelDashboard = lazy(() =>
  import('@/pages/Hostel/HostelDashboard').then(module => ({ default: module.default }))
);
const ExamDashboard = lazy(() =>
  import('@/pages/Exam/ExamDashboard').then(module => ({ default: module.default }))
);
const LibraryDashboard = lazy(() =>
  import('@/pages/Library/LibraryDashboard').then(module => ({ default: module.default }))
);

// Enhanced skeleton loader with shimmer effect
const PageLoader = () => (
  <div className="space-y-6 animate-fade-in" role="status" aria-label="Loading page">
    <div className="space-y-3">
      <Skeleton className="h-8 w-48 rounded-xl" />
      <Skeleton className="h-4 w-64 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-2xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[...Array(2)].map((_, i) => (
        <Skeleton key={i} className="h-64 w-full rounded-2xl" />
      ))}
    </div>
    <span className="sr-only">Loading content...</span>
  </div>
);

function AppContent() {
  const { currentUser, login, loading } = useAuth();
  const { orgName, userId, tab } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Map tab names to paths
  const tabToPath = {
    'dashboard': '/',
    'users': '/users',
    'students': '/students',
    'attendance': '/attendance',
    'admissions': '/admissions',
    'finance': '/finance',
    'hostel': '/hostel',
    'exam': '/exam',
    'library': '/library',
    'facilities': '/facilities',
    'settings': '/settings',
    'personal-details': '/student/personal-details',
    'grades-marks': '/student/grades-marks',
    'student-attendance': '/student/attendance',
    'timetable': '/student/timetable',
    'fee-payment': '/student/fee-payment',
    'tools': '/tools',
  };

  const pathToTab = {
    '/': 'dashboard',
    '/users': 'users',
    '/students': 'students',
    '/attendance': 'attendance',
    '/admissions': 'admissions',
    '/finance': 'finance',
    '/hostel': 'hostel',
    '/exam': 'exam',
    '/library': 'library',
    '/facilities': 'facilities',
    '/settings': 'settings',
    '/student/personal-details': 'personal-details',
    '/student/grades-marks': 'grades-marks',
    '/student/attendance': 'student-attendance',
    '/student/timetable': 'timetable',
    '/student/fee-payment': 'fee-payment',
    '/tools': 'tools',
  };

  // Initialize from URL on mount (only if user is already logged in)
  useEffect(() => {
    const initializeUser = async () => {
      try {
        if (currentUser && orgName && userId) {
          const userIdNum = parseInt(userId, 10);
          if (!isNaN(userIdNum)) {
            // Load user by org name and user_id if URL params don't match current user
            if (currentUser.organization?.org_name !== orgName || currentUser.user_id !== userIdNum) {
              login('', orgName, userIdNum);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        // Set a timeout to ensure we don't wait forever
        setTimeout(() => setIsInitializing(false), 1000);
      }
    };

    if (currentUser) {
      initializeUser();
    } else {
      setIsInitializing(false);
    }
  }, [orgName, userId, currentUser]);

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

  const handleNavigate = (path) => {
    // For student routes, use the path directly or map to tab name
    if (path.startsWith('/student/')) {
      const tabName = pathToTab[path] || path.replace('/student/', '').replace(/-/g, '-');
      if (currentUser?.organization && currentUser.user_id) {
        navigate(`/${currentUser.organization.org_name}/${currentUser.user_id}/${tabName}`);
      } else {
        navigate(path);
      }
    } else {
      const tabName = pathToTab[path] || 'dashboard';
      if (currentUser?.organization && currentUser.user_id) {
        navigate(`/${currentUser.organization.org_name}/${currentUser.user_id}/${tabName}`);
      } else {
        navigate(path);
      }
    }
  };

  // Get current path from URL
  const getCurrentPath = () => {
    // If we have a tab parameter, use it
    if (tab) {
      // Check if it's a direct path mapping
      if (tabToPath[tab]) {
        return tabToPath[tab];
      }
      // For standard routes like 'users', 'students', etc., map them directly
      const standardPath = `/${tab}`;
      if (pathToTab[standardPath]) {
        return standardPath;
      }
    }

    // Fallback: try to extract from location pathname
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 3) {
      const lastPart = pathParts[pathParts.length - 1];
      // Check if it's a known tab
      if (tabToPath[lastPart]) {
        return tabToPath[lastPart];
      }
      // Check if it's a standard route
      const standardPath = `/${lastPart}`;
      if (pathToTab[standardPath]) {
        return standardPath;
      }
    }

    // Final fallback
    if (location.pathname.startsWith('/student/')) {
      return location.pathname;
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
      case '/admissions':
        return 'Admissions';
      case '/finance':
        return 'Finance';
      case '/hostel':
        return 'Hostel Management';
      case '/exam':
        return 'Examinations';
      case '/library':
        return 'Library Management';
      case '/facilities':
        return 'Facilities';
      case '/settings':
        return 'Settings';
      case '/student/personal-details':
        return 'Personal Details';
      case '/student/grades-marks':
        return 'Grades & Marks';
      case '/student/attendance':
        return 'Attendance Details';
      case '/student/timetable':
        return 'Timetable';
      case '/student/fee-payment':
        return 'Fee Payment';
      case '/tools':
        return 'Tools';
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
      case '/student/personal-details':
        return (
          <Suspense fallback={<PageLoader />}>
            <PersonalDetails />
          </Suspense>
        );
      case '/student/grades-marks':
        return (
          <Suspense fallback={<PageLoader />}>
            <GradesMarks />
          </Suspense>
        );
      case '/student/attendance':
        return (
          <Suspense fallback={<PageLoader />}>
            <AttendanceDetails />
          </Suspense>
        );
      case '/student/timetable':
        return (
          <Suspense fallback={<PageLoader />}>
            <Timetable />
          </Suspense>
        );
      case '/student/fee-payment':
        return (
          <Suspense fallback={<PageLoader />}>
            <FeePayment />
          </Suspense>
        );
      case '/tools':
        return (
          <Suspense fallback={<PageLoader />}>
            <Tools />
          </Suspense>
        );
      case '/finance':
        return (
          <Suspense fallback={<PageLoader />}>
            <Finance />
          </Suspense>
        );
      case '/hostel':
        return (
          <Suspense fallback={<PageLoader />}>
            <HostelDashboard />
          </Suspense>
        );
      case '/exam':
        return (
          <Suspense fallback={<PageLoader />}>
            <ExamDashboard />
          </Suspense>
        );
      case '/library':
        return (
          <Suspense fallback={<PageLoader />}>
            <LibraryDashboard />
          </Suspense>
        );
      case '/admissions':
        return (
          <Suspense fallback={<PageLoader />}>
            <Admissions />
          </Suspense>
        );
      case '/facilities':
      case '/settings':
        return (
          <div className="flex items-center justify-center h-64 rounded-2xl border border-border bg-card animate-fade-in shadow-depth-1" role="region" aria-label={getPageTitle()}>
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

  // Show loading state while initializing (but not forever)
  useEffect(() => {
    if (currentUser || !loading) {
      setIsInitializing(false);
    }
  }, [currentUser, loading]);

  // Show login page if not authenticated - redirect to /login
  useEffect(() => {
    if (!currentUser && !loading && !isInitializing && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [currentUser, loading, isInitializing, location.pathname, navigate]);

  // Show login page if not authenticated
  if (!currentUser && !loading && !isInitializing) {
    return null; // Will redirect to /login
  }

  if (isInitializing && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PageLoader />
      </div>
    );
  }

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
  return <AppContent />;
};

export default Index;
