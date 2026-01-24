import { useState, useEffect, useCallback } from "react";
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";

export function NoticeBanner() {
  const { currentUser } = useAuth();
  const [unreadNotice, setUnreadNotice] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [dismissedNoticeIds, setDismissedNoticeIds] = useState(new Set());

  const fetchLatestUnreadNotice = useCallback(async () => {
    if (!currentUser) return;

    try {
      const response = await api.getNotifications({
        user_id: currentUser.id,
        read: false,
        limit: 1,
      });

      if (
        response.error &&
        !response.error.includes("not found") &&
        !response.error.includes("PGRST116")
      ) {
        throw new Error(response.error);
      }

      const data = response.data && response.data.length > 0 ? response.data[0] : null;

      if (data && !dismissedNoticeIds.has(data.id)) {
        setUnreadNotice({
          id: data.id,
          title: data.title,
          message: data.message,
          type: data.type,
          read: data.read,
          created_at: data.created_at,
        });
        setDismissed(false); // Reset dismissed state when new notice arrives
      } else if (!data) {
        setUnreadNotice(null);
      }
    } catch (error) {
      console.error("Error fetching notice:", error);
      setUnreadNotice(null);
    }
  }, [currentUser, dismissedNoticeIds]);

  useEffect(() => {
    if (!currentUser) return;

    fetchLatestUnreadNotice();

    // Poll for new notices every 60 seconds (reduced frequency)
    const interval = setInterval(() => {
      fetchLatestUnreadNotice();
    }, 60000);

    // Listen for custom events to refresh notices
    const handleRefresh = () => {
      fetchLatestUnreadNotice();
    };

    window.addEventListener("notification-sent", handleRefresh);
    window.addEventListener("notification-read", handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("notification-sent", handleRefresh);
      window.removeEventListener("notification-read", handleRefresh);
    };
  }, [currentUser, fetchLatestUnreadNotice]);

  const markAsRead = async () => {
    if (!unreadNotice) return;

    try {
      const response = await api.markNotificationAsRead(unreadNotice.id);
      if (response.error) throw new Error(response.error);

      // Add to dismissed set
      setDismissedNoticeIds((prev) => new Set(prev).add(unreadNotice.id));

      // Trigger refresh event
      window.dispatchEvent(new CustomEvent("notification-read"));

      setDismissed(true);
      // Clear notice after animation
      setTimeout(() => {
        setUnreadNotice(null);
        setDismissed(false);
        // Don't fetch immediately - let polling handle it
      }, 300);
    } catch (error) {
      console.error("Error marking notice:", error);
    }
  };

  const dismiss = () => {
    if (!unreadNotice) return;

    // Add to dismissed set so it won't show again
    setDismissedNoticeIds((prev) => new Set(prev).add(unreadNotice.id));
    setDismissed(true);

    // After animation, clear the notice
    setTimeout(() => {
      setUnreadNotice(null);
      setDismissed(false);
      // Don't fetch again immediately - let the polling handle it
    }, 300);
  };

  if (!unreadNotice || dismissed) return null;

  const getIcon = () => {
    switch (unreadNotice.type) {
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "error":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getVariant = () => {
    switch (unreadNotice.type) {
      case "success":
        return "default";
      case "warning":
        return "default";
      case "error":
        return "destructive";
      default:
        return "default";
    }
  };

  const getAlertClassName = () => {
    switch (unreadNotice.type) {
      case "success":
        return "border-success/50 bg-success/10";
      case "warning":
        return "border-warning/50 bg-warning/10";
      case "error":
        return "border-destructive/50 bg-destructive/10";
      default:
        return "border-primary/50 bg-primary/10";
    }
  };

  return (
    <Alert className={cn("mb-4 sm:mb-6 animate-fade-in-up border-2", getAlertClassName())}>
      <div className="flex items-start gap-2 sm:gap-3">
        <div
          className={cn(
            "mt-0.5 shrink-0",
            unreadNotice.type === "success" && "text-success",
            unreadNotice.type === "warning" && "text-warning",
            unreadNotice.type === "error" && "text-destructive",
            unreadNotice.type === "info" && "text-primary"
          )}
        >
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <AlertTitle className="font-semibold text-sm sm:text-base mb-1">
            {unreadNotice.title}
          </AlertTitle>
          <AlertDescription className="text-xs sm:text-sm text-muted-foreground">
            {unreadNotice.message}
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={markAsRead} className="h-8 px-2 text-xs">
            Mark as Read
          </Button>
          <Button variant="ghost" size="icon" onClick={dismiss} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}
