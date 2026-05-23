import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/lib/i18n";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { AdminDashboard } from "@/components/views/AdminDashboard";
import { TeacherDashboard } from "@/components/views/TeacherDashboard";
import StudentExaminations from "@/pages/student/StudentExaminations";

import { RippleLoader } from "@/components/ui/RippleLoader";

interface DashboardProps {
  onAddUser?: () => void;
  onNavigate?: (path: string) => void;
}

function DashboardContent({ onAddUser, onNavigate }: DashboardProps) {
  const { currentUser } = useAuth();
  const { t } = useI18n();
  const { loading } = useDashboard();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t("dashboard.pleaseLogIn")}</p>
      </div>
    );
  }

  // Fast bypass for students: render AI Mock Test Hub directly without waiting for Loop ERP dashboard stats API
  if (currentUser.role === "student") {
    return <StudentExaminations />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RippleLoader />
      </div>
    );
  }

  // Render different dashboards based on role
  // Dashboard data is loaded via DashboardProvider when this component mounts
  switch (currentUser.role) {
    case "admin":
    case "vice_head":
      return <AdminDashboard onAddUser={onAddUser} onNavigate={onNavigate} />;
    case "teacher":
    case "librarian":
    case "accountant":
      return <TeacherDashboard />;
    case "student":
      return <StudentExaminations />;
    case "housekeeping":
      return (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold text-foreground">
              {t("dashboard.welcome", { name: currentUser.name })}
            </h2>
            <p className="mt-2 text-muted-foreground">{t("dashboard.accessFacilityTasks")}</p>
          </div>
        </div>
      );
    default:
      return <AdminDashboard onAddUser={onAddUser} onNavigate={onNavigate} />;
  }
}

export function Dashboard({ onAddUser, onNavigate }: DashboardProps) {
  // Wrap in DashboardProvider to load data only when dashboard is displayed
  return (
    <DashboardProvider>
      <DashboardContent onAddUser={onAddUser} onNavigate={onNavigate} />
    </DashboardProvider>
  );
}

// Also export as default for compatibility
export default Dashboard;
