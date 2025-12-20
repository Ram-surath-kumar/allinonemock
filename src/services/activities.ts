import { supabase } from '@/lib/supabase';

// Helper to create notifications for admins when activities occur
const createNotificationForAdmins = async (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  try {
    // Get all admin users
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .in('role', ['admin', 'vice_head']);

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        title,
        message,
        type,
        read: false,
      }));

      await supabase
        .from('notifications')
        .insert(notifications);
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
    // Don't throw - notifications are non-critical
  }
};

export interface CreateActivityParams {
  iconName: 'User' | 'BookOpen' | 'CreditCard' | 'Calendar';
  title: string;
  description: string;
  timeAgo?: string;
  colorClass?: string;
}

const getTimeAgo = (createdAt?: Date): string => {
  if (!createdAt) {
    return 'Just now';
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
  
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

const getColorClass = (iconName: string): string => {
  switch (iconName) {
    case 'User':
      return 'bg-primary/10 text-primary';
    case 'BookOpen':
      return 'bg-success/10 text-success';
    case 'CreditCard':
      return 'bg-warning/10 text-warning';
    case 'Calendar':
      return 'bg-accent text-accent-foreground';
    default:
      return 'bg-primary/10 text-primary';
  }
};

export const createActivity = async (params: CreateActivityParams): Promise<void> => {
  try {
    const now = new Date();
    const { error } = await supabase
      .from('activities')
      .insert({
        icon_name: params.iconName,
        title: params.title,
        description: params.description,
        time_ago: params.timeAgo || getTimeAgo(now), // Will be "Just now" for new activities
        color_class: params.colorClass || getColorClass(params.iconName),
      });

    if (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to create activity:', error);
    // Don't throw - activities are non-critical
  }
};

// Helper functions for specific activity types
export const createUserAddedActivity = async (userName: string, department?: string): Promise<void> => {
  const description = department 
    ? `${userName} was added to ${department}`
    : `${userName} was added to the system`;
  
  await createActivity({
    iconName: 'User',
    title: 'New user enrolled',
    description,
  });

  // Create notification for admins (only create once, don't trigger refresh events)
  try {
    await createNotificationForAdmins(
      'New User Added',
      description,
      'info'
    );
  } catch (error) {
    // Silently fail - notifications are non-critical
    console.error('Error creating notification:', error);
  }
};

export const createGradeUpdatedActivity = async (teacherName: string, subject: string): Promise<void> => {
  const description = `${teacherName} submitted grades for ${subject}`;
  
  await createActivity({
    iconName: 'BookOpen',
    title: 'Grades updated',
    description,
  });

  // Create notification for admins
  await createNotificationForAdmins(
    'Grades Updated',
    description,
    'success'
  );
};

export const createFeePaymentActivity = async (amount: string, payerName: string): Promise<void> => {
  const description = `$${amount} received from ${payerName}`;
  
  await createActivity({
    iconName: 'CreditCard',
    title: 'Fee payment received',
    description,
  });

  // Create notification for admins
  await createNotificationForAdmins(
    'Fee Payment Received',
    description,
    'success'
  );
};

export const createEventScheduledActivity = async (eventName: string, date: string): Promise<void> => {
  const description = `${eventName} set for ${date}`;
  
  await createActivity({
    iconName: 'Calendar',
    title: 'Event scheduled',
    description,
  });

  // Create notification for admins
  await createNotificationForAdmins(
    'Event Scheduled',
    description,
    'info'
  );
};

