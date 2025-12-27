import { api } from './api';
import { supabase } from '@/lib/supabase';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

export interface DashboardStats {
  totalStudents: number;
  staffMembers: number;
  attendanceRate: number;
  feeCollection: number;
  feeCollectionPercentage: number;
}

export interface GrowthDataPoint {
  date: string;
  value: number;
  label: string;
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

export type PeriodType = 'week' | 'month' | 'quarter' | 'year';

// Fetch real-time dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get total students
    const { count: studentCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('status', 'active');

    // Get staff members (all non-student roles)
    const { count: staffCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .in('role', ['teacher', 'librarian', 'housekeeping', 'accountant', 'admin', 'vice_head'])
      .eq('status', 'active');

    // Get attendance rate (average for last 7 days)
    const today = new Date();
    const weekAgo = subDays(today, 7);
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('status, date')
      .gte('date', format(weekAgo, 'yyyy-MM-dd'))
      .lte('date', format(today, 'yyyy-MM-dd'));

    const totalAttendanceRecords = attendanceData?.length || 0;
    const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
    const attendanceRate = totalAttendanceRecords > 0 
      ? (presentCount / totalAttendanceRecords) * 100 
      : 0;

    // Get fee collection (assuming there's a fees or payments table)
    // For now, we'll use a placeholder - you may need to adjust based on your schema
    const feeCollection = 0; // TODO: Implement based on your fees/payments table
    const feeCollectionPercentage = 0; // TODO: Implement based on your fees/payments table

    return {
      totalStudents: studentCount || 0,
      staffMembers: staffCount || 0,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      feeCollection,
      feeCollectionPercentage,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

// Get growth data for a specific metric
export async function getGrowthData(
  metric: 'students' | 'staff' | 'attendance' | 'fees',
  period: PeriodType = 'month'
): Promise<GrowthStats> {
  try {
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    const dataPoints: GrowthDataPoint[] = [];

    switch (period) {
      case 'week': {
        startDate = subWeeks(now, 1);
        previousStartDate = subWeeks(now, 2);
        // Get daily data for the last week
        const weekDays = eachDayOfInterval({ start: startDate, end: now });
        for (const day of weekDays) {
          const dateStr = format(day, 'yyyy-MM-dd');
          let value = 0;
          
          if (metric === 'students') {
            const { count } = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
              .eq('role', 'student')
              .eq('status', 'active')
              .lte('created_at', format(day, "yyyy-MM-dd'T'23:59:59"));
            value = count || 0;
          } else if (metric === 'staff') {
            const { count } = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
              .in('role', ['teacher', 'librarian', 'housekeeping', 'accountant', 'admin', 'vice_head'])
              .eq('status', 'active')
              .lte('created_at', format(day, "yyyy-MM-dd'T'23:59:59"));
            value = count || 0;
          } else if (metric === 'attendance') {
            const { data } = await supabase
              .from('attendance')
              .select('status')
              .eq('date', dateStr);
            const total = data?.length || 0;
            const present = data?.filter(a => a.status === 'present').length || 0;
            value = total > 0 ? (present / total) * 100 : 0;
          }
          
          dataPoints.push({
            date: dateStr,
            value: Math.round(value * 10) / 10,
            label: format(day, 'MMM d'),
          });
        }
        break;
      }
      case 'month': {
        startDate = subMonths(now, 1);
        previousStartDate = subMonths(now, 2);
        // Get weekly data for the last month
        const monthWeeks = eachWeekOfInterval({ start: startDate, end: now });
        for (const week of monthWeeks) {
          const weekEnd = week > now ? now : week;
          let value = 0;
          
          if (metric === 'students') {
            const { count } = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
              .eq('role', 'student')
              .eq('status', 'active')
              .lte('created_at', format(weekEnd, "yyyy-MM-dd'T'23:59:59"));
            value = count || 0;
          } else if (metric === 'staff') {
            const { count } = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
              .in('role', ['teacher', 'librarian', 'housekeeping', 'accountant', 'admin', 'vice_head'])
              .eq('status', 'active')
              .lte('created_at', format(weekEnd, "yyyy-MM-dd'T'23:59:59"));
            value = count || 0;
          } else if (metric === 'attendance') {
            // Get average attendance for the week
            const weekStart = format(week, 'yyyy-MM-dd');
            const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
            const { data } = await supabase
              .from('attendance')
              .select('status, date')
              .gte('date', weekStart)
              .lte('date', weekEndStr);
            const total = data?.length || 0;
            const present = data?.filter(a => a.status === 'present').length || 0;
            value = total > 0 ? (present / total) * 100 : 0;
          }
          
          dataPoints.push({
            date: format(weekEnd, 'yyyy-MM-dd'),
            value: Math.round(value * 10) / 10,
            label: format(weekEnd, 'MMM d'),
          });
        }
        break;
      }
      default: {
        startDate = subMonths(now, 1);
        previousStartDate = subMonths(now, 2);
        break;
      }
    }

    // Get current and previous period values
    let current = 0;
    let previous = 0;

    if (metric === 'students') {
      const { count: currentCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('status', 'active')
        .lte('created_at', format(now, "yyyy-MM-dd'T'23:59:59"));
      current = currentCount || 0;

      const { count: previousCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('status', 'active')
        .lte('created_at', format(previousStartDate, "yyyy-MM-dd'T'23:59:59"));
      previous = previousCount || 0;
    } else if (metric === 'staff') {
      const { count: currentCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .in('role', ['teacher', 'librarian', 'housekeeping', 'accountant', 'admin', 'vice_head'])
        .eq('status', 'active')
        .lte('created_at', format(now, "yyyy-MM-dd'T'23:59:59"));
      current = currentCount || 0;

      const { count: previousCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .in('role', ['teacher', 'librarian', 'housekeeping', 'accountant', 'admin', 'vice_head'])
        .eq('status', 'active')
        .lte('created_at', format(previousStartDate, "yyyy-MM-dd'T'23:59:59"));
      previous = previousCount || 0;
    } else if (metric === 'attendance') {
      // Calculate average attendance for current period
      const { data: currentData } = await supabase
        .from('attendance')
        .select('status')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(now, 'yyyy-MM-dd'));
      const currentTotal = currentData?.length || 0;
      const currentPresent = currentData?.filter(a => a.status === 'present').length || 0;
      current = currentTotal > 0 ? (currentPresent / currentTotal) * 100 : 0;

      // Calculate average attendance for previous period
      const { data: previousData } = await supabase
        .from('attendance')
        .select('status')
        .gte('date', format(previousStartDate, 'yyyy-MM-dd'))
        .lt('date', format(startDate, 'yyyy-MM-dd'));
      const previousTotal = previousData?.length || 0;
      const previousPresent = previousData?.filter(a => a.status === 'present').length || 0;
      previous = previousTotal > 0 ? (previousPresent / previousTotal) * 100 : 0;
    } else if (metric === 'fees') {
      // TODO: Implement fees calculation when fees/payments table is available
      current = 0;
      previous = 0;
    }

    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : 0;

    return {
      current: Math.round(current * 10) / 10,
      previous: Math.round(previous * 10) / 10,
      change: Math.round(change * 10) / 10,
      changePercent: Math.round(changePercent * 10) / 10,
      period,
      data: dataPoints,
    };
  } catch (error) {
    console.error('Error fetching growth data:', error);
    throw error;
  }
}

// Get staff breakdown by role
export async function getStaffBreakdown(period?: PeriodType): Promise<StaffBreakdown> {
  try {
    const { data: staffData } = await supabase
      .from('users')
      .select('role')
      .in('role', ['teacher', 'librarian', 'housekeeping', 'accountant'])
      .eq('status', 'active');

    const breakdown: StaffBreakdown = {
      teachers: 0,
      librarians: 0,
      housekeeping: 0,
      accountants: 0,
      total: 0,
    };

    if (staffData) {
      staffData.forEach((user) => {
        if (user.role === 'teacher') breakdown.teachers++;
        else if (user.role === 'librarian') breakdown.librarians++;
        else if (user.role === 'housekeeping') breakdown.housekeeping++;
        else if (user.role === 'accountant') breakdown.accountants++;
      });
      breakdown.total = breakdown.teachers + breakdown.librarians + breakdown.housekeeping + breakdown.accountants;
    }

    return breakdown;
  } catch (error) {
    console.error('Error fetching staff breakdown:', error);
    throw error;
  }
}

// Get staff growth data by role
export async function getStaffGrowthByRole(role: 'teacher' | 'librarian' | 'housekeeping' | 'accountant', period: PeriodType = 'month'): Promise<GrowthStats> {
  try {
    const now = new Date();
    const startDate = period === 'week' ? subWeeks(now, 1) : subMonths(now, 1);
    const previousStartDate = period === 'week' ? subWeeks(now, 2) : subMonths(now, 2);

    // Get current count
    const { count: currentCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', role)
      .eq('status', 'active')
      .lte('created_at', format(now, "yyyy-MM-dd'T'23:59:59"));

    // Get previous period count
    const { count: previousCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', role)
      .eq('status', 'active')
      .lte('created_at', format(previousStartDate, "yyyy-MM-dd'T'23:59:59"));

    const current = currentCount || 0;
    const previous = previousCount || 0;
    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : 0;

    // Get data points
    const dataPoints: GrowthDataPoint[] = [];
    const intervals = period === 'week' 
      ? eachDayOfInterval({ start: startDate, end: now })
      : eachWeekOfInterval({ start: startDate, end: now });

    for (const interval of intervals) {
      const endDate = interval > now ? now : interval;
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', role)
        .eq('status', 'active')
        .lte('created_at', format(endDate, "yyyy-MM-dd'T'23:59:59"));
      
      dataPoints.push({
        date: format(endDate, 'yyyy-MM-dd'),
        value: count || 0,
        label: format(endDate, period === 'week' ? 'MMM d' : 'MMM d'),
      });
    }

    return {
      current,
      previous,
      change,
      changePercent: Math.round(changePercent * 10) / 10,
      period,
      data: dataPoints,
    };
  } catch (error) {
    console.error('Error fetching staff growth by role:', error);
    throw error;
  }
}

