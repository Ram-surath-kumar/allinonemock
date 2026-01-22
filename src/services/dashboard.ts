import { api } from './api';
import { DashboardStats } from '@/types/erp';

// Define explicit types matching backend response
export interface DashboardData {
    stats: DashboardStats;
    recentActivities: any[];
    students: any[];
    departments: any[];
    notifications: any[];
    userInfo: any;
    organizationInfo?: any;
}

export interface GrowthData {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    data: number[];
    // Legacy support
    currentValue?: number;
    previousValue?: number;
    dataPoints?: number[];
}

export interface StaffBreakdown {
    teacher: number;
    librarian: number;
    accountant: number;
    housekeeping: number;
    other: number;
    // Plural support
    teachers: number;
    librarians: number;
    accountants: number;
}

/**
 * Get consolidated dashboard data from backend
 */
export async function getDashboardData(userId?: string, role?: string): Promise<DashboardData | null> {
    const response = await api.getDashboardData(userId, role);

    if (response.error) {
        console.error('getDashboardData - API error:', response.error);
        throw new Error(response.error);
    }

    if (!response.data) {
        console.error('getDashboardData - No data in response');
        throw new Error('No data received from dashboard API');
    }

    // Cast weak types from API to strong internal types
    return response.data as unknown as DashboardData;
}

/**
 * Get dashboard stats
 */
export async function getDashboardStats(userId?: string, role?: string): Promise<DashboardStats> {
    try {
        const dashboardData = await getDashboardData(userId, role);

        if (!dashboardData) {
            throw new Error('No dashboard data received');
        }

        // Return the pre-calculated stats from backend
        return dashboardData.stats;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
}

export async function getGrowthData(
    metric: string,
    period: string = 'month'
): Promise<GrowthData> {
    try {
        const response = await api.getGrowthData(metric, period);
        if (response.error) {
            throw new Error(response.error);
        }

        const apiData = response.data || {};

        // Transform to ensure all required fields exist
        return {
            current: apiData.currentValue ?? apiData.current ?? 0,
            previous: apiData.previousValue ?? apiData.previous ?? 0,
            change: apiData.change ?? (apiData.currentValue - (apiData.previousValue || 0)),
            changePercent: apiData.changePercent ?? 0,
            data: apiData.dataPoints || apiData.data || [],
            // Keep legacy fields
            currentValue: apiData.currentValue,
            previousValue: apiData.previousValue,
            dataPoints: apiData.dataPoints
        };
    } catch (error) {
        console.error('Error fetching growth data:', error);
        throw error;
    }
}

export async function getStaffBreakdown(period?: string): Promise<StaffBreakdown> {
    try {
        const response = await api.getStaffBreakdown();
        if (response.error) {
            throw new Error(response.error);
        }
        const data = response.data || {};

        const teacher = data.teacher ?? data.teachers ?? 0;
        const librarian = data.librarian ?? data.librarians ?? 0;
        const accountant = data.accountant ?? data.accountants ?? 0;

        return {
            teacher,
            librarian,
            accountant,
            housekeeping: data.housekeeping ?? 0,
            other: data.other ?? 0,
            teachers: teacher,
            librarians: librarian,
            accountants: accountant,
        };
    } catch (error) {
        console.error('Error fetching staff breakdown:', error);
        throw error;
    }
}

export async function getStaffGrowthByRole(role: string, period: string = 'month'): Promise<GrowthData> {
    try {
        const response = await api.getStaffGrowthByRole(role, period);
        if (response.error) {
            throw new Error(response.error);
        }

        const apiData = response.data || {};

        return {
            current: apiData.currentValue ?? apiData.current ?? 0,
            previous: apiData.previousValue ?? apiData.previous ?? 0,
            change: apiData.change ?? (apiData.currentValue - (apiData.previousValue || 0)),
            changePercent: apiData.changePercent ?? 0,
            data: apiData.dataPoints || apiData.data || [],
            currentValue: apiData.currentValue,
            previousValue: apiData.previousValue,
            dataPoints: apiData.dataPoints
        };
    } catch (error) {
        console.error('Error fetching staff growth by role:', error);
        throw error;
    }
}

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
