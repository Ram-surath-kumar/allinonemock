import { useState, useEffect, useCallback } from "react";
import { Bell, Check, X, Menu, Sparkles, Moon, Sun, User, Settings, Search, LogOut } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";

export function Header({ title, subtitle, onMenuClick, onNavigate }) {
  const { currentUser, logout } = useAuth();
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const isMobile = useIsMobile();

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
      className="flex h-[64px] items-center justify-between border-b border-border/30 bg-card/70 backdrop-blur-xl px-4 md:px-6 shadow-depth-1 sticky top-0 z-20 glass-modern"
      role="banner"
    >
      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 h-full">
        {!mobileSearchOpen && onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden h-10 w-10 rounded-xl shrink-0 hover:bg-muted/50"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </Button>
        )}

        {/* Page Title & Welcome */}
        {!mobileSearchOpen && (
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 h-full">
            <div className="min-w-0 flex-1 h-full flex flex-col justify-center">
              <h1 className="text-sm md:text-base font-bold text-foreground truncate leading-tight uppercase tracking-wide">
                {title}
              </h1>
              {currentUser && (
                <p className="hidden xs:block text-[10px] font-medium text-muted-foreground truncate leading-tight mt-0.5 opacity-70">
                  {t("header.welcomeBack", { name: currentUser.name })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Mobile Search Input Overlay */}
        {isMobile && mobileSearchOpen && (
          <div className="flex-1 flex items-center gap-2 animate-in slide-in-from-top-4 duration-200">
            <AISearchBar onNavigate={(path) => {
              onNavigate(path);
              setMobileSearchOpen(false);
            }} className="flex-1" />
            <Button variant="ghost" size="icon" onClick={() => setMobileSearchOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      <div className={cn("flex items-center gap-1 sm:gap-2 md:gap-3", mobileSearchOpen ? "hidden" : "flex")}>
        {/* AI-Powered Search Bar - Desktop */}
        <AISearchBar onNavigate={onNavigate} className="hidden lg:block w-64 xl:w-80" />

        {/* Mobile Search Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileSearchOpen(true)}
          className="lg:hidden h-10 w-10 rounded-xl hover:bg-muted/50"
          aria-label="Toggle search"
        >
          <Search className="h-5 w-5" />
        </Button>

        <div className="h-6 w-[1px] bg-border/40 mx-1 hidden sm:block" />

        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-10 w-10 rounded-xl hover-lift"
            title={t("header.toggleTheme")}
            aria-label={t("header.toggleTheme")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        )}

        {/* Notifications */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute right-2 top-2 h-4 w-4 flex items-center justify-center rounded-full p-0 text-[10px] bg-destructive text-destructive-foreground border-2 border-background">
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
                                "text-sm font-medium text-foreground",
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
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-2 font-medium opacity-60">
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
                className="h-10 px-1 md:px-2 rounded-full gap-2 hover:bg-muted/50 ml-1"
              >
                <Avatar className="h-8 w-8 border-2 border-primary/20 shadow-sm transition-transform hover:scale-105">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-bold uppercase">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                {!isMobile && (
                  <div className="flex flex-col items-start pr-1 max-w-[100px]">
                    <span className="text-[11px] font-bold text-foreground leading-none truncate w-full uppercase tracking-tight">
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground leading-none mt-1 font-medium opacity-70">
                      {ROLE_LABELS[currentUser.role]}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-modern border-0 shadow-depth-3 rounded-2xl">
              <div className="px-3 py-3 border-b border-border/10">
                <p className="text-sm font-bold truncate">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground truncate opacity-70">{currentUser.email}</p>
                <Badge variant="outline" className="mt-2 text-[9px] py-0 font-bold uppercase bg-primary/5 text-primary border-primary/20">
                  {ROLE_LABELS[currentUser.role]}
                </Badge>
              </div>
              <div className="p-1.5">
                <DropdownMenuItem onClick={() => onNavigate("/settings")} className="rounded-xl">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate("/settings")} className="rounded-xl">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Preferences</span>
                </DropdownMenuItem>
                <div className="h-px bg-border/20 my-1" />
                <DropdownMenuItem
                  onClick={logout}
                  className="rounded-xl text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
