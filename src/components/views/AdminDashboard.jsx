import { useState, useEffect } from 'react';
import { Users, GraduationCap, DollarSign, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AnalyticsSection } from '@/components/dashboard/AnalyticsSection';
import { GovernanceSection } from '@/components/dashboard/GovernanceSection';
import { GrowthChartModal } from '@/components/dashboard/GrowthChartModal';
import { StaffBreakdownModal } from '@/components/dashboard/StaffBreakdownModal';
import { getDashboardStats, getGrowthData, getConsolidatedGrowthData } from '@/services/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/contexts/DashboardContext';

export function AdminDashboard({ onAddUser }) {
  const { currentUser } = useAuth();
  const { dashboardData, loading: dashboardLoading, refreshDashboard } = useDashboard();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [changeTexts, setChangeTexts] = useState({});
  const [sparklineData, setSparklineData] = useState({});
  const [growthModalOpen, setGrowthModalOpen] = useState(false);
  const [growthMetric, setGrowthMetric] = useState('students');
  const [staffModalOpen, setStaffModalOpen] = useState(false);

  // Extract stats from consolidated dashboard data
  useEffect(() => {
    if (dashboardData) {
      try {
        // Extract stats from consolidated response
        const dashboardStats = dashboardData.stats || {};
        const students = dashboardData.students || [];

        // Debug: Log the raw data
        console.log('AdminDashboard - dashboardData:', dashboardData);
        console.log('AdminDashboard - dashboardStats:', dashboardStats);
        console.log('AdminDashboard - students array length:', students.length);

        // Ensure we get the correct values from stats object
        // Use stats.totalStudents if available, otherwise fall back to students array length
        const totalStudents = (typeof dashboardStats.totalStudents === 'number' && dashboardStats.totalStudents !== null)
          ? dashboardStats.totalStudents
          : (Array.isArray(students) ? students.length : 0);

        const totalStaff = (typeof dashboardStats.totalStaff === 'number' && dashboardStats.totalStaff !== null)
          ? dashboardStats.totalStaff
          : 0;

        const attendanceRate = (typeof dashboardStats.attendanceRate === 'number' && dashboardStats.attendanceRate !== null)
          ? dashboardStats.attendanceRate
          : 0;

        const feeCollectionPercentage = (typeof dashboardStats.feeCollectionPercentage === 'number' && dashboardStats.feeCollectionPercentage !== null)
          ? dashboardStats.feeCollectionPercentage
          : 0;

        const feeCollection = (typeof dashboardStats.feeCollection === 'number' && dashboardStats.feeCollection !== null)
          ? dashboardStats.feeCollection
          : 0;

        console.log('AdminDashboard - Extracted Stats:', {
          totalStudents,
          totalStaff,
          attendanceRate,
          feeCollection,
          feeCollectionPercentage,
          feeCollectionPercentage,
        });

        // Governance Data
        const placements = dashboardStats.placements || null;
        const compliance = dashboardStats.compliance || null;
        const pendingApprovals = dashboardStats.pendingApprovals || 0;
        const systemVersion = dashboardStats.systemVersion || 'v1.0.0';

        setStats({
          totalStudents,
          totalStaff,
          attendanceRate,
          feeCollection,
          feeCollection,
          feeCollectionPercentage,
          placements,
          compliance,
          pendingApprovals,
          systemVersion,
        });
        setIsLoading(false);
      } catch (error) {
        console.error('Error processing dashboard data:', error);
        console.error('Dashboard data:', dashboardData);
        setIsLoading(false);
      }
    } else {
      // If no dashboard data and not loading, set loading to false
      if (!dashboardLoading) {
        setIsLoading(false);
      }
    }
  }, [dashboardData, dashboardLoading]);

  useEffect(() => {
    if (stats) {
      fetchChangeTexts();
      fetchSparklineData();
    }
  }, [stats]);

  const fetchChangeTexts = async () => {
    try {
      const [studentsGrowth, staffGrowth, attendanceGrowth] = await Promise.all([
        getGrowthData('students', 'month').catch(() => null),
        getGrowthData('staff', 'month').catch(() => null),
        getGrowthData('attendance', 'month').catch(() => null),
      ]);

      setChangeTexts({
        students: studentsGrowth
          ? `${studentsGrowth.change >= 0 ? '+' : ''}${studentsGrowth.changePercent.toFixed(1)}% from last month`
          : undefined,
        staff: staffGrowth
          ? `${staffGrowth.change >= 0 ? '+' : ''}${staffGrowth.changePercent.toFixed(1)}% from last month`
          : undefined,
        attendance: attendanceGrowth
          ? `${attendanceGrowth.change >= 0 ? '+' : ''}${attendanceGrowth.changePercent.toFixed(1)}% from last month`
          : undefined,
        fees: stats?.feeCollectionPercentage
          ? `${stats.feeCollectionPercentage.toFixed(0)}% collected`
          : undefined,
      });
    } catch (error) {
      console.error('Error fetching change texts:', error);
    }
  };

  const fetchSparklineData = async () => {
    try {
      const [studentsData, staffData, attendanceData] = await Promise.all([
        getGrowthData('students', 'week').catch(() => null),
        getGrowthData('staff', 'week').catch(() => null),
        getGrowthData('attendance', 'week').catch(() => null),
      ]);

      setSparklineData({
        students: studentsData?.data.map(d => d.value) || [],
        staff: staffData?.data.map(d => d.value) || [],
        attendance: attendanceData?.data.map(d => d.value) || [],
      });
    } catch (error) {
      console.error('Error fetching sparkline data:', error);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercent = (num) => {
    return `${num.toFixed(1)}%`;
  };

  const handleCardClick = (metric) => {
    if (metric === 'staff') {
      setStaffModalOpen(true);
    } else {
      setGrowthMetric(metric);
      setGrowthModalOpen(true);
    }
  };

  return (
    <div className="space-y-3 animate-fade-in" role="main" aria-label="Admin Dashboard">
      {/* Hero Analytics Strip - Stats Grid */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={isLoading ? '...' : formatNumber(stats?.totalStudents || 0)}
          change={changeTexts.students}
          changeType={changeTexts.students?.startsWith('+') ? 'positive' : changeTexts.students?.startsWith('-') ? 'negative' : 'neutral'}
          icon={GraduationCap}
          gradient="from-blue-500/20 via-purple-500/20 to-pink-500/20"
          sparklineData={sparklineData.students}
          onClick={() => handleCardClick('students')}
        />
        <StatsCard
          title="Staff Members"
          value={isLoading ? '...' : formatNumber(stats?.totalStaff || 0)}
          change={changeTexts.staff}
          changeType={changeTexts.staff?.startsWith('+') ? 'positive' : changeTexts.staff?.startsWith('-') ? 'negative' : 'neutral'}
          icon={Users}
          gradient="from-green-500/20 via-emerald-500/20 to-teal-500/20"
          sparklineData={sparklineData.staff}
          onClick={() => handleCardClick('staff')}
        />
        <StatsCard
          title="Fee Collection"
          value={isLoading ? '...' : formatCurrency(stats?.feeCollection || 0)}
          change={changeTexts.fees}
          changeType="neutral"
          icon={DollarSign}
          gradient="from-yellow-500/20 via-orange-500/20 to-red-500/20"
          sparklineData={[]}
          showChart={false}
          onClick={() => handleCardClick('fees')}
        />
        <StatsCard
          title="Attendance Rate"
          value={isLoading ? '...' : formatPercent(stats?.attendanceRate || 0)}
          change={changeTexts.attendance}
          changeType={changeTexts.attendance?.startsWith('+') ? 'positive' : changeTexts.attendance?.startsWith('-') ? 'negative' : 'neutral'}
          icon={TrendingUp}
          gradient="from-purple-500/20 via-pink-500/20 to-rose-500/20"
          sparklineData={sparklineData.attendance}
          onClick={() => handleCardClick('attendance')}
        />
      </div>

      {/* Governance Section */}
      <GovernanceSection stats={stats} />

      {/* Quick Actions & AI Actions - Compact */}
      <QuickActions onAddUser={onAddUser} />

      {/* Analytics Section */}
      <AnalyticsSection />

      {/* Recent Activity - Timeline */}
      <RecentActivity />

      {/* Growth Chart Modals */}
      <GrowthChartModal
        open={growthModalOpen}
        onOpenChange={setGrowthModalOpen}
        title={
          growthMetric === 'students' ? 'Total Students' :
            growthMetric === 'attendance' ? 'Attendance Rate' :
              growthMetric === 'fees' ? 'Fee Collection' :
                'Growth'
        }
        metric={growthMetric}
        currentValue={stats ? (
          growthMetric === 'students' ? stats.totalStudents :
            growthMetric === 'attendance' ? stats.attendanceRate :
              growthMetric === 'fees' ? stats.feeCollection :
                0
        ) : 0}
        formatValue={
          growthMetric === 'fees' ? formatCurrency :
            growthMetric === 'attendance' ? formatPercent :
              formatNumber
        }
      />

      {/* Staff Breakdown Modal */}
      <StaffBreakdownModal
        open={staffModalOpen}
        onOpenChange={setStaffModalOpen}
      />
    </div>
  );
}
