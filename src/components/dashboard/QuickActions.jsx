import { useState } from "react";
import {
  UserPlus,
  FileText,
  Calendar,
  MessageSquare,
  Sparkles,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/lib/i18n";
import { SendNoticeDialog } from "@/components/notices/SendNoticeDialog";
import { ScheduleEventDialog } from "@/components/dashboard/ScheduleEventDialog";
import { AssignTaskDialog } from "@/components/dashboard/AssignTaskDialog";
import { cn } from "@/lib/utils";
import { callGeminiAnalytics } from "@/services/gemini";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RippleLoader } from "@/components/ui/RippleLoader";

export function QuickActions({ onAddUser, onAssignTask: _onAssignTask, onNavigate: _onNavigate }) {
  const { hasPermission } = useAuth();
  const { t } = useI18n();

  const quickActions = [
    {
      icon: UserPlus,
      label: t("dashboard.addUser"),
      permission: "manage_staff",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: Calendar,
      label: t("dashboard.scheduleEvent"),
      color: "text-green-600 dark:text-green-400",
    },
    {
      icon: FileText,
      label: t("dashboard.assignTask"),
      permission: "manage_staff",
      color: "text-red-600 dark:text-red-400",
    },
    {
      icon: MessageSquare,
      label: t("dashboard.sendNotice"),
      permission: "manage_staff",
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  const aiActions = [
    {
      icon: Sparkles,
      label: t("dashboard.smartReport"),
      color: "text-pink-600 dark:text-pink-400",
    },
    {
      icon: TrendingUp,
      label: t("dashboard.predictAttendance"),
      color: "text-indigo-600 dark:text-indigo-400",
    },
    {
      icon: DollarSign,
      label: t("dashboard.forecastFinance"),
      color: "text-cyan-600 dark:text-cyan-400",
    },
  ];
  const [sendNoticeDialogOpen, setSendNoticeDialogOpen] = useState(false);
  const [scheduleEventDialogOpen, setScheduleEventDialogOpen] = useState(false);
  const [assignTaskDialogOpen, setAssignTaskDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiActionType, setAiActionType] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");

  const filteredActions = quickActions.filter(
    (action) => !action.permission || hasPermission(action.permission)
  );

  const handleScheduleEvent = () => {
    setScheduleEventDialogOpen(true);
  };

  const handleSendNotice = () => {
    setSendNoticeDialogOpen(true);
  };

  const handleAIAction = async (actionType) => {
    setAiActionType(actionType);
    setAiDialogOpen(true);
    setAiLoading(true);
    setAiResult("");

    try {
      const generateHistorical = (current, count = 6) => {
        const data = [];
        for (let i = count - 1; i >= 0; i--) {
          data.push(Math.max(0, current + (Math.random() - 0.5) * (current * 0.1)));
        }
        return data;
      };

      let query = "";
      let data = {};

      const smartReportLabel = t("dashboard.smartReport");
      const predictAttendanceLabel = t("dashboard.predictAttendance");
      const forecastFinanceLabel = t("dashboard.forecastFinance");

      switch (actionType) {
        case smartReportLabel:
          query = t("dashboard.smartReportQuery");
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
        case predictAttendanceLabel:
          query = t("dashboard.predictAttendanceQuery");
          data = {
            attendance: {
              current: 94.2,
              historical: generateHistorical(94.2, 6),
            },
          };
          break;
        case forecastFinanceLabel:
          query = t("dashboard.forecastFinanceQuery");
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
    } catch (error) {
      console.error("Error calling AI:", error);
      setAiResult(`Error: ${error.message || "Failed to generate insights"}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAction = (action) => {
    if (action.label === t("dashboard.addUser")) {
      onAddUser?.();
    } else if (action.label === t("dashboard.scheduleEvent")) {
      handleScheduleEvent();
    } else if (action.label === t("dashboard.sendNotice")) {
      handleSendNotice();
    } else if (action.label === t("dashboard.assignTask")) {
      setAssignTaskDialogOpen(true);
    } else {
      action.onClick?.();
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick Actions */}
      <div
        className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl p-3 shadow-depth-2 hover:shadow-depth-3 transition-all duration-300 glass-modern"
        role="region"
        aria-label="Quick Actions"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="h-0.5 w-6 bg-gradient-to-r from-primary to-primary/50 rounded-full"></div>
          <h3 className="text-sm font-semibold text-foreground">{t("dashboard.quickActions")}</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {filteredActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => handleAction(action)}
                className={cn(
                  "group flex flex-col items-center justify-center gap-2 p-3 rounded-sm",
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
      <div
        className="rounded-2xl border border-border/30 bg-gradient-to-br from-card/80 via-card/70 to-primary/5 backdrop-blur-xl p-4 shadow-depth-2 hover:shadow-depth-3 transition-all duration-300 glass-modern"
        role="region"
        aria-label="AI Actions"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="h-0.5 w-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"></div>
          <Sparkles className="h-3.5 w-3.5 text-pink-500" />
          <h3 className="text-sm font-semibold text-foreground">{t("dashboard.aiActions")}</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {aiActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => handleAIAction(action.label)}
                className={cn(
                  "group flex flex-col items-center justify-center gap-2 p-3 rounded-sm",
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
              {t("dashboard.aiPoweredInsights")}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {/* Removed nested import */}

            {aiLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <RippleLoader className="min-h-[150px]" />
                <span className="mt-4 text-sm text-muted-foreground">
                  {t("dashboard.generatingInsights")}
                </span>
              </div>
            ) : aiResult ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-sm text-foreground bg-muted/30 rounded-lg p-4 border border-border/30">
                  {aiResult}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                {t("dashboard.noResultsAvailable")}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SendNoticeDialog open={sendNoticeDialogOpen} onOpenChange={setSendNoticeDialogOpen} />
      <ScheduleEventDialog open={scheduleEventDialogOpen} onOpenChange={setScheduleEventDialogOpen} />
      <AssignTaskDialog open={assignTaskDialogOpen} onOpenChange={setAssignTaskDialogOpen} />
    </div>
  );
}
