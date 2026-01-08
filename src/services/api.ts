import { apiCache, getCacheKey } from './cache';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Consolidated API endpoints - use these instead of multiple separate calls
interface DashboardData {
  stats: Record<string, unknown>;
  recentActivities: unknown[];
  students: unknown[];
  departments: unknown[];
  notifications: unknown[];
  userInfo: Record<string, unknown>;
}

interface AttendancePageData {
  students: unknown[];
  departments: unknown[];
  attendanceRecords: unknown[];
  teacherDepartmentIds: string[];
  userInfo: Record<string, unknown>;
}

export interface ApiResponse<T = any> {
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
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const query = queryParams.toString();
    return this.request<any[]>(`/users${query ? `?${query}` : ''}`);
  }

  async getUserById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/users/${id}`);
  }

  async getUsersByDepartments(departmentIds: string[], role?: string, status?: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/users/by-departments', {
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

  async deleteUser(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Organizations
  async getOrganizations(params?: { org_name?: string; id?: string }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const query = queryParams.toString();
    return this.request<any[]>(`/organizations${query ? `?${query}` : ''}`);
  }

  async updateOrganization(id: string, orgData: OrganizationData) {
    return this.request(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orgData),
    });
  }

  // Departments
  async getDepartments(params?: { id?: string; ids?: string[] }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.id) queryParams.append('id', params.id);
    if (params?.ids) {
      params.ids.forEach(id => queryParams.append('ids', id));
    }
    const query = queryParams.toString();
    return this.request<any[]>(`/departments${query ? `?${query}` : ''}`);
  }

  async createDepartment(departmentData: DepartmentData) {
    return this.request('/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    });
  }

  async updateDepartment(id: string, departmentData: { name?: string }) {
    return this.request(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(departmentData),
    });
  }

  async deleteDepartment(id: string) {
    return this.request(`/departments/${id}`, {
      method: 'DELETE',
    });
  }

  // Teacher Departments
  async getTeacherDepartments(teacherId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/teacher-departments/${teacherId}`);
  }

  async updateTeacherDepartments(teacherId: string, departmentIds: string[]): Promise<ApiResponse<any>> {
    return this.request<any>('/teacher-departments', {
      method: 'POST',
      body: JSON.stringify({ teacher_id: teacherId, department_ids: departmentIds }),
    });
  }

  // Attendance
  async getAttendance(params?: {
    date?: string;
    student_id?: string;
    student_ids?: string[];
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.student_id) queryParams.append('student_id', params.student_id);
    if (params?.student_ids) {
      params.student_ids.forEach(id => queryParams.append('student_ids', id));
    }
    const query = queryParams.toString();
    return this.request<any[]>(`/attendance${query ? `?${query}` : ''}`);
  }



  // Notifications
  async getNotifications(params?: { user_id?: string; read?: boolean; limit?: number }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.read !== undefined) queryParams.append('read', String(params.read));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    const query = queryParams.toString();
    return this.request<any[]>(`/notifications${query ? `?${query}` : ''}`);
  }

  async createNotification(notificationData: NotificationData) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(userId: string): Promise<ApiResponse<any>> {
    return this.request<any>('/notifications/read-all', {
      method: 'PUT',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  // Activities
  async getActivities(limit?: number): Promise<ApiResponse<any[]>> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request<any[]>(`/activities${query}`);
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

  // ==================== CONSOLIDATED ENDPOINTS ====================
  // Use these endpoints to reduce API calls from frontend

  /**
   * Get all dashboard data in a single API call
   * Combines: stats, activities, students, departments, notifications, user info
   */
  async getDashboardData(userId?: string, role?: string): Promise<ApiResponse<DashboardData>> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);
    const query = params.toString();
    return this.request<DashboardData>(`/dashboard${query ? `?${query}` : ''}`);
  }

  /**
   * Get all attendance page data in a single API call
   * Combines: students, departments, attendance records, teacher departments, user info
   */
  async getAttendancePageData(
    userId?: string,
    role?: string,
    date?: string
  ): Promise<ApiResponse<AttendancePageData>> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);
    if (date) params.append('date', date);
    const query = params.toString();
    return this.request<AttendancePageData>(`/attendance/page-data${query ? `?${query}` : ''}`);
  }

  /**
   * Mark attendance using consolidated endpoint with validation
   */
  async markAttendance(records: AttendanceRecord[]): Promise<ApiResponse<unknown>> {
    return this.request('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  }

  // Growth Data Endpoints
  async getGrowthData(metric: string, period: string = 'month'): Promise<ApiResponse<any>> {
    return this.request(`/growth?metric=${metric}&period=${period}`);
  }

  async getStaffGrowthByRole(role: string, period: string = 'month'): Promise<ApiResponse<any>> {
    return this.request(`/growth/staff-by-role?role=${role}&period=${period}`);
  }

  async getStaffBreakdown(): Promise<ApiResponse<any>> {
    return this.request('/growth/staff-breakdown');
  }

  /**
   * Get all growth data (students, staff, attendance) for all periods (week, month) in a single call
   * This reduces API calls from 6 to 1
   */
  async getConsolidatedGrowthData(): Promise<ApiResponse<any>> {
    return this.request('/growth/consolidated');
  }

  // Custom Roles Endpoints
  async getCustomRoles(): Promise<ApiResponse<any[]>> {
    return this.request('/roles');
  }

  async getCustomRoleById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/roles/${id}`);
  }

  async createCustomRole(roleData: { name: string; permissions: string[]; created_by?: string }): Promise<ApiResponse<any>> {
    return this.request('/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  async updateCustomRole(id: string, roleData: { name?: string; permissions?: string[] }): Promise<ApiResponse<any>> {
    return this.request(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  }

  async deleteCustomRole(id: string): Promise<ApiResponse<any>> {
    return this.request(`/roles/${id}`, {
      method: 'DELETE',
    });
  }

  // Finance Endpoints
  async getFinanceData(userId?: string, role?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);
    const query = params.toString();
    return this.request(`/finance${query ? `?${query}` : ''}`);
  }
  // Hostel Module
  async getHostelDashboard(): Promise<ApiResponse<any>> {
    return this.request('/hostel/dashboard');
  }

  async createHostel(data: any): Promise<ApiResponse<any>> {
    return this.request('/hostel', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createRoom(data: any): Promise<ApiResponse<any>> {
    return this.request('/hostel/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async applyForHostel(data: any): Promise<ApiResponse<any>> {
    return this.request('/hostel/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async allocateBed(data: any): Promise<ApiResponse<any>> {
    return this.request('/hostel/allocate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Examination Module
  async getExamDashboard(): Promise<ApiResponse<any>> {
    return this.request('/exam/dashboard');
  }

  async getExams(): Promise<ApiResponse<any[]>> {
    return this.request('/exam/list');
  }

  async createExam(data: any): Promise<ApiResponse<any>> {
    return this.request('/exam/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTimetable(examId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/exam/timetable/${examId}`);
  }

  async createTimetableEntry(data: any): Promise<ApiResponse<any>> {
    return this.request('/exam/timetable', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateHallTickets(examId: string): Promise<ApiResponse<any>> {
    return this.request(`/exam/hall-tickets/generate/${examId}`, {
      method: 'POST'
    });
  }

  async getHallTickets(examId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/exam/hall-tickets/${examId}`);
  }

  async submitMarks(data: any): Promise<ApiResponse<any>> {
    return this.request('/exam/marks/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async generateSeatingPlan(data: { exam_id: string; center_id: string; room_capacity: number }): Promise<ApiResponse<any>> {
    return this.request('/exam/seating/generate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getSeatingPlan(examId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/exam/seating/${examId}`);
  }

  // Library Module
  async getLibraryBooks(filters?: Record<string, string>): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const query = queryParams.toString();
    return this.request<any[]>(`/library/books${query ? `?${query}` : ''}`);
  }

  async getLibraryMember(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/library/members/${id}`);
  }

  async issueLibraryBook(data: { member_id: string; copy_id: string }): Promise<ApiResponse<any>> {
    return this.request('/library/issue', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async returnLibraryBook(data: { copy_id: string }): Promise<ApiResponse<any>> {
    return this.request('/library/return', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);

