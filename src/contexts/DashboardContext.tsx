import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { getDashboardData, DashboardData } from "@/services/dashboard";

interface DashboardContextType {
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  refreshDashboard: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshDashboard = async () => {
    if (!currentUser) {
      setDashboardData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardData(currentUser.id, currentUser.role);
      console.log("DashboardContext - Dashboard data received:", {
        hasData: !!data,
        hasStats: !!(data && data.stats),
        stats: data?.stats,
        totalStudents: data?.stats?.totalStudents,
        totalStaff: data?.stats?.totalStaff,
        attendanceRate: data?.stats?.attendanceRate,
        userId: currentUser.id,
        role: currentUser.role,
        fullData: data,
      });
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      console.error("Error loading dashboard data:", err);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  // Only fetch when user is available
  useEffect(() => {
    if (currentUser) {
      refreshDashboard();
    }
  }, [currentUser?.id]);

  return (
    <DashboardContext.Provider value={{ dashboardData, loading, error, refreshDashboard }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
