import { useState } from 'react';
import { 
  UserPlus, 
  FileText, 
  Calendar, 
  MessageSquare, 
  Sparkles, 
  TrendingUp,
  DollarSign,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { createEventScheduledActivity } from '@/services/activities';
import { toast } from 'sonner';
import { SendNoticeDialog } from '@/components/notices/SendNoticeDialog';
import { cn } from '@/lib/utils';
import { callGeminiAnalytics } from '@/services/gemini';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  permission?: string;
  onClick?: () => void;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    icon: UserPlus,
    label: 'Add User',
    permission: 'manage_staff',
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: FileText,
    label: 'Generate Report',
    permission: 'view_students',
    color: 'text-purple-600 dark:text-purple-400',
  },
  {
    icon: Calendar,
    label: 'Schedule Event',
    color: 'text-green-600 dark:text-green-400',
  },
  {
    icon: MessageSquare,
    label: 'Send Notice',
    permission: 'manage_staff',
    color: 'text-orange-600 dark:text-orange-400',
  },
];

const aiActions: QuickAction[] = [
  {
    icon: Sparkles,
    label: 'Smart Report',
    color: 'text-pink-600 dark:text-pink-400',
  },
  {
    icon: TrendingUp,
    label: 'Predict Attendance',
    color: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    icon: DollarSign,
    label: 'Forecast Finance',
    color: 'text-cyan-600 dark:text-cyan-400',
  },
];

interface QuickActionsProps {
  onAddUser?: () => void;
}

export function QuickActions({ onAddUser }: QuickActionsProps) {
  const { hasPermission } = useAuth();
  const [sendNoticeDialogOpen, setSendNoticeDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiActionType, setAiActionType] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string>('');

  const filteredActions = quickActions.filter(
    action => !action.permission || hasPermission(action.permission)
  );

  const handleScheduleEvent = async () => {
    const eventName = 'School Meeting';
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 7);
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

  const handleAIAction = async (actionType: string) => {
    setAiActionType(actionType);
    setAiDialogOpen(true);
    setAiLoading(true);
    setAiResult('');

    try {
      const generateHistorical = (current: number, count: number = 6) => {
        const data = [];
        for (let i = count - 1; i >= 0; i--) {
          data.push(Math.max(0, current + (Math.random() - 0.5) * (current * 0.1)));
        }
        return data;
      };

      let query = '';
      let data: any = {};

      switch (actionType) {
        case 'Smart Report':
          query = 'Provide a comprehensive analytics report with key insights, trends, and recommendations for the school.';
          data = {
            attendance: {
              current: 94.2,
              historical: generateHistorical(94.2, 6),
            },
            finance: {
              current: 284500,
              historical: generateHistorical(284500, 6),
            },
            students: {
              current: 2847,
              historical: generateHistorical(2847, 6),
            },
          };
          break;
        case 'Predict Attendance':
          query = 'Analyze attendance trends and predict future attendance rates. Provide insights on factors affecting attendance.';
          data = {
            attendance: {
              current: 94.2,
              historical: generateHistorical(94.2, 6),
            },
          };
          break;
        case 'Forecast Finance':
          query = 'Analyze financial trends and forecast revenue and expenses for the next period. Provide recommendations.';
          data = {
            finance: {
              current: 284500,
              historical: generateHistorical(284500, 6),
            },
          };
          break;
      }

      const result = await callGeminiAnalytics(query, data);
      setAiResult(result);
    } catch (error: any) {
      console.error('Error calling AI:', error);
      setAiResult(`Error: ${error.message || 'Failed to generate insights'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAction = (action: QuickAction) => {
    if (action.label === 'Add User') {
      onAddUser?.();
    } else if (action.label === 'Schedule Event') {
      handleScheduleEvent();
    } else if (action.label === 'Generate Report') {
      handleGenerateReport();
    } else if (action.label === 'Send Notice') {
      handleSendNotice();
    } else {
      action.onClick?.();
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick Actions */}
      <div className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl p-3 shadow-depth-2 hover:shadow-depth-3 transition-all duration-300 glass-modern" role="region" aria-label="Quick Actions">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-0.5 w-6 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
          <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
      </div>
      
        <div className="grid grid-cols-4 gap-2">
        {filteredActions.map((action, index) => {
          const Icon = action.icon;
          return (
              <button
              key={action.label}
                onClick={() => handleAction(action)}
                className={cn(
                  "group flex flex-col items-center justify-center gap-2 p-3 rounded-xl",
                  "border border-border/30 bg-card/60 backdrop-blur-sm",
                  "hover:border-primary/50 hover:bg-primary/5 hover:shadow-md",
                  "hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]",
                  "transition-all duration-200",
                  "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                )}
                aria-label={action.label}
              >
                <Icon className={cn("h-5 w-5", action.color)} />
                <span className="text-xs font-medium text-foreground text-center leading-tight">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
              </div>

      {/* AI Actions */}
      <div className="rounded-2xl border border-border/30 bg-gradient-to-br from-card/80 via-card/70 to-primary/5 backdrop-blur-xl p-4 shadow-depth-2 hover:shadow-depth-3 transition-all duration-300 glass-modern" role="region" aria-label="AI Actions">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-0.5 w-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"></div>
          <Sparkles className="h-3.5 w-3.5 text-pink-500" />
          <h3 className="text-sm font-semibold text-foreground">AI Actions</h3>
              </div>
        
        <div className="grid grid-cols-3 gap-2">
          {aiActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => handleAIAction(action.label)}
                className={cn(
                  "group flex flex-col items-center justify-center gap-2 p-3 rounded-xl",
                  "border border-border/30 bg-card/60 backdrop-blur-sm",
                  "hover:border-pink-500/50 hover:bg-pink-500/5 hover:shadow-md",
                  "hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]",
                  "transition-all duration-200",
                  "focus-visible:outline-2 focus-visible:outline-pink-500 focus-visible:outline-offset-2"
                )}
                aria-label={action.label}
              >
                <Icon className={cn("h-5 w-5", action.color)} />
                <span className="text-xs font-medium text-foreground text-center leading-tight">
                  {action.label}
                </span>
              </button>
          );
        })}
        </div>
      </div>

      {/* AI Results Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-pink-500" />
              {aiActionType}
            </DialogTitle>
            <DialogDescription className="text-xs">
              AI-powered insights and predictions
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {aiLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-3 text-sm text-muted-foreground">Generating insights...</span>
              </div>
            ) : aiResult ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-sm text-foreground bg-muted/30 rounded-lg p-4 border border-border/30">
                  {aiResult}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                No results available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SendNoticeDialog
        open={sendNoticeDialogOpen}
        onOpenChange={setSendNoticeDialogOpen}
      />
    </div>
  );
}
