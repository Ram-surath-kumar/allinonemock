import { useState, useEffect, useCallback } from "react";
import { Bell, Check, X, Menu, Sparkles, Moon, Sun, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AISearchBar } from "@/components/ui/AISearchBar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/lib/i18n";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { ROLE_LABELS } from "@/types/erp";

export function Header({ title, subtitle, onMenuClick, onNavigate }) {
  const { currentUser } = useAuth();
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const response = await api.getNotifications({
        user_id: currentUser.id,
        limit: 10,
      });

      if (response.error) throw new Error(response.error);

      if (Array.isArray(response.data)) {
        const mappedNotifications = response.data.map((row) => ({
          id: row.id,
          title: row.title,
          message: row.message,
          type: row.type,
          read: row.read,
          created_at: row.created_at,
        }));
        setNotifications(mappedNotifications);
        setUnreadCount(mappedNotifications.filter((n) => !n.read).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;

    fetchNotifications();

    let refreshTimeout = null;
    const handleRefresh = () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      refreshTimeout = setTimeout(() => {
        fetchNotifications();
      }, 500);
    };

    window.addEventListener("notification-sent", handleRefresh);
    window.addEventListener("notification-read", handleRefresh);

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      window.removeEventListener("notification-sent", handleRefresh);
      window.removeEventListener("notification-read", handleRefresh);
    };
  }, [currentUser?.id, fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      const response = await api.markNotificationAsRead(notificationId);
      if (response.error) throw new Error(response.error);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;

    try {
      const response = await api.markAllNotificationsAsRead(currentUser.id);
      if (response.error) throw new Error(response.error);

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "success":
        return "bg-success/10 text-success border-success/20";
      case "warning":
        return "bg-warning/10 text-warning border-warning/20";
      case "error":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t("header.justNow");
    if (diffInSeconds < 3600)
      return t("header.minutesAgo", { minutes: Math.floor(diffInSeconds / 60) });
    if (diffInSeconds < 86400)
      return t("header.hoursAgo", { hours: Math.floor(diffInSeconds / 3600) });
    return t("header.daysAgo", { days: Math.floor(diffInSeconds / 86400) });
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header
      className="flex h-[76px] items-center justify-between border-b border-border/30 bg-card/70 backdrop-blur-xl px-4 md:px-6 shadow-depth-1 sticky top-0 z-50 glass-modern"
      role="banner"
    >
      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 h-full">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden h-9 w-9 rounded-sm shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        {/* Page Title & Welcome */}
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 h-full">
          <div className="min-w-0 flex-1 h-full flex flex-col justify-center">
            <h1 className="text-base md:text-lg font-semibold text-foreground truncate leading-tight">
              {title}
            </h1>
            {currentUser && (
              <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                {t("header.welcomeBack", { name: currentUser.name })}
              </p>
            )}
            {!currentUser && subtitle && (
              <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* AI-Powered Search Bar */}
        <AISearchBar onNavigate={onNavigate} className="hidden sm:block" />

        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 rounded-sm hover-lift"
            title={t("header.toggleTheme")}
            aria-label={t("header.toggleTheme")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}

        {/* Settings */}
        {onNavigate && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("/settings")}
            className="h-9 w-9 rounded-sm hover-lift"
            title={t("header.settings")}
            aria-label={t("header.settings")}
          >
            <Settings className="h-5 w-5" />
          </Button>
        )}

        {/* Notifications */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-sm">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs bg-destructive text-destructive-foreground border-2 border-background">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 glass-modern">
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
              <h3 className="font-semibold text-sm">{t("header.notifications")}</h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllAsRead}>
                  {t("header.markAllAsRead")}
                </Button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {t("header.loadingNotifications")}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {t("header.noNotifications")}
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "relative p-4 transition-colors hover:bg-muted/50",
                        !notification.read && "bg-muted/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-1 h-2 w-2 rounded-full shrink-0",
                            getNotificationColor(notification.type).split(" ")[0]
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                "text-sm font-medium",
                                !notification.read && "font-semibold"
                              )}
                            >
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {getTimeAgo(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile Chip */}
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 px-2 md:px-3 rounded-full gap-2 hover:bg-muted/50"
              >
                <Avatar className="h-7 w-7 border-2 border-primary/20">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-semibold">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-xs font-semibold text-foreground leading-none">
                    {currentUser.name.split(" ")[0]}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                    {ROLE_LABELS[currentUser.role]}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-modern">
              <div className="px-2 py-1.5">
                <p className="text-sm font-semibold">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {ROLE_LABELS[currentUser.role]}
                </p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
