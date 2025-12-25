import { Users, GraduationCap, DollarSign, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AnalyticsSection } from '@/components/dashboard/AnalyticsSection';

interface AdminDashboardProps {
  onAddUser: () => void;
}

export function AdminDashboard({ onAddUser }: AdminDashboardProps) {
  return (
    <div className="space-y-5 animate-fade-in" role="main" aria-label="Admin Dashboard">
      {/* Hero Analytics Strip - Stats Grid */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value="2,847"
          change="+12% from last month"
          changeType="positive"
          icon={GraduationCap}
          gradient="from-blue-500/20 via-purple-500/20 to-pink-500/20"
          sparklineData={[85, 88, 90, 87, 92, 94, 96]}
        />
        <StatsCard
          title="Staff Members"
          value="156"
          change="+3 new this week"
          changeType="positive"
          icon={Users}
          gradient="from-green-500/20 via-emerald-500/20 to-teal-500/20"
          sparklineData={[150, 152, 153, 154, 155, 156, 156]}
        />
        <StatsCard
          title="Fee Collection"
          value="$284,500"
          change="92% collected"
          changeType="neutral"
          icon={DollarSign}
          gradient="from-yellow-500/20 via-orange-500/20 to-red-500/20"
          sparklineData={[250000, 260000, 270000, 275000, 280000, 282000, 284500]}
          showChart={false}
        />
        <StatsCard
          title="Attendance Rate"
          value="94.2%"
          change="+2.1% from last week"
          changeType="positive"
          icon={TrendingUp}
          gradient="from-purple-500/20 via-pink-500/20 to-rose-500/20"
          sparklineData={[90, 91, 92, 93, 93.5, 94, 94.2]}
        />
      </div>

      {/* Quick Actions & AI Actions - Compact */}
      <QuickActions onAddUser={onAddUser} />

      {/* Analytics Section */}
      <AnalyticsSection />

      {/* Recent Activity - Timeline */}
      <RecentActivity />
    </div>
  );
}
