// Type exports for compatibility (JavaScript doesn't use these at runtime)
export const UserRole = null;
export const User = null;

export const ROLE_HIERARCHY = {
  admin: 1,
  vice_head: 2,
  teacher: 3,
  librarian: 3,
  accountant: 3,
  housekeeping: 4,
  student: 5,
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  vice_head: 'Vice Head',
  teacher: 'Teacher',
  student: 'Student',
  housekeeping: 'Housekeeping Staff',
  librarian: 'Librarian',
  accountant: 'Accountant',
};

export const PERMISSIONS = [
  { id: 'view_students', name: 'View Student Data', description: 'Can view student profiles and records', category: 'student' },
  { id: 'edit_students', name: 'Edit Student Data', description: 'Can modify student information', category: 'student' },
  { id: 'manage_attendance', name: 'Manage Attendance', description: 'Can mark and edit attendance', category: 'academic' },
  { id: 'view_grades', name: 'View Grades', description: 'Can view student grades', category: 'academic' },
  { id: 'edit_grades', name: 'Edit Grades', description: 'Can modify student grades', category: 'academic' },
  { id: 'manage_timetable', name: 'Manage Timetable', description: 'Can create and edit timetables', category: 'academic' },
  { id: 'view_finance', name: 'View Financial Data', description: 'Can view fee and payment records', category: 'finance' },
  { id: 'manage_finance', name: 'Manage Finances', description: 'Can process payments and fees', category: 'finance' },
  { id: 'manage_library', name: 'Manage Library', description: 'Can manage library books and loans', category: 'facility' },
  { id: 'manage_facilities', name: 'Manage Facilities', description: 'Can manage campus facilities', category: 'facility' },
  { id: 'view_staff', name: 'View Staff Data', description: 'Can view staff profiles', category: 'staff' },
  { id: 'manage_staff', name: 'Manage Staff', description: 'Can add and edit staff members', category: 'staff' },
];

export const ROLE_DEFAULT_PERMISSIONS = {
  admin: PERMISSIONS.map(p => p.id),
  vice_head: ['view_students', 'edit_students', 'manage_attendance', 'view_grades', 'edit_grades', 'manage_timetable', 'view_finance', 'view_staff', 'manage_staff'],
  teacher: ['view_students', 'manage_attendance', 'view_grades', 'edit_grades', 'view_staff'],
  student: [], // Students can only view their own data, no additional permissions needed
  housekeeping: ['manage_facilities'],
  librarian: ['view_students', 'manage_library'],
  accountant: ['view_students', 'view_finance', 'manage_finance'],
};

// Permissions that are allowed for each role
export const ROLE_ALLOWED_PERMISSIONS = {
  admin: PERMISSIONS.map(p => p.id), // Admins can have all permissions
  vice_head: ['view_students', 'edit_students', 'manage_attendance', 'view_grades', 'edit_grades', 'manage_timetable', 'view_finance', 'view_staff', 'manage_staff'],
  teacher: ['view_students', 'edit_students', 'manage_attendance', 'view_grades', 'edit_grades', 'manage_timetable', 'view_staff'], // Teachers cannot view/manage finance
  student: [], // Students cannot have any permissions (they can only view their own data by default)
  housekeeping: ['manage_facilities'],
  librarian: ['view_students', 'manage_library'],
  accountant: ['view_students', 'view_finance', 'manage_finance'],
};
