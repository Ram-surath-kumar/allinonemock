// Type declarations for the ERP system

/** User roles in the system */
export type UserRole =
  | "admin"
  | "vice_head"
  | "teacher"
  | "student"
  | "housekeeping"
  | "librarian"
  | "accountant";

/** User object structure */
export interface User {
  id: string;
  loopid?: string;
  org_id?: number;
  user_id?: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  department?: string;
  createdAt: Date;
  status?: string;
  avatar?: string;
  organization?: Organization;
}

/** Organization object structure */
export interface Organization {
  id: number;
  org_id: string;
  org_code: string;
  org_name: string;
  org_logo?: string;
  allowed_tabs?: string[];
}

/** Dashboard stats structure */
export interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  attendanceRate: number;
  feeCollection: number;
  feeCollectionPercentage: number;
}
