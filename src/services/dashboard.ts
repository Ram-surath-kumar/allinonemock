import { api } from './api';

export interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  attendanceRate: number;
  feeCollection?: number;
  feeCollectionPercentage: number;
}

export interface GrowthDataPoint {
  date: string;
  value: number;
  label: string;
}

export interface GrowthData {
  data: GrowthDataPoint[];
  change: number;
  changePercent: number;
}

export interface GrowthStats {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  period: string;
  data: GrowthDataPoint[];
}

export interface StaffBreakdown {
  teachers: number;
  librarians: number;
  housekeeping: number;
  accountants: number;
  total: number;
}

export interface ConsolidatedGrowthData {
  students: {
    week: GrowthStats;
    month: GrowthStats;
  };
  staff: {
    week: GrowthStats;
    month: GrowthStats;
  };
  attendance: {
    week: GrowthStats;
    month: GrowthStats;
  };
}

export type PeriodType = 'week' | 'month' | 'quarter' | 'year';

/**
 * Get consolidated dashboard data from backend
 * This replaces multiple API calls with a single call
 * Returns: stats, activities, students, departments, notifications, userInfo, organizationInfo, allUsers
 */
export async function getDashboardData(userId?: string, role?: string) {
  const response = await api.getDashboardData(userId, role);
  if (response.error) {
    throw new Error(response.error);
  }
  return response.data;
}

/**
 * Get dashboard stats using consolidated backend API
 * This replaces multiple API calls with a single call
 * Only fetches data when dashboard is actually displayed
 */
export async function getDashboardStats(userId?: string, role?: string): Promise<DashboardStats> {
  try {
    // Use consolidated dashboard endpoint - fetches ALL data in one call
    const dashboardData = await getDashboardData(userId, role);
    
    if (!dashboardData) {
      throw new Error('No dashboard data received');
    }

    // Extract stats from consolidated response
    const stats = dashboardData.stats as Record<string, unknown>;
    const students = dashboardData.students as unknown[] || [];

    // Get values from stats (calculated in backend)
    const totalStudents = typeof stats.totalStudents === 'number' 
      ? stats.totalStudents 
      : students.length;
    
    const totalStaff = typeof stats.totalStaff === 'number' 
      ? stats.totalStaff 
      : 0;

    const attendanceRate = typeof stats.attendanceRate === 'number'
      ? stats.attendanceRate
      : 0;

    const feeCollectionPercentage = typeof stats.feeCollectionPercentage === 'number'
      ? stats.feeCollectionPercentage
      : 0;

    const feeCollection = typeof stats.feeCollection === 'number' 
      ? stats.feeCollection 
      : 0;

    return {
      totalStudents,
      totalStaff,
      attendanceRate,
      feeCollection,
      feeCollectionPercentage,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

export async function getGrowthData(
  metric: 'students' | 'staff' | 'attendance' | 'fees',
  period: PeriodType = 'month'
): Promise<GrowthStats> {
  try {
    // Use consolidated backend endpoint - fetches all data in one call
    const response = await api.getGrowthData(metric, period);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data as GrowthStats;
  } catch (error) {
    console.error('Error fetching growth data:', error);
    throw error;
  }
}

// Get staff breakdown by role
export async function getStaffBreakdown(period?: PeriodType): Promise<StaffBreakdown> {
  try {
    // Use consolidated backend endpoint
    const response = await api.getStaffBreakdown();
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data as StaffBreakdown;
  } catch (error) {
    console.error('Error fetching staff breakdown:', error);
    throw error;
  }
}

// Get staff growth data by role
export async function getStaffGrowthByRole(role: 'teacher' | 'librarian' | 'housekeeping' | 'accountant', period: PeriodType = 'month'): Promise<GrowthStats> {
  try {
    // Use consolidated backend endpoint - fetches all data in one call
    const response = await api.getStaffGrowthByRole(role, period);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data as GrowthStats;
  } catch (error) {
    console.error('Error fetching staff growth by role:', error);
    throw error;
  }
}

/**
 * Get all growth data (students, staff, attendance) for all periods (week, month) in a single call
 * This reduces API calls from 6 to 1
 */
export async function getConsolidatedGrowthData(): Promise<ConsolidatedGrowthData> {
  try {
    const response = await api.getConsolidatedGrowthData();
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data as ConsolidatedGrowthData;
  } catch (error) {
    console.error('Error fetching consolidated growth data:', error);
    throw error;
  }
}
