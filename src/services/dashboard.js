import { api } from './api';

/**
 * Get consolidated dashboard data from backend
 * This replaces multiple API calls with a single call
 * Returns: stats, recentActivities, students, departments, notifications, allUsers
 */
export async function getDashboardData(userId, role) {
  const response = await api.getDashboardData(userId, role);
  if (response.error) {
    console.error('getDashboardData - API error:', response.error);
    throw new Error(response.error);
  }
  console.log('getDashboardData - API response:', {
    hasData: !!response.data,
    hasStats: !!(response.data && response.data.stats),
    stats: response.data?.stats,
    totalStudents: response.data?.stats?.totalStudents,
    totalStaff: response.data?.stats?.totalStaff,
    attendanceRate: response.data?.stats?.attendanceRate,
    userId,
    role,
    fullResponse: response
  });
  
  if (!response.data) {
    console.error('getDashboardData - No data in response:', response);
    throw new Error('No data received from dashboard API');
  }
  
  return response.data;
}

/**
 * Get dashboard stats using consolidated backend API
 * This replaces multiple API calls with a single call
 * Only fetches data when dashboard is actually displayed
 */
export async function getDashboardStats(userId, role) {
  try {
    // Use consolidated dashboard endpoint - fetches ALL data in one call
    const dashboardData = await getDashboardData(userId, role);
    
    if (!dashboardData) {
      throw new Error('No dashboard data received');
    }

    // Extract stats from consolidated response
    const stats = dashboardData.stats;
    const students = dashboardData.students;

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
  metric,
  period = 'month'
) {
  try {
    // Use consolidated backend endpoint - fetches all data in one call
    const response = await api.getGrowthData(metric, period);
    if (response.error) {
      throw new Error(response.error);
    }
    
    // Transform API response to match component expectations
    // API returns: currentValue, previousValue, dataPoints
    // Transform to: current, previous, data (for backward compatibility)
    const apiData = response.data || {};
    const transformedData = {
      ...apiData,
      // Map API property names to component expected names
      current: apiData.currentValue !== undefined ? apiData.currentValue : apiData.current,
      previous: apiData.previousValue !== undefined ? apiData.previousValue : apiData.previous,
      data: apiData.dataPoints || apiData.data || [],
      // Keep original names for compatibility
      currentValue: apiData.currentValue,
      previousValue: apiData.previousValue,
      dataPoints: apiData.dataPoints || [],
      // Ensure change and changePercent exist
      change: apiData.change !== undefined ? apiData.change : (apiData.currentValue - (apiData.previousValue || 0)),
      changePercent: apiData.changePercent !== undefined ? apiData.changePercent : 
        (apiData.previousValue && apiData.previousValue !== 0 ? 
          ((apiData.change || (apiData.currentValue - apiData.previousValue)) / apiData.previousValue * 100) : 
          (apiData.currentValue > 0 ? 100 : 0))
    };
    
    console.log('getGrowthData - Transformed data:', transformedData);
    return transformedData;
  } catch (error) {
    console.error('Error fetching growth data:', error);
    throw error;
  }
}

// Get staff breakdown by role
export async function getStaffBreakdown(period) {
  try {
    // Use consolidated backend endpoint
    const response = await api.getStaffBreakdown();
    if (response.error) {
      throw new Error(response.error);
    }
    const data = response.data || {};
    console.log('getStaffBreakdown - API response:', data);
    // Normalize property names - API returns singular, but component may expect plural
    // Return both for compatibility
    const teacher = typeof data.teacher === 'number' ? data.teacher : (typeof data.teachers === 'number' ? data.teachers : 0);
    const librarian = typeof data.librarian === 'number' ? data.librarian : (typeof data.librarians === 'number' ? data.librarians : 0);
    const accountant = typeof data.accountant === 'number' ? data.accountant : (typeof data.accountants === 'number' ? data.accountants : 0);
    
    return {
      // Singular (from API)
      teacher,
      librarian,
      accountant,
      housekeeping: typeof data.housekeeping === 'number' ? data.housekeeping : 0,
      other: typeof data.other === 'number' ? data.other : 0,
      // Plural (for component compatibility)
      teachers: teacher,
      librarians: librarian,
      accountants: accountant,
    };
  } catch (error) {
    console.error('Error fetching staff breakdown:', error);
    throw error;
  }
}

// Get staff growth data by role
export async function getStaffGrowthByRole(role, period = 'month') {
  try {
    // Use consolidated backend endpoint - fetches all data in one call
    const response = await api.getStaffGrowthByRole(role, period);
    if (response.error) {
      throw new Error(response.error);
    }
    
    // Transform API response to match component expectations
    const apiData = response.data || {};
    const transformedData = {
      ...apiData,
      // Map API property names to component expected names
      current: apiData.currentValue !== undefined ? apiData.currentValue : apiData.current,
      previous: apiData.previousValue !== undefined ? apiData.previousValue : apiData.previous,
      data: apiData.dataPoints || apiData.data || [],
      // Keep original names for compatibility
      currentValue: apiData.currentValue,
      previousValue: apiData.previousValue,
      dataPoints: apiData.dataPoints || [],
      // Ensure change and changePercent exist
      change: apiData.change !== undefined ? apiData.change : (apiData.currentValue - (apiData.previousValue || 0)),
      changePercent: apiData.changePercent !== undefined ? apiData.changePercent : 
        (apiData.previousValue && apiData.previousValue !== 0 ? 
          ((apiData.change || (apiData.currentValue - apiData.previousValue)) / apiData.previousValue * 100) : 
          (apiData.currentValue > 0 ? 100 : 0))
    };
    
    console.log('getStaffGrowthByRole - Transformed data:', transformedData);
    return transformedData;
  } catch (error) {
    console.error('Error fetching staff growth by role:', error);
    throw error;
  }
}

/**
 * Get all growth data (students, staff, attendance) for all periods (week, month) in a single call
 * This reduces API calls from 6 to 1
 */
export async function getConsolidatedGrowthData() {
  try {
    const response = await api.getConsolidatedGrowthData();
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching consolidated growth data:', error);
    throw error;
  }
}
