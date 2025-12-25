import { useState } from 'react';
import { UserPlus, FileText, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { createEventScheduledActivity } from '@/services/activities';
import { toast } from 'sonner';
import { SendNoticeDialog } from '@/components/notices/SendNoticeDialog';

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
  const [sendNoticeDialogOpen, setSendNoticeDialogOpen] = useState(false);

  const filteredActions = quickActions.filter(
    action => !action.permission || hasPermission(action.permission)
  );

  const handleScheduleEvent = async () => {
    // For demo purposes, create a sample event
    // In a real app, this would open a dialog to schedule an event
    const eventName = 'School Meeting';
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 7); // 7 days from now
    const formattedDate = eventDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric' 
    });
    
    await createEventScheduledActivity(eventName, formattedDate);
    toast.success('Event scheduled successfully');
  };

  const handleGenerateReport = () => {
    toast.info('Report generation feature coming soon');
  };

  const handleSendNotice = () => {
    setSendNoticeDialogOpen(true);
  };

  return (
    <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-4 sm:p-6 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="h-1.5 w-8 sm:w-10 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
        <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">Quick Actions</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {filteredActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="outline"
              className="group h-auto flex-col items-start gap-2 sm:gap-3 p-4 sm:p-5 text-left hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/5 hover:border-primary/50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 animate-fade-in-up bg-background/80 backdrop-blur-sm border-2"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={
                action.label === 'Add User' 
                  ? onAddUser 
                  : action.label === 'Schedule Event'
                  ? handleScheduleEvent
                  : action.label === 'Generate Report'
                  ? handleGenerateReport
                  : action.label === 'Send Notice'
                  ? handleSendNotice
                  : action.onClick
              }
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-md shadow-primary/10 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 w-full">
                <p className="font-semibold text-sm text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-1 break-words leading-relaxed">{action.description}</p>
              </div>
            </Button>
          );
        })}
      </div>

      <SendNoticeDialog
        open={sendNoticeDialogOpen}
        onOpenChange={setSendNoticeDialogOpen}
      />
    </div>
  );
}
