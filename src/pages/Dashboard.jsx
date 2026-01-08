import { useAuth } from '@/contexts/AuthContext';
import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext';
import { AdminDashboard } from '@/components/views/AdminDashboard';
import { TeacherDashboard } from '@/components/views/TeacherDashboard';
import { StudentDashboard } from '@/components/views/StudentDashboard';
import { ROLE_LABELS } from '@/types/erp';

function DashboardContent({ onAddUser }) {
  const { currentUser } = useAuth();
  const { dashboardData, loading } = useDashboard();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please log in to view the dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  // Render different dashboards based on role
  // Dashboard data is loaded via DashboardProvider when this component mounts
  switch (currentUser.role) {
    case 'admin':
    case 'vice_head':
      return <AdminDashboard onAddUser={onAddUser} />;
    case 'teacher':
    case 'librarian':
    case 'accountant':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    case 'housekeeping':
      return (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold text-foreground">Welcome, {currentUser.name}</h2>
            <p className="mt-2 text-muted-foreground">
              Access your facility management tasks from the sidebar.
            </p>
          </div>
        </div>
      );
    default:
      return <AdminDashboard onAddUser={onAddUser} />;
  }
}

export function Dashboard({ onAddUser }) {
  // Wrap in DashboardProvider to load data only when dashboard is displayed
  return (
    <DashboardProvider>
      <DashboardContent onAddUser={onAddUser} />
    </DashboardProvider>
  );
}
