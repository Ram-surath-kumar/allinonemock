import { useState, useEffect, Suspense, lazy } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";


// Lazy load pages with better code splitting
const Dashboard = lazy(() =>
  import("@/pages/Dashboard").then(module => {
    // Handle both named and default exports
    if (module.Dashboard) {
      return { default: module.Dashboard };
    }
    if (module.default) {
      return { default: module.default };
    }
    throw new Error("Dashboard component not found in module");
  })
);
const Chat = lazy(() =>
  import("@/pages/Chat").then((module) => ({ default: module.Chat }))
);
const UserManagement = lazy(() =>
  import("@/pages/UserManagement").then((module) => ({ default: module.UserManagement }))
);
const Students = lazy(() =>
  import("@/pages/Students").then((module) => ({ default: module.Students }))
);
const Attendance = lazy(() =>
  import("@/pages/Attendance").then((module) => ({ default: module.Attendance }))
);
const Admissions = lazy(() =>
  import("@/pages/Admissions").then((module) => ({ default: module.Admissions }))
);

const PersonalDetails = lazy(() =>
  import("@/pages/student/PersonalDetails").then((module) => ({ default: module.PersonalDetails }))
);
const GradesMarks = lazy(() =>
  import("@/pages/student/GradesMarks").then((module) => ({ default: module.GradesMarks }))
);
const AttendanceDetails = lazy(() =>
  import("@/pages/student/AttendanceDetails").then((module) => ({
    default: module.AttendanceDetails,
  }))
);
const Timetable = lazy(() =>
  import("@/pages/student/Timetable").then((module) => ({ default: module.Timetable }))
);
const FeePayment = lazy(() =>
  import("@/pages/student/FeePayment").then((module) => ({ default: module.FeePayment }))
);
const Tools = lazy(() => import("@/pages/Tools").then((module) => ({ default: module.Tools })));
const Finance = lazy(() =>
  import("@/pages/Finance").then((module) => ({ default: module.Finance }))
);
const Settings = lazy(() =>
  import("@/pages/Settings").then((module) => ({ default: module.Settings }))
);
const HostelDashboard = lazy(() =>
  import("@/pages/Hostel/HostelDashboard").then((module) => ({ default: module.default }))
);
const ExamDashboard = lazy(() =>
  import("@/pages/Exam/ExamDashboard").then((module) => ({ default: module.default }))
);
const LibraryDashboard = lazy(() =>
  import("@/pages/Library/LibraryDashboard").then((module) => ({ default: module.default }))
);
const StudentExaminations = lazy(() =>
  import("@/pages/student/StudentExaminations").then((module) => ({ default: module.default }))
);
const Facilities = lazy(() =>
  import("@/pages/Facilities").then((module) => ({ default: module.default }))
);
const Transportation = lazy(() =>
  import("@/pages/Transportation").then((module) => ({ default: module.default }))
);

// Import AcademicGovernance
const AcademicGovernance = lazy(() =>
  import("@/pages/AcademicGovernance").then((module) => ({ default: module.AcademicGovernance }))
);
// Import MISSubmission
const MISSubmission = lazy(() =>
  import("@/pages/MISSubmission").then((module) => ({ default: module.MISSubmission }))
);

const AdminConsole = lazy(() =>
  import("@/pages/AdminConsole").then((module) => ({ default: module.default }))
);
// Enhanced skeleton loader with shimmer effect
// Enhanced loader with ripple effect
import { RippleLoader } from "@/components/ui/RippleLoader";

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh] w-full animate-fade-in" role="status" aria-label="Loading page">
    <RippleLoader />
    <span className="sr-only">Loading content...</span>
  </div>
);

function AppContent() {
  const { currentUser, login, loading } = useAuth();
  const { orgName, userId, tab, chatUserId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Dialog states for various actions
  const [dialogStates, setDialogStates] = useState<Record<string, boolean>>({
    addUser: false,
    addUserAI: false,
    addStudent: false,
    addApplicant: false,
    collectFee: false,
    addHostel: false,
    allocateRoom: false,
    addRoom: false,
    addBook: false,
    scheduleExam: false,
  });

  // Map tab names to paths
  const tabToPath = {
    dashboard: "/",
    chat: "/chat",
    "chat/:userId": "/chat/:userId",
    events: "/events",
    tasks: "/tasks",
    users: "/users",
    students: "/students",
    attendance: "/attendance",
    admissions: "/admissions",
    finance: "/finance",
    hostel: "/hostel",
    exam: "/exam",
    library: "/library",
    transport: "/transport",
    facilities: "/facilities",
    settings: "/settings",
    tools: "/tools",
    academic_gov: "/governance/academic",
    mis_reports: "/governance/mis",
    personal_details: "/student/personal-details",
    grades_marks: "/student/grades-marks",
    student_attendance: "/student/attendance",
    timetable: "/student/timetable",
    student_exams: "/student/examinations",
    fee_payment: "/student/fee-payment",
    admin_console: "/admin-console",
  };

  const pathToTab = {
    "/": "dashboard",
    "/chat": "chat",
    "/events": "events",
    "/tasks": "tasks",
    "/users": "users",
    "/students": "students",
    "/attendance": "attendance",
    "/admissions": "admissions",
    "/finance": "finance",
    "/hostel": "hostel",
    "/exam": "exam",
    "/library": "library",
    "/transport": "transport",
    "/facilities": "facilities",
    "/settings": "settings",
    "/tools": "tools",
    "/governance/academic": "academic_gov",
    "/governance/mis": "mis_reports",
    "/student/personal-details": "personal_details",
    "/student/grades-marks": "grades_marks",
    "/student/attendance": "student_attendance",
    "/student/timetable": "timetable",
    "/student/examinations": "student_exams",
    "/student/fee-payment": "fee_payment",
    "/admin-console": "admin_console",
  };

  // Initialize from URL on mount (only if user is already logged in)
  useEffect(() => {
    const initializeUser = async () => {
      try {
        if (currentUser && orgName && userId) {
          const userIdNum = parseInt(userId, 10);
          if (!isNaN(userIdNum)) {
            // Load user by org name and user_id if URL params don't match current user
            if (
              currentUser.organization?.org_name !== orgName ||
              String(currentUser.user_id) !== String(userIdNum)
            ) {
              login("", orgName, userIdNum);
            }
          }
        }
      } catch (error) {
        console.error("Error initializing user:", error);
      } finally {
        // Set a timeout to ensure we don't wait forever
        setTimeout(() => setIsInitializing(false), 1000);
      }
    };
    initializeUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgName, userId, currentUser?.organization?.org_name, currentUser?.user_id]);

  // Update URL when user changes
  useEffect(() => {
    if (!currentUser?.organization || !currentUser.user_id) return;

    // Don't redirect if we're on a chat URL with userId
    if (chatUserId || (tab && tab.startsWith('chat/'))) {
      return;
    }

    const currentTab = tab || pathToTab[location.pathname] || "dashboard";
    const expectedPath = `/${currentUser.organization.org_name}/${currentUser.user_id}/${currentTab}`;

    // If the URL already specifies a user (orgName & userId exist),
    // we assume the user intends to be there (potentially switching users).
    const isUrlSwitchingUser =
      orgName &&
      userId &&
      (orgName !== currentUser.organization.org_name ||
        String(parseInt(userId, 10)) !== String(currentUser.user_id));

    // If we are switching user via URL, DO NOT redirect back to old user.
    if (isUrlSwitchingUser) {
      return;
    }

    // Only navigate if:
    // 1. Current path doesn't match expected path
    // 2. Current path is not already a valid path for this user (prevents loops)
    // 3. Current path is not a chat with userId (chat/userId pattern)
    const isOnUserPath = location.pathname.startsWith(
      `/${currentUser.organization.org_name}/${currentUser.user_id}/`
    );
    const normalizedPathname = decodeURIComponent(location.pathname);
    const pathMatches = normalizedPathname === expectedPath;
    const isChatWithUserId = location.pathname.match(/\/chat\/[^/]+$/);

    if (!pathMatches && !isOnUserPath && !isChatWithUserId) {
      navigate(expectedPath, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentUser?.organization?.org_name,
    currentUser?.user_id,
    tab,
    orgName,
    userId,
  ]);

  const handleNavigate = (path: string, action?: string, actionData?: Record<string, unknown>) => {
    // Handle dialog actions
    if (action === "dialog" && actionData?.dialog) {
      const dialogName = String(actionData.dialog);
      // Special case for global Add User dialog which is managed in AppContent
      if (dialogName === "addUser") {
        setAddUserDialogOpen(true);
        // We still navigate to users page if not already there
        if (!location.pathname.includes("/users")) {
          const tabName = pathToTab["/users"] || "users";
          if (currentUser?.organization && currentUser.user_id) {
            navigate(`/${currentUser.organization.org_name}/${currentUser.user_id}/${tabName}`);
          } else {
            navigate("/users");
          }
        }
        return;
      }

      // Navigate to the page first
      const tabName = pathToTab[path as keyof typeof pathToTab] || path.replace("/", "") || "dashboard";
      if (currentUser?.organization && currentUser.user_id) {
        navigate(`/${currentUser.organization.org_name}/${currentUser.user_id}/${tabName}`);
      } else {
        navigate(path);
      }
      // Open dialog after navigation
      setTimeout(() => {
        setDialogStates(prev => ({ ...prev, [dialogName]: true }));
      }, 100);
      return;
    }

    // Handle focus actions (like notifications panel)
    if (action === "focus" && actionData?.section) {
      // Navigate to the page and focus on section
      const tabName = pathToTab[path] || path.replace("/", "") || "dashboard";
      if (currentUser?.organization && currentUser.user_id) {
        navigate(`/${currentUser.organization.org_name}/${currentUser.user_id}/${tabName}`);
      } else {
        navigate(path);
      }
      // Focus logic can be handled by the page component
      return;
    }

    // Regular navigation
    const tabName = pathToTab[path as keyof typeof pathToTab] || path.split("/").filter(Boolean).pop() || "dashboard";
    if (currentUser?.organization && currentUser.user_id) {
      navigate(`/${currentUser.organization.org_name}/${currentUser.user_id}/${tabName}`);
    } else {
      navigate(path);
    }
  };

  // Helper to update dialog state
  const setDialogOpen = (dialogName: string, open: boolean) => {
    setDialogStates(prev => ({ ...prev, [dialogName]: open }));
  };

  // Get current path from URL
  const getCurrentPath = () => {
    // If we have chatUserId in URL params, we're on a chat page
    if (chatUserId) {
      return "/chat";
    }

    // If we have a tab parameter from /:orgName/:userId/:tab route, use it
    if (tab) {
      // Check if it's a chat with userId pattern (chat/userId)
      if (tab.startsWith('chat/')) {
        return "/chat";
      }
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

    // Check if location.pathname directly matches a known route
    // This handles navigation to simple paths like /users, /students, /chat
    // when currentUser.organization is unavailable
    if (pathToTab[location.pathname]) {
      return location.pathname;
    }

    // Handle governance paths
    if (location.pathname.startsWith("/governance/")) {
      return location.pathname;
    }

    // Handle student portal paths
    if (location.pathname.startsWith("/student/")) {
      return location.pathname;
    }

    // Fallback: try to extract tab from /:orgName/:userId/:tab URL pattern
    const pathParts = location.pathname.split("/").filter(Boolean);
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

    return "/";
  };

  const currentPath = getCurrentPath();

  const handleOpenAddUserDialog = () => {
    handleNavigate("/users", "dialog", { dialog: "addUser" });
  };

  const getPageTitle = () => {
    switch (currentPath) {
      case "/":
        return "Dashboard";
      case "/chat":
        return "Chat";
      case "/events":
        return "Events";
      case "/tasks":
        return "Tasks";
      case "/users":
        return "User Management";
      case "/students":
        return "Students";
      case "/attendance":
        return "Attendance";
      case "/admissions":
        return "Admissions";
      case "/finance":
        return "Finance";
      case "/hostel":
        return "Hostel Management";
      case "/exam":
        return "Examinations";
      case "/library":
        return "Library Management";
      case "/transport":
        return "Transportation Management";
      case "/facilities":
        return "Facilities";
      case "/settings":
        return "Settings";
      case "/student/personal-details":
        return "Personal Details";
      case "/student/grades-marks":
        return "Grades & Marks";
      case "/student/attendance":
        return "Attendance Details";
      case "/student/timetable":
      case "/student/examinations":
        return "Examinations";
      case "/student/fee-payment":
        return "Fee Payment";
      case "/tools":
        return "Tools";
      case "/governance/academic":
        return "Academic Governance";
      case "/governance/mis":
        return "MIS Data Submission";
      case "/admin-console":
        return "Admin Console";
      default:
        return "Dashboard";
    }
  };

  const getPageSubtitle = () => {
    if (currentPath === "/") {
      return `Welcome back, ${currentUser?.name.split(" ")[0]}`;
    }
    return undefined;
  };

  const renderContent = () => {
    switch (currentPath) {
      case "/":
        return (
          <Suspense fallback={<PageLoader />}>
            <Dashboard onAddUser={handleOpenAddUserDialog} onNavigate={handleNavigate} />
          </Suspense>
        );
      case "/chat":
        return (
          <Suspense fallback={<PageLoader />}>
            <Chat onNavigate={handleNavigate} />
          </Suspense>
        );
      case "/users":
        return (
          <Suspense fallback={<PageLoader />}>
            <UserManagement
              dialogOpen={dialogStates.addUser || addUserDialogOpen}
              setDialogOpen={(open) => {
                setAddUserDialogOpen(open);
                setDialogOpen("addUser", open);
              }}
            />
          </Suspense>
        );
      case "/students":
        return (
          <Suspense fallback={<PageLoader />}>
            <Students />
          </Suspense>
        );
      case "/attendance":
        return (
          <Suspense fallback={<PageLoader />}>
            <Attendance />
          </Suspense>
        );
      case "/student/personal-details":
        return (
          <Suspense fallback={<PageLoader />}>
            <PersonalDetails />
          </Suspense>
        );
      case "/student/grades-marks":
        return (
          <Suspense fallback={<PageLoader />}>
            <GradesMarks />
          </Suspense>
        );
      case "/student/attendance":
        return (
          <Suspense fallback={<PageLoader />}>
            <AttendanceDetails />
          </Suspense>
        );
      case "/student/timetable":
        return (
          <Suspense fallback={<PageLoader />}>
            <Timetable />
          </Suspense>
        );
      case "/student/examinations":
        return (
          <Suspense fallback={<PageLoader />}>
            <StudentExaminations />
          </Suspense>
        );
      case "/student/fee-payment":
        return (
          <Suspense fallback={<PageLoader />}>
            <FeePayment />
          </Suspense>
        );
      case "/tools":
        return (
          <Suspense fallback={<PageLoader />}>
            <Tools />
          </Suspense>
        );

      case "/governance/academic":
        return (
          <Suspense fallback={<PageLoader />}>
            <AcademicGovernance />
          </Suspense>
        );
      case "/governance/mis":
        return (
          <Suspense fallback={<PageLoader />}>
            <MISSubmission />
          </Suspense>
        );
      case "/admin-console":
        return (
          <Suspense fallback={<PageLoader />}>
            <AdminConsole />
          </Suspense>
        );
      case "/finance":
        return (
          <Suspense fallback={<PageLoader />}>
            <Finance />
          </Suspense>
        );
      case "/hostel":
        return (
          <Suspense fallback={<PageLoader />}>
            <HostelDashboard />
          </Suspense>
        );
      case "/exam":
        return (
          <Suspense fallback={<PageLoader />}>
            <ExamDashboard />
          </Suspense>
        );
      case "/library":
        return (
          <Suspense fallback={<PageLoader />}>
            <LibraryDashboard />
          </Suspense>
        );
      case "/transport":
        return (
          <Suspense fallback={<PageLoader />}>
            <Transportation />
          </Suspense>
        );
      case "/admissions":
        return (
          <Suspense fallback={<PageLoader />}>
            <Admissions />
          </Suspense>
        );
      case "/facilities":
        return (
          <Suspense fallback={<PageLoader />}>
            <Facilities />
          </Suspense>
        );
      case "/settings":
        return (
          <Suspense fallback={<PageLoader />}>
            <Settings />
          </Suspense>
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
    if (!currentUser && !loading && !isInitializing && location.pathname !== "/login") {
      navigate("/login", { replace: true });
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

  const isChatConversation = !!chatUserId || (!!tab && tab.startsWith('chat/'));

  return (
    <AppLayout
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
      currentPath={currentPath}
      onNavigate={handleNavigate}
      isChatConversation={isChatConversation}
    >
      {renderContent()}
    </AppLayout>
  );
}

const Index = () => {
  return <AppContent />;
};

export default Index;
