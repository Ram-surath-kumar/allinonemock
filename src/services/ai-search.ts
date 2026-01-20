import { callGeminiAPI } from './gemini';

export interface SearchSuggestion {
    title: string;
    description: string;
    path: string;
    category: string;
    icon?: string;
    confidence: number;
    action?: 'navigate' | 'dialog' | 'focus';
    actionData?: any;
}

// Comprehensive feature knowledge base mapped from FEATURES_LIST.txt
const FEATURE_KNOWLEDGE_BASE = [
    // Dashboard
    { keywords: ['dashboard', 'home', 'overview', 'statistics', 'analytics', 'metrics'], path: '/', category: 'Dashboard', title: 'Dashboard', description: 'View statistics, analytics, and quick actions', action: 'navigate' as const },
    { keywords: ['quick actions', 'actions', 'shortcuts'], path: '/', category: 'Dashboard', title: 'Quick Actions', description: 'Access common tasks quickly', action: 'navigate' as const },
    { keywords: ['analytics', 'charts', 'trends', 'graphs'], path: '/', category: 'Dashboard', title: 'Analytics Charts', description: 'View attendance trends, fee collection, and growth charts', action: 'navigate' as const },
    { keywords: ['recent activity', 'timeline', 'history'], path: '/', category: 'Dashboard', title: 'Recent Activity', description: 'View recent system activities and events', action: 'navigate' as const },

    // User Management
    { keywords: ['users', 'user management', 'manage users', 'user list'], path: '/users', category: 'User Management', title: 'User Management', description: 'View and manage all users', action: 'navigate' as const },
    { keywords: ['add user', 'create user', 'new user', 'add student', 'add teacher', 'add staff'], path: '/users', category: 'User Management', title: 'Add User', description: 'Add new users to the system', action: 'dialog' as const, actionData: { dialog: 'addUser' } },
    { keywords: ['add user with ai', 'ai import', 'upload student image', 'extract student data'], path: '/users', category: 'User Management', title: 'Add User with AI', description: 'Extract student data from images using AI', action: 'dialog' as const, actionData: { dialog: 'addUserAI' } },
    { keywords: ['bulk import', 'import students', 'bulk student'], path: '/users', category: 'User Management', title: 'Bulk Student Import', description: 'Import multiple students at once', action: 'navigate' as const },
    { keywords: ['edit user', 'update user', 'modify user'], path: '/users', category: 'User Management', title: 'Edit User', description: 'Edit existing user details', action: 'navigate' as const },
    { keywords: ['permissions', 'user permissions', 'access control'], path: '/users', category: 'User Management', title: 'Permission Management', description: 'Assign and manage user permissions', action: 'navigate' as const },

    // Students
    { keywords: ['students', 'student list', 'view students', 'all students'], path: '/students', category: 'Students', title: 'Students', description: 'View and manage student records' },
    { keywords: ['search students', 'find student'], path: '/students', category: 'Students', title: 'Student Search', description: 'Search students by name, ID, or department' },
    { keywords: ['edit student', 'update student', 'student details'], path: '/students', category: 'Students', title: 'Edit Student', description: 'Edit student information' },
    { keywords: ['student attendance', 'view attendance'], path: '/students', category: 'Students', title: 'View Student Attendance', description: 'View individual student attendance records' },

    // Attendance
    { keywords: ['attendance', 'mark attendance', 'take attendance', 'attendance marking'], path: '/attendance', category: 'Attendance', title: 'Mark Attendance', description: 'Mark student attendance for selected date' },
    { keywords: ['bulk attendance', 'mark multiple', 'attendance bulk'], path: '/attendance', category: 'Attendance', title: 'Bulk Attendance Marking', description: 'Mark attendance for multiple students' },
    { keywords: ['attendance calendar', 'attendance date'], path: '/attendance', category: 'Attendance', title: 'Attendance Calendar', description: 'Select date for marking attendance' },
    { keywords: ['attendance records', 'attendance history', 'past attendance'], path: '/attendance', category: 'Attendance', title: 'Attendance Records', description: 'View historical attendance records' },

    // Personal Details (Student)
    { keywords: ['personal details', 'my details', 'profile', 'my profile'], path: '/student/personal-details', category: 'Student', title: 'Personal Details', description: 'View and edit personal information' },
    { keywords: ['edit personal', 'update profile'], path: '/student/personal-details', category: 'Student', title: 'Edit Personal Details', description: 'Update personal information' },

    // Grades & Marks (Student)
    { keywords: ['grades', 'marks', 'results', 'scores', 'gpa'], path: '/student/grades-marks', category: 'Student', title: 'Grades & Marks', description: 'View course grades and marks' },
    { keywords: ['failed courses', 'failed subjects'], path: '/student/grades-marks', category: 'Student', title: 'Failed Courses', description: 'View courses where you failed' },
    { keywords: ['absent exams', 'exam absent'], path: '/student/grades-marks', category: 'Student', title: 'Absent Details', description: 'View examination absent records' },
    { keywords: ['malpractice', 'exam malpractice'], path: '/student/grades-marks', category: 'Student', title: 'Malpractice Details', description: 'View malpractice records' },

    // Attendance Details (Student)
    { keywords: ['my attendance', 'attendance details', 'attendance stats'], path: '/student/attendance', category: 'Student', title: 'Attendance Details', description: 'View your attendance statistics and records' },
    { keywords: ['attendance trend', 'attendance chart'], path: '/student/attendance', category: 'Student', title: 'Attendance Trend', description: 'View attendance trends over time' },

    // Timetable (Student)
    { keywords: ['timetable', 'schedule', 'class schedule', 'time table'], path: '/student/timetable', category: 'Student', title: 'Timetable', description: 'View weekly class schedule' },
    { keywords: ['today schedule', 'today classes'], path: '/student/timetable', category: 'Student', title: 'Today\'s Schedule', description: 'View today\'s classes' },

    // Fee Payment (Student)
    { keywords: ['fee payment', 'pay fees', 'fees', 'payment', 'pay fee'], path: '/student/fee-payment', category: 'Student', title: 'Fee Payment', description: 'View and pay fees' },
    { keywords: ['fee summary', 'fee overview'], path: '/student/fee-payment', category: 'Student', title: 'Payment Summary', description: 'View total fees and payment status' },
    { keywords: ['download receipt', 'payment receipt'], path: '/student/fee-payment', category: 'Student', title: 'Download Receipt', description: 'Download payment receipts' },

    // Finance
    { keywords: ['finance', 'financial', 'fee management'], path: '/finance', category: 'Finance', title: 'Finance', description: 'Manage fees, payments, and accounting' },
    { keywords: ['fee collection', 'collect fees', 'payment collection'], path: '/finance', category: 'Finance', title: 'Payment Collection', description: 'Collect fee payments from students' },
    { keywords: ['refunds', 'refund', 'fee refund'], path: '/finance', category: 'Finance', title: 'Refunds', description: 'Process fee refunds' },
    { keywords: ['accounting', 'accounts', 'chart of accounts'], path: '/finance', category: 'Finance', title: 'Accounting', description: 'Manage chart of accounts and transactions' },
    { keywords: ['finance reports', 'financial reports'], path: '/finance', category: 'Finance', title: 'Finance Reports', description: 'View financial reports and analytics' },

    // Academic Governance
    { keywords: ['academic', 'academics', 'academic governance', 'courses'], path: '/governance/academic', category: 'Academics', title: 'Academic Governance', description: 'Manage courses and curriculum' },

    // MIS Reports
    { keywords: ['mis', 'mis reports', 'reports', 'reporting'], path: '/governance/mis', category: 'Reports', title: 'MIS Reports', description: 'View management information system reports' },

    // Facilities
    { keywords: ['facilities', 'facility management', 'infrastructure'], path: '/facilities', category: 'Facilities', title: 'Facilities', description: 'Manage school facilities and infrastructure' },

    // Hostel
    { keywords: ['hostel', 'hostel management', 'dormitory'], path: '/hostel', category: 'Hostel', title: 'Hostel', description: 'Manage hostel and accommodation' },

    // Library
    { keywords: ['library', 'library management', 'books'], path: '/library', category: 'Library', title: 'Library', description: 'Manage library and book inventory' },

    // Examinations
    { keywords: ['exam', 'exams', 'examination', 'examinations', 'tests'], path: '/exam', category: 'Examinations', title: 'Examinations', description: 'Manage examinations and tests' },

    // Tools
    { keywords: ['tools', 'utilities', 'admin tools'], path: '/tools', category: 'Tools', title: 'Tools', description: 'Access administrative tools' },
    { keywords: ['add department', 'create department', 'new department'], path: '/tools', category: 'Tools', title: 'Add Department', description: 'Create new departments', action: 'focus' as const, actionData: { section: 'addDepartment' } },
    { keywords: ['map teachers', 'assign teachers', 'teacher mapping'], path: '/tools', category: 'Tools', title: 'Map Teachers to Department', description: 'Assign teachers to departments' },

    // Settings
    { keywords: ['settings', 'preferences', 'configuration', 'system settings'], path: '/settings', category: 'Settings', title: 'Settings', description: 'Configure system settings' },
    { keywords: ['team settings', 'team management'], path: '/settings', category: 'Settings', title: 'Team Settings', description: 'Manage team members and roles' },

    // Notifications
    { keywords: ['notifications', 'alerts', 'notices'], path: '/', category: 'System', title: 'Notifications', description: 'View system notifications', action: 'focus' as const, actionData: { section: 'notifications' } },
];

/**
 * Search features using AI-powered natural language understanding
 */
export async function searchFeatures(query: string, currentUser?: any): Promise<SearchSuggestion[]> {
    if (!query || query.trim().length < 2) {
        return [];
    }

    const normalizedQuery = query.toLowerCase().trim();

    // First, try direct keyword matching for instant results
    const keywordMatches = FEATURE_KNOWLEDGE_BASE.filter(feature => {
        return feature.keywords.some(keyword =>
            keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword)
        );
    }).map(feature => ({
        title: feature.title,
        description: feature.description,
        path: feature.path,
        category: feature.category,
        confidence: calculateConfidence(normalizedQuery, feature.keywords),
        action: feature.action,
        actionData: feature.actionData,
    }));

    // Sort by confidence and take top 5
    const topKeywordMatches = keywordMatches
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);

    // If we have high-confidence keyword matches, return them immediately
    if (topKeywordMatches.length > 0 && topKeywordMatches[0].confidence > 0.7) {
        return topKeywordMatches;
    }

    // For more complex queries, use AI
    try {
        const aiContext = {
            students: [],
            currentDate: new Date().toISOString().split('T')[0],
        };

        // Create a prompt for AI to understand the search intent
        const searchPrompt = `Parse this search query and identify what the user is looking for: "${query}"
    
Available features: ${FEATURE_KNOWLEDGE_BASE.map(f => f.title).join(', ')}

Return ONLY a JSON object with this structure:
{
  "intent": "brief description of what user wants",
  "matchingFeatures": ["feature1", "feature2"],
  "confidence": 0.95
}`;

        const aiResponse = await callGeminiAPI(searchPrompt, aiContext);

        // Combine AI results with keyword matches
        const combinedResults = [...topKeywordMatches];

        // Add unique AI suggestions
        if (aiResponse && aiResponse.action !== 'unknown') {
            const aiSuggestions = FEATURE_KNOWLEDGE_BASE
                .filter(f => f.title.toLowerCase().includes(aiResponse.message?.toLowerCase() || ''))
                .map(f => ({
                    title: f.title,
                    description: f.description,
                    path: f.path,
                    category: f.category,
                    confidence: aiResponse.confidence || 0.6,
                    action: f.action,
                    actionData: f.actionData,
                }));

            aiSuggestions.forEach(suggestion => {
                if (!combinedResults.some(r => r.path === suggestion.path)) {
                    combinedResults.push(suggestion);
                }
            });
        }

        return combinedResults
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 8);
    } catch (error) {
        console.error('AI search error:', error);
        // Fallback to keyword matches
        return topKeywordMatches;
    }
}

/**
 * Calculate confidence score based on keyword matching
 */
function calculateConfidence(query: string, keywords: string[]): number {
    const queryWords = query.toLowerCase().split(' ');
    let score = 0;

    keywords.forEach(keyword => {
        const keywordWords = keyword.toLowerCase().split(' ');

        // Exact match
        if (keyword === query) {
            score = Math.max(score, 1.0);
            return;
        }

        // Keyword contains query
        if (keyword.includes(query)) {
            score = Math.max(score, 0.9);
            return;
        }

        // Query contains keyword
        if (query.includes(keyword)) {
            score = Math.max(score, 0.85);
            return;
        }

        // Word-level matching
        const matchingWords = queryWords.filter(qw =>
            keywordWords.some(kw => kw.includes(qw) || qw.includes(kw))
        );

        if (matchingWords.length > 0) {
            const wordScore = matchingWords.length / Math.max(queryWords.length, keywordWords.length);
            score = Math.max(score, wordScore * 0.7);
        }
    });

    return Math.min(score, 1.0);
}

/**
 * Get popular/suggested searches
 */
export function getPopularSearches(): SearchSuggestion[] {
    return [
        {
            title: 'Mark Attendance',
            description: 'Mark student attendance for today',
            path: '/attendance',
            category: 'Attendance',
            confidence: 1.0,
        },
        {
            title: 'Add User',
            description: 'Add new users to the system',
            path: '/users',
            category: 'User Management',
            confidence: 1.0,
            action: 'dialog',
            actionData: { dialog: 'addUser' },
        },
        {
            title: 'View Students',
            description: 'View and manage student records',
            path: '/students',
            category: 'Students',
            confidence: 1.0,
        },
        {
            title: 'Finance',
            description: 'Manage fees and payments',
            path: '/finance',
            category: 'Finance',
            confidence: 1.0,
        },
    ];
}
