import { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Notice {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

export function NoticeBanner() {
  const { currentUser } = useAuth();
  const [unreadNotice, setUnreadNotice] = useState<Notice | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [dismissedNoticeIds, setDismissedNoticeIds] = useState<Set<string>>(new Set());

  const fetchLatestUnreadNotice = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data && !dismissedNoticeIds.has(data.id)) {
        setUnreadNotice({
          id: data.id,
          title: data.title,
          message: data.message,
          type: data.type as 'info' | 'success' | 'warning' | 'error',
          read: data.read,
          created_at: data.created_at,
        });
        setDismissed(false); // Reset dismissed state when new notice arrives
      } else if (!data) {
        setUnreadNotice(null);
      }
    } catch (error) {
      console.error('Error fetching notice:', error);
      setUnreadNotice(null);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    fetchLatestUnreadNotice();
    
    // Poll for new notices every 30 seconds
    const interval = setInterval(() => {
      fetchLatestUnreadNotice();
    }, 30000);

    // Listen for custom events to refresh notices
    const handleRefresh = () => {
      fetchLatestUnreadNotice();
    };

    window.addEventListener('notification-sent', handleRefresh);
    window.addEventListener('notification-read', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-sent', handleRefresh);
      window.removeEventListener('notification-read', handleRefresh);
    };
  }, [currentUser, fetchLatestUnreadNotice]);

  const markAsRead = async () => {
    if (!unreadNotice) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', unreadNotice.id);

      if (error) throw error;

      // Add to dismissed set
      setDismissedNoticeIds(prev => new Set(prev).add(unreadNotice.id));
      
      // Trigger refresh event
      window.dispatchEvent(new CustomEvent('notification-read'));

      setDismissed(true);
      // Clear notice after animation
      setTimeout(() => {
        setUnreadNotice(null);
        setDismissed(false);
        // Don't fetch immediately - let polling handle it
      }, 300);
    } catch (error) {
      console.error('Error marking notice as read:', error);
    }
  };

  const dismiss = () => {
    if (!unreadNotice) return;
    
    // Add to dismissed set so it won't show again
    setDismissedNoticeIds(prev => new Set(prev).add(unreadNotice.id));
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
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getVariant = () => {
    switch (unreadNotice.type) {
      case 'success':
        return 'default';
      case 'warning':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getAlertClassName = () => {
    switch (unreadNotice.type) {
      case 'success':
        return 'border-success/50 bg-success/10';
      case 'warning':
        return 'border-warning/50 bg-warning/10';
      case 'error':
        return 'border-destructive/50 bg-destructive/10';
      default:
        return 'border-primary/50 bg-primary/10';
    }
  };

  return (
    <Alert className={cn('mb-4 sm:mb-6 animate-fade-in-up border-2', getAlertClassName())}>
      <div className="flex items-start gap-2 sm:gap-3">
        <div className={cn(
          'mt-0.5 shrink-0',
          unreadNotice.type === 'success' && 'text-success',
          unreadNotice.type === 'warning' && 'text-warning',
          unreadNotice.type === 'error' && 'text-destructive',
          unreadNotice.type === 'info' && 'text-primary'
        )}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <AlertTitle className="font-semibold text-sm sm:text-base mb-1">
            {unreadNotice.title}
          </AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            {unreadNotice.message}
          </AlertDescription>
        </div>
        <div className="flex items-start gap-1 sm:gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAsRead}
            className="h-7 sm:h-8 text-xs hidden sm:inline-flex"
          >
            Mark as Read
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            onClick={dismiss}
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}

