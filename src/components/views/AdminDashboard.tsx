import { Users, GraduationCap, DollarSign, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';

interface AdminDashboardProps {
  onAddUser: () => void;
}

export function AdminDashboard({ onAddUser }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value="2,847"
          change="+12% from last month"
          changeType="positive"
          icon={GraduationCap}
        />
        <StatsCard
          title="Staff Members"
          value="156"
          change="+3 new this week"
          changeType="positive"
          icon={Users}
        />
        <StatsCard
          title="Fee Collection"
          value="$284,500"
          change="92% collected"
          changeType="neutral"
          icon={DollarSign}
        />
        <StatsCard
          title="Attendance Rate"
          value="94.2%"
          change="+2.1% from last week"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      {/* Activity and Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div>
          <QuickActions onAddUser={onAddUser} />
        </div>
      </div>
    </div>
  );
}
