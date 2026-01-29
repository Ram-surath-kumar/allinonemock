import { LucideIcon } from "lucide-react";
// We'll import icons dynamically or use strings to avoid huge bundle bloat if possible,
// but for type safety in this registry, we might want to define them or just use string keys.
// For now, we'll store icon names as strings and map them in the UI components.

export type ActionType = "navigate" | "dialog" | "focus" | "function";

export interface AppAction {
    id: string;
    title: string;
    description: string;
    keywords: string[];
    category: string;
    path?: string;
    action: ActionType;
    actionData?: any;
    icon?: string; // Icon name (e.g., "UserPlus", "DollarSign")
    adminOnly?: boolean; // If true, only visible to admins/staff
}

// Helper to create actions
const createAction = (action: AppAction) => action;

export const ACTION_REGISTRY: AppAction[] = [
    // ==================== DASHBOARD & GENERAL ====================
    createAction({
        id: "dashboard.view",
        title: "Dashboard",
        description: "View statistics, analytics, and overview",
        keywords: ["dashboard", "home", "stats", "analytics", "overview"],
        category: "Dashboard",
        path: "/",
        action: "navigate",
        icon: "LayoutDashboard",
    }),
    createAction({
        id: "notifications.view",
        title: "Notifications",
        description: "View system notifications and alerts",
        keywords: ["notifications", "alerts", "messages", "warnings"],
        category: "System",
        path: "/", // Stays on page but opens panel
        action: "focus",
        actionData: { section: "notifications" },
        icon: "Bell",
    }),

    // ==================== USER MANAGEMENT ====================
    createAction({
        id: "users.view",
        title: "User Management",
        description: "View and manage all system users",
        keywords: ["users", "staff", "accounts", "people"],
        category: "User Management",
        path: "/users",
        action: "navigate",
        icon: "Users",
        adminOnly: true,
    }),
    createAction({
        id: "users.add",
        title: "Add New User",
        description: "Create a new user account (Student, Teacher, Staff)",
        keywords: ["add user", "create user", "new user", "register user"],
        category: "User Management",
        path: "/users",
        action: "dialog",
        actionData: { dialog: "addUser" },
        icon: "UserPlus",
        adminOnly: true,
    }),
    createAction({
        id: "users.add_ai",
        title: "Add User with AI",
        description: "Extract user data from images or text",
        keywords: ["ai user", "scan user", "upload user", "extract user"],
        category: "User Management",
        path: "/users",
        action: "dialog",
        actionData: { dialog: "addUserAI" },
        icon: "Sparkles",
        adminOnly: true,
    }),
    createAction({
        id: "users.import",
        title: "Bulk Import Users",
        description: "Import multiple users via CSV/Excel",
        keywords: ["bulk import", "import users", "upload csv"],
        category: "User Management",
        path: "/users",
        action: "navigate", // Or dialog if it exists
        icon: "Upload",
        adminOnly: true,
    }),

    // ==================== STUDENTS ====================
    createAction({
        id: "students.view",
        title: "Student List",
        description: "View and filter all student records",
        keywords: ["students", "pupils", "class list", "search student"],
        category: "Students",
        path: "/students",
        action: "navigate",
        icon: "GraduationCap",
    }),
    createAction({
        id: "students.add",
        title: "Add Student",
        description: "Register a new student individually",
        keywords: ["add student", "new student", "enroll student"],
        category: "Students",
        path: "/students", // Can be handled by navigating then opening dialog, or direct dialog
        action: "dialog",
        actionData: { dialog: "addStudent" }, // Assumes we update Students page to handle this
        icon: "UserPlus",
        adminOnly: true, // Only staff/admins
    }),
    createAction({
        id: "students.attendance_view",
        title: "View Student Attendance",
        description: "Check attendance records for students",
        keywords: ["student attendance", "attendance history", "check presence"],
        category: "Students",
        path: "/students", // Likely a tab or filter on students page
        action: "navigate",
        icon: "CalendarCheck",
    }),

    // ==================== ATTENDANCE ====================
    createAction({
        id: "attendance.mark",
        title: "Mark Attendance",
        description: "Record daily attendance for classes",
        keywords: ["mark attendance", "take attendance", "roll call", "present", "absent"],
        category: "Attendance",
        path: "/attendance",
        action: "navigate",
        icon: "ClipboardCheck",
        adminOnly: true, // Teachers/Admins
    }),
    createAction({
        id: "attendance.report",
        title: "Attendance Report",
        description: "View consolidated attendance reports",
        keywords: ["attendance report", "attendance analytics", "monthly attendance"],
        category: "Attendance",
        path: "/attendance", // Assuming reports are here
        action: "navigate",
        icon: "BarChart",
    }),

    // ==================== FINANCE ====================
    createAction({
        id: "finance.dashboard",
        title: "Finance Dashboard",
        description: "Financial overview, earnings, and expenses",
        keywords: ["finance", "money", "accounts", "revenue", "budget"],
        category: "Finance",
        path: "/finance",
        action: "navigate",
        icon: "DollarSign",
        adminOnly: true,
    }),
    createAction({
        id: "finance.collect_fee",
        title: "Collect Fee Payment",
        description: "Record a fee payment from a student",
        keywords: ["collect fee", "pay fee", "payment", "receive money"],
        category: "Finance",
        path: "/finance?tab=collections",
        action: "dialog",
        actionData: { dialog: "collectFee" },
        icon: "CreditCard",
        adminOnly: true,
    }),
    createAction({
        id: "finance.expenses",
        title: "Manage Expenses",
        description: "Track and record school expenses",
        keywords: ["expenses", "spending", "bills", "add expense"],
        category: "Finance",
        path: "/finance?tab=accounting", // Assuming expenses are in accounting
        action: "navigate",
        icon: "Receipt",
        adminOnly: true,
    }),
    createAction({
        id: "finance.reports",
        title: "Financial Reports",
        description: "View balance sheets and profit/loss",
        keywords: ["finance report", "balance sheet", "income statement"],
        category: "Finance",
        path: "/finance?tab=reports",
        action: "navigate",
        icon: "FileText",
        adminOnly: true,
    }),

    // ==================== ADMISSIONS ====================
    createAction({
        id: "admissions.view",
        title: "Admissions Dashboard",
        description: "Manage applications and inquiries",
        keywords: ["admissions", "applications", "inquiries", "applicants"],
        category: "Admissions",
        path: "/admissions",
        action: "navigate",
        icon: "ClipboardList",
        adminOnly: true,
    }),
    createAction({
        id: "admissions.add_applicant",
        title: "New Application",
        description: "Create a new admission application",
        keywords: ["add applicant", "new application", "register applicant"],
        category: "Admissions",
        path: "/admissions",
        action: "dialog",
        actionData: { dialog: "addApplicant" },
        icon: "FilePlus",
        adminOnly: true,
    }),

    // ==================== ACADEMICS & GOVERNANCE ====================
    createAction({
        id: "academics.view",
        title: "Academic Governance",
        description: "Manage courses, subjects, and batches",
        keywords: ["academics", "courses", "subjects", "curriculum", "syllabus"],
        category: "Academics",
        path: "/governance/academic",
        action: "navigate",
        icon: "BookOpen",
        adminOnly: true,
    }),
    createAction({
        id: "timetable.view",
        title: "Timetable / Schedule",
        description: "View and manage class schedules",
        keywords: ["timetable", "schedule", "classes", "periods"],
        category: "Academics",
        path: "/timetable", // Assuming path
        action: "navigate",
        icon: "Clock",
    }),
    createAction({
        id: "mis.view",
        title: "MIS & Compliance",
        description: "Generate AICTE, UGC, and NIRF reports",
        keywords: ["mis", "compliance", "aicte", "nirf", "ugc", "government reports"],
        category: "Academics",
        path: "/governance/mis",
        action: "navigate",
        icon: "FileText",
        adminOnly: true,
    }),

    // ==================== FACILITIES & HOSTEL ====================
    createAction({
        id: "facilities.view",
        title: "Facilities Management",
        description: "Manage rooms, buildings, and assets",
        keywords: ["facilities", "rooms", "buildings", "assets", "infrastructure"],
        category: "Facilities",
        path: "/facilities",
        action: "navigate",
        icon: "Building",
        adminOnly: true,
    }),
    createAction({
        id: "hostel.view",
        title: "Hostel Management",
        description: "Manage hostels, rooms, and allocations",
        keywords: ["hostel", "dormitory", "rooms", "beds", "warden"],
        category: "Hostel",
        path: "/hostel",
        action: "navigate",
        icon: "Home",
        adminOnly: true,
    }),
    createAction({
        id: "hostel.add",
        title: "Add Hostel",
        description: "Register a new hostel building",
        keywords: ["add hostel", "new hostel", "create hostel"],
        category: "Hostel",
        path: "/hostel",
        action: "dialog",
        actionData: { dialog: "addHostel" },
        icon: "PlusCircle",
        adminOnly: true,
    }),
    createAction({
        id: "hostel.allocate",
        title: "Allocate Room",
        description: "Allocate hostel room to a student",
        keywords: ["allocate room", "assign room", "hostel admission"],
        category: "Hostel",
        path: "/hostel",
        action: "dialog",
        actionData: { dialog: "allocateRoom" },
        icon: "UserCheck",
        adminOnly: true,
    }),
    createAction({
        id: "facilities.add_room",
        title: "Add Room",
        description: "Register a new room or facility",
        keywords: ["add room", "create room", "new classroom"],
        category: "Facilities",
        path: "/facilities",
        action: "dialog",
        actionData: { dialog: "addRoom" }, // Needs support in Facilities page
        icon: "PlusSquare",
        adminOnly: true,
    }),
    createAction({
        id: "facilities.transport",
        title: "Transport Management",
        description: "Manage vehicles, routes, and drivers",
        keywords: ["transport", "bus", "vehicles", "drivers", "routes"],
        category: "Facilities",
        path: "/facilities/transport",
        action: "navigate",
        icon: "Bus",
        adminOnly: true,
    }),

    // ==================== LIBRARY ====================
    createAction({
        id: "library.view",
        title: "Library Management",
        description: "Manage books, issues, and returns",
        keywords: ["library", "books", "issue book", "return book"],
        category: "Library",
        path: "/library",
        action: "navigate",
        icon: "Library",
    }),
    createAction({
        id: "library.add_book",
        title: "Add Book",
        description: "Register a new book in the library",
        keywords: ["add book", "new book", "catalog book"],
        category: "Library",
        path: "/library",
        action: "dialog",
        actionData: { dialog: "addBook" },
        icon: "BookPlus",
        adminOnly: true,
    }),

    // ==================== EXAMS ====================
    createAction({
        id: "exams.view",
        title: "Examinations",
        description: "Manage exams, schedules, and results",
        keywords: ["exams", "tests", "results", "marks", "grading"],
        category: "Examinations",
        path: "/exam",
        action: "navigate",
        icon: "FileCheck",
    }),
    createAction({
        id: "exams.schedule",
        title: "Schedule Exam",
        description: "Create a new examination schedule",
        keywords: ["schedule exam", "new exam", "create test"],
        category: "Examinations",
        path: "/exam",
        action: "dialog",
        actionData: { dialog: "scheduleExam" },
        icon: "CalendarPlus",
        adminOnly: true,
    }),

    // ==================== TOOLS & SETTINGS ====================
    createAction({
        id: "tools.view",
        title: "Admin Tools",
        description: "System utilities and configuration",
        keywords: ["tools", "admin", "utilities", "config"],
        category: "Tools",
        path: "/tools",
        action: "navigate",
        icon: "Wrench",
        adminOnly: true,
    }),
    createAction({
        id: "settings.view",
        title: "Settings",
        description: "Application preferences and setup",
        keywords: ["settings", "preferences", "config", "setup"],
        category: "Settings",
        path: "/settings",
        action: "navigate",
        icon: "Settings",
    }),
    createAction({
        id: "settings.roles",
        title: "Role Management",
        description: "Manage user roles and permissions",
        keywords: ["roles", "permissions", "access", "acl"],
        category: "Settings",
        path: "/settings?tab=roles",
        action: "navigate",
        icon: "Shield",
        adminOnly: true,
    }),

    // ==================== STUDENT PORTAL (Specific) ====================
    createAction({
        id: "student.profile",
        title: "My Profile",
        description: "View and edit personal details",
        keywords: ["my profile", "my details", "personal info"],
        category: "Student",
        path: "/student/personal-details",
        action: "navigate",
        icon: "User",
    }),
    createAction({
        id: "student.grades",
        title: "My Grades & Marks",
        description: "View academic performance",
        keywords: ["my grades", "my marks", "results", "report card"],
        category: "Student",
        path: "/student/grades-marks",
        action: "navigate",
        icon: "Award",
    }),
    createAction({
        id: "student.timetable",
        title: "My Timetable",
        description: "View class schedule",
        keywords: ["my timetable", "my schedule", "classes"],
        category: "Student",
        path: "/student/timetable",
        action: "navigate",
        icon: "Calendar",
    }),
    createAction({
        id: "student.fees",
        title: "Pay Fees",
        description: "View and pay pending fees",
        keywords: ["pay fees", "my fees", "dues"],
        category: "Student",
        path: "/student/fee-payment",
        action: "navigate",
        icon: "CreditCard",
    }),
];

/**
 * Helper to get available actions based on user role
 */
export function getActionsForUser(role?: string): AppAction[] {
    // Simple role check - in a real app, check permissions
    const isAdminOrStaff = role === "admin" || role === "staff" || role === "teacher";

    return ACTION_REGISTRY.filter(action => {
        if (action.adminOnly && !isAdminOrStaff) return false;
        return true;
    });
}
