import { apiCache, getCacheKey } from './cache';
import { supabase } from '@/lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.pendingRequests = new Map();
  }

  async request(
    endpoint,
    options = {},
    useCache = true
  ) {
    // Inject Auth Token
    const { data: { session } } = await supabase.auth.getSession();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    // Only cache GET requests
    const isGet = !options.method || options.method === 'GET';
    // Extract query params from endpoint for cache key
    const url = new URL(endpoint, 'http://dummy');
    const params = {};
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
        return pending;
      }
    }

    // Make the request
    const requestPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers,
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

        // Invalidate cache on successful write operations (POST, PUT, DELETE)
        if (!isGet && response.ok && result.error === null) {
          const parts = endpoint.split('?')[0].split('/');
          const resource = parts[0] || parts[1]; // Handle both 'exam/create' and '/exam/create'
          if (resource) {
            console.log(`[API] Invalidating cache for resource: ${resource}`);
            apiCache.invalidate(resource);
          }
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
  async getUsers(params) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const query = queryParams.toString();
    return this.request(`/users${query ? `?${query}` : ''}`);
  }

  async getUserById(id) {
    return this.request(`/users/${id}`);
  }

  // SIM Profile
  async getStudentProfile(userId) {
    return this.request(`/sim/profiles/${userId}`);
  }

  async updateStudentProfile(userId, profileData) {
    return this.request(`/sim/profiles/${userId}`, {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async sendBulkMessage(data) {
    return this.request('/sim/communications/send-bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUsersByDepartments(departmentIds, role, status) {
    return this.request('/users/by-departments', {
      method: 'POST',
      body: JSON.stringify({ department_ids: departmentIds, role, status }),
    });
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async sendWelcomeEmail({ college_email, loop_email, loopid, user_name }) {
    return this.request('/users/send-welcome-email', {
      method: 'POST',
      body: JSON.stringify({ college_email, loop_email, loopid, user_name }),
    });
  }

  // Organizations
  async getOrganizations(params) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const query = queryParams.toString();
    return this.request(`/organizations${query ? `?${query}` : ''}`);
  }

  async updateOrganization(id, orgData) {
    return this.request(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orgData),
    });
  }

  // Departments
  async getDepartments(params) {
    const queryParams = new URLSearchParams();
    if (params?.id) queryParams.append('id', params.id);
    if (params?.ids) {
      params.ids.forEach(id => queryParams.append('ids', id));
    }
    const query = queryParams.toString();
    return this.request(`/departments${query ? `?${query}` : ''}`);
  }

  async createDepartment(departmentData) {
    return this.request('/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    });
  }

  async updateDepartment(id, departmentData) {
    return this.request(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(departmentData),
    });
  }

  async deleteDepartment(id) {
    return this.request(`/departments/${id}`, {
      method: 'DELETE',
    });
  }

  // Teacher Departments
  async getTeacherDepartments(teacherId) {
    return this.request(`/teacher-departments/${teacherId}`);
  }

  async updateTeacherDepartments(teacherId, departmentIds) {
    return this.request('/teacher-departments', {
      method: 'POST',
      body: JSON.stringify({ teacher_id: teacherId, department_ids: departmentIds }),
    });
  }

  // Attendance
  async getAttendance(params) {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.student_id) queryParams.append('student_id', params.student_id);
    if (params?.student_ids) {
      params.student_ids.forEach(id => queryParams.append('student_ids', id));
    }
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    const query = queryParams.toString();
    return this.request(`/attendance${query ? `?${query}` : ''}`);
  }

  // Notifications
  async getNotifications(params) {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.read !== undefined) queryParams.append('read', String(params.read));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    const query = queryParams.toString();
    return this.request(`/notifications${query ? `?${query}` : ''}`);
  }

  async createNotification(notificationData) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }

  async markNotificationAsRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(userId) {
    return this.request('/notifications/read-all', {
      method: 'PUT',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  // Activities
  async getActivities(limit) {
    const query = limit ? `?limit=${limit}` : '';
    return this.request(`/activities${query}`);
  }

  async createActivity(activityData) {
    return this.request('/activities', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  }

  async createActivities(activitiesData) {
    return this.request('/activities', {
      method: 'POST',
      body: JSON.stringify(activitiesData),
    });
  }

  // Schedules
  async getSchedules(params) {
    const queryParams = new URLSearchParams();
    if (params?.teacher_id) queryParams.append('teacher_id', params.teacher_id);
    if (params?.department_id) queryParams.append('department_id', params.department_id);
    if (params?.day) queryParams.append('day', params.day);
    const query = queryParams.toString();
    return this.request(`/schedules${query ? `?${query}` : ''}`, {}, false); // Disable cache for schedules
  }

  async createSchedule(scheduleData) {
    return this.request('/schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  }

  async updateSchedule(id, scheduleData) {
    return this.request(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData),
    });
  }

  async deleteSchedule(id) {
    return this.request(`/schedules/${id}`, {
      method: 'DELETE',
    });
  }

  // ====== CONSOLIDATED ENDPOINTS ======
  // Use these endpoints to reduce API calls from frontend

  /**
   * Get all dashboard data in a single API call
   * Combines: stats, activities, students, departments, notifications, user info
   */
  async getDashboardData(userId, role) {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);
    const query = params.toString();
    // Disable cache for dashboard to ensure fresh data
    return this.request(`/dashboard${query ? `?${query}` : ''}`, {}, false);
  }

  /**
   * Get all attendance page data in a single API call
   * Combines: students, departments, attendance records, teacher departments, user info
   */
  async getAttendancePageData(
    userId,
    role,
    date
  ) {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);
    if (date) params.append('date', date);
    const query = params.toString();
    return this.request(`/attendance/page-data${query ? `?${query}` : ''}`);
  }

  /**
   * Mark attendance using consolidated endpoint with validation
   */
  async markAttendance(records) {
    return this.request('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  }

  // Growth Data Endpoints
  async getGrowthData(metric, period = 'month') {
    return this.request(`/growth?metric=${metric}&period=${period}`);
  }

  async getStaffGrowthByRole(role, period = 'month') {
    return this.request(`/growth/staff-by-role?role=${role}&period=${period}`);
  }

  async getStaffBreakdown() {
    return this.request('/growth/staff-breakdown');
  }

  /**
   * Get all growth data (students, staff, attendance, fees) for all periods (week, month, quarter, year) in a single call
   * This reduces API calls from 6 to 1
   */
  async getConsolidatedGrowthData() {
    return this.request('/growth/consolidated');
  }

  // Custom Roles Endpoints
  async getCustomRoles() {
    return this.request('/roles');
  }

  async getCustomRoleById(id) {
    return this.request(`/roles/${id}`);
  }

  async createCustomRole(roleData) {
    return this.request('/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  async updateCustomRole(id, roleData) {
    return this.request(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  }

  async deleteCustomRole(id) {
    return this.request(`/roles/${id}`, {
      method: 'DELETE',
    });
  }

  // Finance Endpoints
  async getFinanceData(userId, role) {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);
    const query = params.toString();
    return this.request(`/finance${query ? `?${query}` : ''}`);
  }

  // Hostel Module
  async getHostelDashboard() {
    return this.request('/hostel/dashboard');
  }

  async createHostel(data) {
    return this.request('/hostel', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createRoom(data) {
    return this.request('/hostel/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async applyForHostel(data) {
    return this.request('/hostel/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async allocateBed(data) {
    return this.request('/hostel/allocate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Examination Module
  async getExamDashboard() {
    return this.request('/exam/dashboard');
  }

  async getExams() {
    return this.request('/exam/list');
  }

  async createExam(data) {
    return this.request('/exam/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTimetable(examId) {
    return this.request(`/exam/timetable/${examId}`);
  }

  async createTimetableEntry(data) {
    return this.request('/exam/timetable', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateHallTickets(examId) {
    return this.request(`/exam/hall-tickets/generate/${examId}`, {
      method: 'POST'
    });
  }

  async getHallTickets(examId) {
    return this.request(`/exam/hall-tickets/${examId}`);
  }

  async submitMarks(data) {
    return this.request('/exam/marks/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async generateSeatingPlan(data) {
    return this.request('/exam/seating/generate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getSeatingPlan(examId) {
    return this.request(`/exam/seating/${examId}`);
  }

  // Library Module
  async getLibraryBooks(filters) {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const query = queryParams.toString();
    return this.request(`/library/books${query ? `?${query}` : ''}`);
  }

  async getLibraryMember(id) {
    return this.request(`/library/members/${id}`);
  }

  async issueLibraryBook(data) {
    return this.request('/library/issue', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async returnLibraryBook(data) {
    return this.request('/library/return', {
      method: 'POST',
      body: JSON.stringify(data),
    });

  }
  // --- Tasks ---
  async getTasks(params) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/tasks${query ? `?${query}` : ''}`, {}, false);
  }

  async createTask(data) {
    return this.request('/tasks', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateTask(id, data) {
    return this.request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteTask(id) {
    return this.request(`/tasks/${id}`, { method: 'DELETE' });
  }

  // Events
  async getEvents(params) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/events${query ? `?${query}` : ''}`, {}, false);
  }

  async createEvent(data) {
    return this.request('/events', { method: 'POST', body: JSON.stringify(data) });
  }
}


export const api = new ApiClient(API_BASE_URL);
