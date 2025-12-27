import { apiCache, getCacheKey } from './cache';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

interface UserData {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
  department_id?: string;
  org_id?: string;
  status?: string;
  permissions?: string[];
  [key: string]: unknown;
}

interface OrganizationData {
  org_name?: string;
  org_code?: string;
  org_logo?: string;
  [key: string]: unknown;
}

interface DepartmentData {
  name?: string;
  created_by?: string;
  [key: string]: unknown;
}

interface NotificationData {
  user_id?: string;
  title?: string;
  message?: string;
  type?: string;
  [key: string]: unknown;
}

interface ActivityData {
  user_id?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

interface AttendanceRecord {
  student_id: string;
  date: string;
  status: string;
  marked_by?: string | null;
}

class ApiClient {
  private baseUrl: string;
  private pendingRequests: Map<string, Promise<ApiResponse<unknown>>> = new Map();

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useCache: boolean = true
  ): Promise<ApiResponse<T>> {
    // Only cache GET requests
    const isGet = !options.method || options.method === 'GET';
    // Extract query params from endpoint for cache key
    const url = new URL(endpoint, 'http://dummy');
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    const cacheKey = useCache && isGet ? getCacheKey(endpoint.split('?')[0], Object.keys(params).length > 0 ? params : undefined) : null;

    // Check cache first
    if (cacheKey) {
      const cached = apiCache.get(cacheKey);
      if (cached) {
        return { data: cached, error: null };
      }

      // Check if request is already pending
      const pending = this.pendingRequests.get(cacheKey);
      if (pending) {
        return pending as Promise<ApiResponse<T>>;
      }
    }

    // Make the request
    const requestPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Cache successful GET responses
        if (cacheKey && result.data !== null && result.error === null) {
          apiCache.set(cacheKey, result.data);
        }

        return result;
      } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        // Handle network errors more gracefully
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        // Check if it's a network/fetch error
        if (errorMessage.includes('fetch failed') || errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          return {
            data: null,
            error: 'Network error: Backend server may not be running. Please ensure the backend server is running on port 3001.',
          };
        }
        return {
          data: null,
          error: errorMessage,
        };
      } finally {
        // Remove from pending requests
        if (cacheKey) {
          this.pendingRequests.delete(cacheKey);
        }
      }
    })();

    // Store pending request
    if (cacheKey) {
      this.pendingRequests.set(cacheKey, requestPromise);
    }

    return requestPromise;
  }

  // Users
  async getUsers(params?: {
    role?: string;
    status?: string;
    department_id?: string;
    org_id?: string;
    user_id?: string;
    email?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const query = queryParams.toString();
    return this.request(`/users${query ? `?${query}` : ''}`);
  }

  async getUserById(id: string) {
    return this.request(`/users/${id}`);
  }

  async getUsersByDepartments(departmentIds: string[], role?: string, status?: string) {
    return this.request('/users/by-departments', {
      method: 'POST',
      body: JSON.stringify({ department_ids: departmentIds, role, status }),
    });
  }

  async createUser(userData: UserData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: UserData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Organizations
  async getOrganizations(params?: { org_name?: string; id?: string }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const query = queryParams.toString();
    return this.request(`/organizations${query ? `?${query}` : ''}`);
  }

  async updateOrganization(id: string, orgData: OrganizationData) {
    return this.request(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orgData),
    });
  }

  // Departments
  async getDepartments(params?: { id?: string; ids?: string[] }) {
    const queryParams = new URLSearchParams();
    if (params?.id) queryParams.append('id', params.id);
    if (params?.ids) {
      params.ids.forEach(id => queryParams.append('ids', id));
    }
    const query = queryParams.toString();
    return this.request(`/departments${query ? `?${query}` : ''}`);
  }

  async createDepartment(departmentData: DepartmentData) {
    return this.request('/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    });
  }

  // Teacher Departments
  async getTeacherDepartments(teacherId: string) {
    return this.request(`/teacher-departments/${teacherId}`);
  }

  async updateTeacherDepartments(teacherId: string, departmentIds: string[]) {
    return this.request('/teacher-departments', {
      method: 'POST',
      body: JSON.stringify({ teacher_id: teacherId, department_ids: departmentIds }),
    });
  }

  // Attendance
  async getAttendance(params?: {
    date?: string;
    student_id?: string;
    student_ids?: string[];
  }) {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.student_id) queryParams.append('student_id', params.student_id);
    if (params?.student_ids) {
      params.student_ids.forEach(id => queryParams.append('student_ids', id));
    }
    const query = queryParams.toString();
    return this.request(`/attendance${query ? `?${query}` : ''}`);
  }

  async markAttendance(records: AttendanceRecord[]) {
    return this.request('/attendance', {
      method: 'POST',
      body: JSON.stringify(records),
    });
  }

  // Notifications
  async getNotifications(params?: { user_id?: string; read?: boolean; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.read !== undefined) queryParams.append('read', String(params.read));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    const query = queryParams.toString();
    return this.request(`/notifications${query ? `?${query}` : ''}`);
  }

  async createNotification(notificationData: NotificationData) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(userId: string) {
    return this.request('/notifications/read-all', {
      method: 'PUT',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  // Activities
  async getActivities(limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return this.request(`/activities${query}`);
  }

  async createActivity(activityData: ActivityData) {
    return this.request('/activities', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  }

  async createActivities(activitiesData: ActivityData[]) {
    return this.request('/activities', {
      method: 'POST',
      body: JSON.stringify(activitiesData),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
export type { ApiResponse };

