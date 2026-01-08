import { api } from './api';

// Helper to create notifications for admins when activities occur
const createNotificationForAdmins = async (title, message, type = 'info') => {
  try {
    // Get all admin users
    const usersResponse = await api.getUsers({ role: 'admin' });
    if (usersResponse.error) return;
    
    const admins = usersResponse.data?.filter((u) => ['admin', 'vice_head'].includes(u.role)) || [];

    if (admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user_id: admin.id,
        title,
        message,
        type,
        read: false,
      }));

      // Create notifications in parallel
      await Promise.all(
        notifications.map(notification => api.createNotification(notification))
      );
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
    // Don't throw - notifications are non-critical
  }
};

const getTimeAgo = (createdAt) => {
  if (!createdAt) {
    return 'Just now';
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

const getColorClass = (iconName) => {
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

export const createActivity = async (params) => {
  try {
    const now = new Date();
    const response = await api.createActivity({
      icon_name: params.iconName,
      title: params.title,
      description: params.description,
      time_ago: params.timeAgo || getTimeAgo(now), // Will be "Just now" for new activities
      color_class: params.colorClass || getColorClass(params.iconName),
    });

    if (response.error) {
      console.error('Error creating activity:', response.error);
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Failed to create activity:', error);
    // Don't throw - activities are non-critical
  }
};

// Helper functions for specific activity types
export const createUserAddedActivity = async (userName, department) => {
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

// Bulk create activities for multiple users
export const createBulkUserAddedActivities = async (users) => {
  try {
    if (users.length === 0) return;

    const now = new Date();
    const activities = users.map(user => {
      const description = user.department 
        ? `${user.name} was added to ${user.department}`
        : `${user.name} was added to the system`;
      
      return {
        icon_name: 'User',
        title: 'New user enrolled',
        description,
        time_ago: 'Just now',
        color_class: 'bg-primary/10 text-primary',
      };
    });

    // Create all activities in a single API call
    const response = await api.createActivities(activities);
    if (response.error) {
      console.error('Error creating bulk activities:', response.error);
    }

    // Create a single combined notification for admins
    try {
      const userCount = users.length;
      const description = userCount === 1
        ? (users[0].department 
            ? `${users[0].name} was added to ${users[0].department}`
            : `${users[0].name} was added to the system`)
        : `${userCount} new users were added to the system`;
      
      await createNotificationForAdmins(
        userCount === 1 ? 'New User Added' : 'New Users Added',
        description,
        'info'
      );
    } catch (error) {
      // Silently fail - notifications are non-critical
      console.error('Error creating notification:', error);
    }
  } catch (error) {
    console.error('Failed to create bulk activities:', error);
    // Don't throw - activities are non-critical
  }
};

export const createGradeUpdatedActivity = async (teacherName, subject) => {
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

export const createFeePaymentActivity = async (amount, payerName) => {
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

export const createEventScheduledActivity = async (eventName, date) => {
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
