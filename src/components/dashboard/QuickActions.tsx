import { UserPlus, FileText, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  permission?: string;
  onClick?: () => void;
}

const quickActions: QuickAction[] = [
  {
    icon: UserPlus,
    label: 'Add User',
    description: 'Create a new staff or student account',
    permission: 'manage_staff',
  },
  {
    icon: FileText,
    label: 'Generate Report',
    description: 'Create attendance or grade reports',
    permission: 'view_students',
  },
  {
    icon: Calendar,
    label: 'Schedule Event',
    description: 'Plan a new school event or meeting',
  },
  {
    icon: MessageSquare,
    label: 'Send Notice',
    description: 'Broadcast announcement to users',
    permission: 'manage_staff',
  },
];

interface QuickActionsProps {
  onAddUser?: () => void;
}

export function QuickActions({ onAddUser }: QuickActionsProps) {
  const { hasPermission } = useAuth();

  const filteredActions = quickActions.filter(
    action => !action.permission || hasPermission(action.permission)
  );

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
      
      <div className="mt-4 grid grid-cols-2 gap-3">
        {filteredActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4 text-left animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={action.label === 'Add User' ? onAddUser : action.onClick}
            >
              <Icon className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
