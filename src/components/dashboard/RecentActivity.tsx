import { useState, useEffect } from 'react';
import { User, BookOpen, CreditCard, Calendar, LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Activity {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  time: string;
  color: string;
}

const iconMap: Record<string, LucideIcon> = {
  User,
  BookOpen,
  CreditCard,
  Calendar,
};

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    // Refresh activities every minute to update time ago
    const interval = setInterval(() => {
      fetchActivities();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        const getTimeAgo = (createdAt: string): string => {
          const now = new Date();
          const created = new Date(createdAt);
          const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);
          
          if (diffInSeconds < 60) return 'Just now';
          if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
          }
          if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
          }
          const days = Math.floor(diffInSeconds / 86400);
          return days === 1 ? '1 day ago' : `${days} days ago`;
        };

        const mappedActivities: Activity[] = data.map((row) => ({
          id: row.id,
          icon: iconMap[row.icon_name] || User,
          title: row.title,
          description: row.description,
          time: getTimeAgo(row.created_at), // Calculate dynamically from created_at
          color: row.color_class,
        }));
        setActivities(mappedActivities);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/95 p-6 shadow-md backdrop-blur-sm">
      <h3 className="text-lg font-bold text-foreground mb-1">Recent Activity</h3>
      
      {loading ? (
        <div className="mt-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="h-10 w-10 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
              <div className="h-3 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="mt-6 text-sm text-muted-foreground animate-fade-in">No recent activities</div>
      ) : (
        <div className="mt-6 space-y-4">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div 
                key={activity.id} 
                className="group flex gap-4 animate-fade-in-up hover:bg-muted/50 p-3 rounded-xl transition-all duration-200 hover:shadow-sm"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md transition-transform duration-200 group-hover:scale-110 ${activity.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
