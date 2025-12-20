import { User, BookOpen, CreditCard, Calendar } from 'lucide-react';

const activities = [
  {
    id: 1,
    icon: User,
    title: 'New student enrolled',
    description: 'Alex Johnson was added to Grade 10-A',
    time: '2 hours ago',
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 2,
    icon: BookOpen,
    title: 'Grades updated',
    description: 'Ms. Parker submitted midterm grades for Science',
    time: '4 hours ago',
    color: 'bg-success/10 text-success',
  },
  {
    id: 3,
    icon: CreditCard,
    title: 'Fee payment received',
    description: '$1,200 received from Thompson family',
    time: '5 hours ago',
    color: 'bg-warning/10 text-warning',
  },
  {
    id: 4,
    icon: Calendar,
    title: 'Event scheduled',
    description: 'Annual Sports Day set for March 15',
    time: '1 day ago',
    color: 'bg-accent text-accent-foreground',
  },
];

export function RecentActivity() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
      
      <div className="mt-6 space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <div 
              key={activity.id} 
              className="flex gap-4 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${activity.color}`}>
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
    </div>
  );
}
