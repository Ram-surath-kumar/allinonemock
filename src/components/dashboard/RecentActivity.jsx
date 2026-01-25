import { useState, useEffect } from "react";
import { User, BookOpen, CreditCard, Calendar } from "lucide-react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { RippleLoader } from "@/components/ui/RippleLoader";
import { useDashboard } from "@/contexts/DashboardContext";

const iconMap = {
  User,
  BookOpen,
  CreditCard,
  Calendar,
};

export function RecentActivity() {
  const { dashboardData, loading: dashboardLoading } = useDashboard();
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const isDashboardActive = location.pathname === "/" || location.pathname.endsWith("/dashboard");

  useEffect(() => {
    if (!isDashboardActive) {
      setIsLoading(false);
      return;
    }

    // Use consolidated dashboard data instead of separate API call
    if (dashboardData?.recentActivities) {
      const getTimeAgo = (createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) {
          const minutes = Math.floor(diffInSeconds / 60);
          return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
        }
        if (diffInSeconds < 86400) {
          const hours = Math.floor(diffInSeconds / 3600);
          return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
        }
        const days = Math.floor(diffInSeconds / 86400);
        return days === 1 ? "1 day ago" : `${days} days ago`;
      };

      const mappedActivities = (dashboardData.recentActivities || []).map((row) => ({
        id: row.id || String(Math.random()),
        icon: iconMap[row.icon_name] || User,
        title: row.title || row.action || "Activity",
        description: row.description || row.details || "",
        time: getTimeAgo(row.created_at || new Date().toISOString()),
        color: row.color_class || "bg-primary/20",
      }));
      setActivities(mappedActivities);
      setIsLoading(false);
    } else if (!dashboardLoading) {
      setIsLoading(false);
    }
  }, [dashboardData, dashboardLoading, isDashboardActive]);

  return (
    <div
      className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl p-3.5 shadow-depth-2 hover:shadow-depth-3 transition-all duration-300 glass-modern"
      role="region"
      aria-label="Recent Activity"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-0.5 w-6 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
        <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
      </div>

      {isLoading ? (
        <div className="h-48" role="status" aria-label="Loading activities">
          <RippleLoader />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-sm text-muted-foreground animate-fade-in text-center py-8">
          No recent activities
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line - centered on icon */}
          <div className="absolute left-[24px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 via-primary/20 to-transparent" />

          <div className="space-y-3">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div
                  key={activity.id}
                  className={cn(
                    "relative flex gap-4 animate-fade-in-up group",
                    "hover:bg-muted/30 p-2.5 rounded-sm transition-all duration-200",
                    "hover:scale-[1.01] hover:-translate-y-0.5"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Timeline dot - centered */}
                  <div className="relative z-10 flex-shrink-0 w-12 flex items-center justify-center">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-sm",
                        "border-2 border-background shadow-md",
                        "transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg",
                        activity.color || "bg-gradient-to-br from-primary/20 to-primary/10"
                      )}
                    >
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    {/* Glow effect */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-sm opacity-0 group-hover:opacity-100",
                        "transition-opacity duration-200 blur-xl",
                        "bg-primary/30"
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {activity.description}
                      </p>
                    </div>

                    {/* Time label - right aligned */}
                    <div className="flex-shrink-0">
                      <p className="text-xs text-muted-foreground whitespace-nowrap font-medium">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
