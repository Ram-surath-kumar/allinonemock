import { apiCache, getCacheKey } from "./cache";

import { supabase } from "@/lib/supabase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

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
    const isGet = !options.method || options.method === "GET";
    // Extract query params from endpoint for cache key
    const url = new URL(endpoint, "http://dummy");
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    const cacheKey =
      useCache && isGet
        ? getCacheKey(endpoint.split("?")[0], Object.keys(params).length > 0 ? params : undefined)
        : null;

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
        // Get the current session to extract the access token
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(options.headers as Record<string, string>),
        };

        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        } else {
          // Check for bypass email in localStorage (Universal Bypass)
          const bypassEmail = localStorage.getItem("bypass_email");
          if (bypassEmail) {
            headers["X-Bypass-Email"] = bypassEmail;
          } else {
            // Try to get session again if missing
            const {
              data: { session: newSession },
            } = await supabase.auth.getSession();
            if (newSession?.access_token) {
              headers["Authorization"] = `Bearer ${newSession.access_token}`;
            }
          }
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers,
          cache: useCache ? 'default' : 'no-store',
        });

        // Read response as text first to check if it's HTML
        const text = await response.text();

        // Check if response is HTML (error page) instead of JSON
        if (text.trim().startsWith("<!") || text.includes("<!doctype")) {
          throw new Error(
            `Backend API not available. The server at ${this.baseUrl} returned HTML instead of JSON. ` +
            `This usually means the backend server is not running or not deployed. ` +
            `Please ensure the backend is running or configure VITE_API_URL environment variable.`
          );
        }

        // Check content type as additional validation
        const contentType = response.headers.get("content-type");
        if (contentType && !contentType.includes("application/json") && !contentType.includes("text/json")) {
          throw new Error(`Unexpected content type: ${contentType}. Expected JSON. Response: ${text.substring(0, 200)}`);
        }

        if (!response.ok) {
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          } catch (parseError) {
            throw new Error(`HTTP error! status: ${response.status}. Response: ${text.substring(0, 200)}`);
          }
        }

        // Parse JSON response
        let result;
        try {
          result = JSON.parse(text);
        } catch (parseError) {
          throw new Error(
            `Failed to parse API response as JSON. The server may be returning an error page. ` +
            `Backend API at ${this.baseUrl} may not be available. Response: ${text.substring(0, 200)}`
          );
        }

        // Cache successful GET responses
        if (cacheKey && result.data !== null && result.error === null) {
          apiCache.set(cacheKey, result.data);
        }

        return result;
      } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        // Handle network errors more gracefully
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        // Check if it's a network/fetch error or HTML response error
        if (
          errorMessage.includes("fetch failed") ||
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("NetworkError") ||
          errorMessage.includes("Backend API not available") ||
          errorMessage.includes("Unexpected content type")
        ) {
          return {
            data: null,
            error: errorMessage.includes("Backend API not available")
              ? errorMessage
              : "Network error: Backend server may not be running. Please ensure the backend server is running on port 3001.",
          };
        }
        // Check for JSON parse errors (HTML responses)
        if (errorMessage.includes("Unexpected token") || errorMessage.includes("is not valid JSON")) {
          return {
            data: null,
            error: "Backend API not available. The server is returning HTML instead of JSON. Please ensure the backend server is running or configure VITE_API_URL environment variable.",
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

  // Generic methods for flexibility
  public async get<T>(endpoint: string, params?: Record<string, string>, useCache: boolean = true): Promise<ApiResponse<T>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const query = queryParams.toString();
    return this.request<T>(`${endpoint}${query ? `?${query}` : ""}`, {}, useCache);
  }

  public async post<T>(endpoint: string, data?: any, useCache: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }, useCache);
  }

  public async put<T>(endpoint: string, data?: any, useCache: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }, useCache);
  }

  public async delete<T>(endpoint: string, useCache: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    }, useCache);
  }

  // Users
  async getUsers(params?: {
    role?: string;
    status?: string;
    department_id?: string;
    org_id?: string;
    user_id?: string;
    email?: string;
  }, useCache: boolean = true): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const query = queryParams.toString();
    return this.request<any[]>(`/users${query ? `?${query}` : ""}`, {}, useCache);
  }

  async getUserById(id: string, useCache: boolean = true): Promise<ApiResponse<any>> {
    return this.request<any>(`/users/${id}`, {}, useCache);
  }

  async getUsersByDepartments(
    departmentIds: string[],
    role?: string,
    status?: string
  ): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/users/by-departments", {
      method: "POST",
      body: JSON.stringify({ department_ids: departmentIds, role, status }),
    });
  }

  async createUser(userData: UserData) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async sendWelcomeEmail(data: {
    college_email: string;
    loop_email: string;
    loopid: string;
    user_name: string;
    user_id: string;
  }): Promise<ApiResponse<any>> {
    return this.request("/users/send-welcome-email", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, userData: UserData) {
    return this.request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/users/${id}`, {
      method: "DELETE",
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
    return this.request<any[]>(`/organizations${query ? `?${query}` : ""}`);
  }

  async updateOrganization(id: string, orgData: OrganizationData) {
    return this.request(`/organizations/${id}`, {
      method: "PUT",
      body: JSON.stringify(orgData),
    });
  }

  // Departments
  async getDepartments(params?: { id?: string; ids?: string[] }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.id) queryParams.append("id", params.id);
    if (params?.ids) {
      params.ids.forEach((id) => queryParams.append("ids", id));
    }
    const query = queryParams.toString();
    return this.request<any[]>(`/departments${query ? `?${query}` : ""}`);
  }

  async createDepartment(departmentData: DepartmentData) {
    return this.request("/departments", {
      method: "POST",
      body: JSON.stringify(departmentData),
    });
  }

  async updateDepartment(id: string, departmentData: { name?: string }) {
    return this.request(`/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(departmentData),
    });
  }

  async deleteDepartment(id: string) {
    return this.request(`/departments/${id}`, {
      method: "DELETE",
    });
  }

  // Teacher Departments
  async getTeacherDepartments(teacherId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/teacher-departments/${teacherId}`);
  }

  async updateTeacherDepartments(
    teacherId: string,
    departmentIds: string[]
  ): Promise<ApiResponse<any>> {
    return this.request<any>("/teacher-departments", {
      method: "POST",
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
    if (params?.date) queryParams.append("date", params.date);
    if (params?.student_id) queryParams.append("student_id", params.student_id);
    if (params?.student_ids) {
      params.student_ids.forEach((id) => queryParams.append("student_ids", id));
    }
    const query = queryParams.toString();
    return this.request<any[]>(`/attendance${query ? `?${query}` : ""}`);
  }

  // Notifications
  async getNotifications(params?: {
    user_id?: string;
    read?: boolean;
    limit?: number;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append("user_id", params.user_id);
    if (params?.read !== undefined) queryParams.append("read", String(params.read));
    if (params?.limit) queryParams.append("limit", String(params.limit));
    const query = queryParams.toString();
    return this.request<any[]>(`/notifications${query ? `?${query}` : ""}`);
  }

  async createNotification(notificationData: NotificationData) {
    return this.request("/notifications", {
      method: "POST",
      body: JSON.stringify(notificationData),
    });
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/notifications/${id}/read`, {
      method: "PUT",
    });
  }

  async markAllNotificationsAsRead(userId: string): Promise<ApiResponse<any>> {
    return this.request<any>("/notifications/read-all", {
      method: "PUT",
      body: JSON.stringify({ user_id: userId }),
    });
  }

  // Activities
  async getActivities(limit?: number): Promise<ApiResponse<any[]>> {
    const query = limit ? `?limit=${limit}` : "";
    return this.request<any[]>(`/activities${query}`);
  }

  async createActivity(activityData: ActivityData) {
    return this.request("/activities", {
      method: "POST",
      body: JSON.stringify(activityData),
    });
  }

  async createActivities(activitiesData: ActivityData[]) {
    return this.request("/activities", {
      method: "POST",
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
    if (userId) params.append("userId", userId);
    if (role) params.append("role", role);
    const query = params.toString();
    return this.request<DashboardData>(`/dashboard${query ? `?${query}` : ""}`);
  }

  /**
   * Get all attendance page data in a single API call
   * Combines: students, departments, attendance records, teacher departments, user info
   */
  async getAttendancePageData(
    userId?: string,
    role?: string,
    date?: string,
    category?: string
  ): Promise<ApiResponse<AttendancePageData>> {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    if (role) params.append("role", role);
    if (date) params.append("date", date);
    if (category) params.append("category", category);
    const query = params.toString();
    return this.request<AttendancePageData>(`/attendance/page-data${query ? `?${query}` : ""}`);
  }

  /**
   * Mark attendance using consolidated endpoint with validation
   */
  async markAttendance(records: AttendanceRecord[]): Promise<ApiResponse<unknown>> {
    return this.request("/attendance/mark", {
      method: "POST",
      body: JSON.stringify({ records }),
    });
  }

  // Growth Data Endpoints
  async getGrowthData(metric: string, period: string = "month"): Promise<ApiResponse<any>> {
    return this.request(`/growth?metric=${metric}&period=${period}`);
  }

  async getStaffGrowthByRole(role: string, period: string = "month"): Promise<ApiResponse<any>> {
    return this.request(`/growth/staff-by-role?role=${role}&period=${period}`);
  }

  async getStaffBreakdown(): Promise<ApiResponse<any>> {
    return this.request("/growth/staff-breakdown");
  }

  /**
   * Get all growth data (students, staff, attendance) for all periods (week, month) in a single call
   * This reduces API calls from 6 to 1
   */
  async getConsolidatedGrowthData(): Promise<ApiResponse<any>> {
    return this.request("/growth/consolidated");
  }

  // Custom Roles Endpoints
  async getCustomRoles(): Promise<ApiResponse<any[]>> {
    return this.request("/roles");
  }

  async getCustomRoleById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/roles/${id}`);
  }

  async createCustomRole(roleData: {
    name: string;
    permissions: string[];
    created_by?: string;
  }): Promise<ApiResponse<any>> {
    return this.request("/roles", {
      method: "POST",
      body: JSON.stringify(roleData),
    });
  }

  async updateCustomRole(
    id: string,
    roleData: { name?: string; permissions?: string[] }
  ): Promise<ApiResponse<any>> {
    return this.request(`/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(roleData),
    });
  }

  async deleteCustomRole(id: string): Promise<ApiResponse<any>> {
    return this.request(`/roles/${id}`, {
      method: "DELETE",
    });
  }

  // Finance Endpoints
  // Finance Endpoints
  async getFeeCategories(): Promise<ApiResponse<any[]>> {
    return this.request("/finance/fee-categories", {}, false);
  }

  // Scholarships
  async getScholarships(): Promise<ApiResponse<any[]>> {
    return this.request("/finance/scholarships", {}, false);
  }

  // Reports
  async getOutstandingFees(): Promise<ApiResponse<any[]>> {
    return this.request("/finance/reports/outstanding");
  }

  async getScholarshipReport(): Promise<ApiResponse<any[]>> {
    return this.request("/finance/reports/scholarship-usage");
  }

  async getFinancialStatements(): Promise<ApiResponse<any>> {
    return this.request("/finance/reports/financial-statements", {}, false);
  }

  async getTaxConfig(): Promise<ApiResponse<any>> {
    return this.request("/finance/tax/config");
  }

  async saveTaxConfig(data: any): Promise<ApiResponse<any>> {
    return this.request("/finance/tax/config", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async matchTransaction(data: {
    transaction_id: string;
    bank_transaction_id: string;
  }): Promise<ApiResponse<any>> {
    return this.request("/finance/reconciliation/match", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getUnmatchedTransactions(): Promise<ApiResponse<{ system: any[]; bank: any[] }>> {
    return this.request("/finance/reconciliation/unmatched");
  }

  async createScholarship(data: any): Promise<ApiResponse<any>> {
    return this.request("/finance/scholarships", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Adjustments & Installments
  async createInstallments(assignmentId: string, installments: any[]): Promise<ApiResponse<any>> {
    return this.request(`/finance/assignments/${assignmentId}/installments`, {
      method: "POST",
      body: JSON.stringify({ installments }),
    });
  }

  async createAdjustment(data: any): Promise<ApiResponse<any>> {
    return this.request("/finance/adjustments", {
      method: "POST",
      body: JSON.stringify(data),
    });
    // The following line was a duplicate and has been removed for correctness.
  }

  // Refunds
  async getRefunds(): Promise<ApiResponse<any[]>> {
    return this.request("/finance/refunds");
  }

  async requestRefund(data: any): Promise<ApiResponse<any>> {
    return this.request("/finance/refund/request", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async approveRefund(
    id: string,
    data: { status: "approved" | "rejected"; approved_by: string }
  ): Promise<ApiResponse<any>> {
    return this.request(`/finance/refund/approve/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Bank Management
  async createBankAccount(data: any): Promise<ApiResponse<any>> {
    return this.request("/finance/bank-accounts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createBankTransaction(data: any): Promise<ApiResponse<any>> {
    return this.request("/finance/bank-transactions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getBankTransactions(bankId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/finance/bank-transactions/${bankId}`);
  }

  // Online Payment Mock
  async payOnlineMock(data: any): Promise<ApiResponse<any>> {
    const response = await this.request("/finance/pay/online-mock", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.error) {
      import("../lib/events").then(({ events, REFRESH_DASHBOARD, REFRESH_FINANCE }) => {
        events.emit(REFRESH_DASHBOARD);
        events.emit(REFRESH_FINANCE);
      });
    }

    return response;
  }

  async createFeeCategory(data: { name: string; description?: string }): Promise<ApiResponse<any>> {
    return this.request("/finance/fee-categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getFeeHeads(): Promise<ApiResponse<any[]>> {
    return this.request("/finance/fee-heads", {}, false);
  }

  async createFeeHead(data: {
    name: string;
    type: string;
    is_refundable?: boolean;
  }): Promise<ApiResponse<any>> {
    return this.request("/finance/fee-heads", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getFeeStructures(params?: {
    batch_year?: number;
    category_id?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.batch_year) queryParams.append("batch_year", String(params.batch_year));
    if (params?.category_id) queryParams.append("category_id", params.category_id);
    const query = queryParams.toString();
    return this.request(`/finance/structures${query ? `?${query}` : ""}`, {}, false);
  }

  async createFeeStructure(data: any): Promise<ApiResponse<any>> {
    return this.request("/finance/structures", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getStudentFees(studentId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/finance/student/${studentId}/fees`, {}, false);
  }

  async assignFeeStructure(data: {
    student_id: string;
    structure_id: string;
    scholarship_id?: string;
  }): Promise<ApiResponse<any>> {
    return this.request("/finance/assign", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async assignFeeStructureBulk(data: {
    student_ids: string[];
    structure_id: string;
    scholarship_id?: string;
  }): Promise<ApiResponse<any>> {
    return this.request("/finance/assign-bulk", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async recordPayment(data: any): Promise<ApiResponse<any>> {
    const response = await this.request("/finance/pay/manual", {
      method: "POST",
      body: JSON.stringify(data),
    });

    // Trigger global refresh
    if (!response.error) {
      import("../lib/events").then(({ events, REFRESH_DASHBOARD, REFRESH_FINANCE }) => {
        events.emit(REFRESH_DASHBOARD);
        events.emit(REFRESH_FINANCE);
      });
    }

    return response;
  }

  async getReceipt(id: string): Promise<ApiResponse<any>> {
    return this.request(`/finance/receipt/${id}`);
  }

  // Auto-Assignment & Rules
  async autoAssignFees(studentId: string): Promise<ApiResponse<any>> {
    const response = await this.request(`/finance/auto-assign/${studentId}`, { method: "POST" });
    if (!response.error) {
      import("../lib/events").then(({ events, REFRESH_DASHBOARD }) => events.emit(REFRESH_DASHBOARD));
    }
    return response;
  }

  async getAssignmentRules(): Promise<ApiResponse<any[]>> {
    return this.request("/finance/assignment-rules");
  }

  async createAssignmentRule(data: any): Promise<ApiResponse<any>> {
    return this.request("/finance/assignment-rules", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getPenaltyConfigs(): Promise<ApiResponse<any[]>> {
    return this.request("/finance/penalty-configs");
  }

  async getHostelDashboard(): Promise<ApiResponse<any>> {
    return this.request("/hostel/dashboard");
  }

  async getLibraryDashboard(): Promise<ApiResponse<any>> {
    return this.request("/library/dashboard");
  }

  async getLibraryBooks(filters?: {
    title?: string;
    author?: string;
    isbn?: string;
    category?: string;
    status?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const query = queryParams.toString();
    return this.request<any[]>(`/library/books${query ? `?${query}` : ""}`);
  }

  async addLibraryBook(data: any): Promise<ApiResponse<any>> {
    return this.request("/library/books", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteLibraryBook(id: string): Promise<ApiResponse<any>> {
    return this.request(`/library/books/${id}`, {
      method: "DELETE",
    });
  }

  async getLibraryMember(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/library/members/${id}`);
  }

  async issueLibraryBook(data: any): Promise<ApiResponse<any>> {
    return this.request("/library/issue", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async returnLibraryBook(data: any): Promise<ApiResponse<any>> {
    return this.request("/library/return", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getExamDashboard(): Promise<ApiResponse<any>> {
    return this.request("/exam/dashboard");
  }

  async createExam(data: any): Promise<ApiResponse<any>> {
    return this.request("/exam/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getTimetable(examId: string): Promise<ApiResponse<any>> {
    return this.request(`/exam/timetable/${examId}`, {}, false);
  }

  async createTimetableEntry(data: any): Promise<ApiResponse<any>> {
    return this.request("/exam/timetable", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async generateHallTickets(examId: string): Promise<ApiResponse<any>> {
    return this.request(`/exam/hall-tickets/generate/${examId}`, {
      method: "POST",
    });
  }

  async getHallTickets(examId: string): Promise<ApiResponse<any>> {
    return this.request(`/exam/hall-tickets/${examId}`);
  }

  async submitMarks(data: any): Promise<ApiResponse<any>> {
    return this.request("/exam/marks/submit", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async generateSeatingPlan(data: any): Promise<ApiResponse<any>> {
    return this.request("/exam/seating/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSeatingPlan(examId: string): Promise<ApiResponse<any>> {
    return this.request(`/exam/seating/${examId}`);
  }

  async getExams(params?: { status?: string; academic_calendar_id?: string }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.academic_calendar_id) queryParams.append("academic_calendar_id", params.academic_calendar_id);
    const query = queryParams.toString();
    return this.request<any[]>(`/exam/list${query ? `?${query}` : ""}`, {}, false);
  }

  async assignExamBulk(data: {
    exam_id: string;
    student_ids: string[];
    skip_fee: boolean;
  }): Promise<ApiResponse<any>> {
    return this.request("/exam/assign-bulk", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }


  // Transport Fees
  async getStudentTransportFees(studentId: string): Promise<ApiResponse<any>> {
    return this.request(`/transport/student/${studentId}`);
  }

  async payTransportFee(data: any): Promise<ApiResponse<any>> {
    return this.request("/transport/pay", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async syncTransportFees(): Promise<ApiResponse<any>> {
    return this.request("/transport/fix-fees", { method: "POST" });
  }

  async getChartOfAccounts(): Promise<ApiResponse<any[]>> {
    return this.request("/finance/chart-of-accounts");
  }

  async getTasks(filters?: { assigned_by?: string; assigned_to?: string }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const query = queryParams.toString();
    return this.request<any[]>(`/tasks${query ? `?${query}` : ""}`, {}, false);
  }

  async createTask(data: {
    title: string;
    description?: string;
    assigned_to: string;
    assigned_to_name: string;
    assigned_by: string;
    assigned_by_name: string;
    due_date: string;
    status?: string;
  }): Promise<ApiResponse<any>> {
    return this.request("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createAccount(data: {
    code: string;
    name: string;
    type: string;
    subtype?: string;
  }): Promise<ApiResponse<any>> {
    return this.request("/finance/chart-of-accounts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createJournalEntry(data: any): Promise<ApiResponse<any>> {
    return this.request("/finance/journal", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getBankAccounts(): Promise<ApiResponse<any[]>> {
    return this.request("/finance/bank-accounts");
  }

  async getTaxSettings(): Promise<ApiResponse<any[]>> {
    return this.request("/finance/tax-settings");
  }

  async getCollectionReport(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append("start_date", params.start_date);
    if (params?.end_date) queryParams.append("end_date", params.end_date);
    const query = queryParams.toString();
    return this.request(`/finance/reports/collection${query ? `?${query}` : ""}`);
  }

  // Facilities
  async getFacilities(): Promise<ApiResponse<any[]>> {
    return this.request("/facilities");
  }

  // Schedules
  async getSchedules(params?: any): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, String(value));
      });
    }
    const query = queryParams.toString();
    return this.request(`/schedules${query ? `?${query}` : ""}`, {}, false);
  }

  async createSchedule(data: any): Promise<ApiResponse<any>> {
    return this.request("/schedules", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSchedule(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/schedules/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteSchedule(id: string): Promise<ApiResponse<any>> {
    return this.request(`/schedules/${id}`, {
      method: "DELETE",
    });
  }

  // Tasks (Update and Delete were missing)
  async updateTask(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // AI Chat History
  async getChatHistory(userId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/ai/history?userId=${userId}`);
  }

  async saveChatMessage(data: {
    userId: string;
    role: string;
    content: string;
    metadata?: any;
  }): Promise<ApiResponse<any>> {
    return this.request("/ai/history", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Chat Messaging
  async getChatMessages(userId: string, otherUserId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/chat/messages?user_id=${userId}&other_user_id=${otherUserId}`, {}, false);
  }

  async getRecentConversations(userId: string, useCache: boolean = true): Promise<ApiResponse<any[]>> {
    return this.request(`/chat/chats?user_id=${userId}`, {}, useCache);
  }

  async createGroup(data: { name: string; members: string[]; icon?: string; created_by: string }): Promise<ApiResponse<any>> {
    return this.request("/chat/groups", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateGroupDescription(groupId: string, description: string): Promise<ApiResponse<any>> {
    return this.request(`/chat/groups/${groupId}`, {
      method: "PUT",
      body: JSON.stringify({ description }),
    });
  }

  async addGroupMembers(groupId: string, userIds: string[]): Promise<ApiResponse<any>> {
    return this.request(`/chat/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ user_ids: userIds }),
    });
  }

  async leaveGroup(groupId: string, userId: string): Promise<ApiResponse<any>> {
    return this.request(`/chat/groups/${groupId}/leave`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async addReaction(messageId: string, userId: string, userName: string, emoji: string): Promise<ApiResponse<any>> {
    return this.request(`/chat/messages/${messageId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, user_name: userName, emoji }),
    });
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<ApiResponse<any>> {
    return this.request(`/chat/messages/${messageId}/reactions/${emoji}?user_id=${userId}`, {
      method: "DELETE",
    });
  }

  async muteChat(chatId: string, userId: string, muted: boolean): Promise<ApiResponse<any>> {
    return this.request(`/chat/chats/${chatId}/mute`, {
      method: "PUT",
      body: JSON.stringify({ user_id: userId, muted }),
    });
  }

  async deleteChat(chatId: string, userId: string): Promise<ApiResponse<any>> {
    return this.request(`/chat/chats/${chatId}`, {
      method: "DELETE",
      body: JSON.stringify({ user_id: userId }), // DELETE usually doesn't have body, but express supports it. Safer to use query or URL param if possible, but route expects body.
    });
  }

  // Alternative delete with headers if body is stripped
  async deleteChatWithBody(chatId: string, userId: string): Promise<ApiResponse<any>> {
    return this.request(`/chat/chats/${chatId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async clearChat(chatId: string, userId: string): Promise<ApiResponse<any>> {
    return this.request(`/chat/chats/${chatId}/clear`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async archiveChat(chatId: string, userId: string, archived: boolean): Promise<ApiResponse<any>> {
    return this.request(`/chat/chats/${chatId}/archive`, {
      method: "PUT",
      body: JSON.stringify({ user_id: userId, archived }),
    });
  }

  async sendChatMessage(data: {
    sender_id: string;
    receiver_id?: string;
    group_id?: string;
    content: string;
    type: "text" | "image" | "file";
    reply_to_id?: string;
    file_url?: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
  }): Promise<ApiResponse<any>> {
    return this.request("/chat/messages", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async pinMessage(messageId: string, pinned: boolean): Promise<ApiResponse<any>> {
    const res = await this.request(`/chat/messages/${messageId}/pin`, {
      method: "PUT",
      body: JSON.stringify({ pinned }),
    });
    if (!res.error) apiCache.invalidate("/chat/messages");
    return res;
  }

  async starMessage(messageId: string, userId: string, starred: boolean): Promise<ApiResponse<any>> {
    const res = await this.request(`/chat/messages/${messageId}/star`, {
      method: "PUT",
      body: JSON.stringify({ user_id: userId, starred }),
    });
    if (!res.error) apiCache.invalidate("/chat/messages");
    return res;
  }

  async deleteChatMessage(messageId: string, userId: string, deleteForEveryone: boolean): Promise<ApiResponse<any>> {
    const res = await this.request(`/chat/messages/${messageId}?user_id=${userId}&type=${deleteForEveryone ? 'everyone' : 'me'}`, {
      method: "DELETE",
    });
    if (!res.error) apiCache.invalidate("/chat/messages");
    return res;
  }

  async markMessagesAsDelivered(userId: string, messageIds: string[]): Promise<ApiResponse<any>> {
    return this.request("/messages/delivered", {
      method: "PUT",
      body: JSON.stringify({ user_id: userId, message_ids: messageIds }),
    });
  }

  async editChatMessage(messageId: string, userId: string, content: string): Promise<ApiResponse<any>> {
    const res = await this.request(`/chat/messages/${messageId}`, {
      method: "PUT",
      body: JSON.stringify({ user_id: userId, content }),
    });
    if (!res.error) apiCache.invalidate("/chat/messages");
    return res;
  }

  async markMessagesAsRead(userId: string, otherUserId?: string, groupId?: string): Promise<ApiResponse<any>> {
    return this.request(`/chat/messages/read`, {
      method: "PUT",
      body: JSON.stringify({ user_id: userId, other_user_id: otherUserId, group_id: groupId }),
    });
  }

  // Calling
  async initiateCall(data: {
    caller_id: string;
    receiver_id: string;
    type: "audio" | "video";
  }): Promise<ApiResponse<any>> {
    return this.request("/chat/calls", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async endCall(callId: string): Promise<ApiResponse<any>> {
    return this.request(`/chat/calls/${callId}/end`, {
      method: "PUT",
    });
  }

  async getIncomingCall(userId: string): Promise<ApiResponse<any>> {
    return this.request(`/chat/calls/incoming?user_id=${userId}`);
  }
  async getEvents(params?: any): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, String(value));
      });
    }
    const query = queryParams.toString();
    return this.request(`/events${query ? `?${query}` : ""}`);
  }

  async createEvent(data: any): Promise<ApiResponse<any>> {
    return this.request("/events", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async joinEvent(eventId: string, data: { student_id: string; payment_amount?: number }): Promise<ApiResponse<any>> {
    return this.request(`/events/${eventId}/join`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async markEventPresence(eventId: string, data: { student_id: string }): Promise<ApiResponse<any>> {
    return this.request(`/events/${eventId}/presence`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getEventParticipants(eventId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/events/${eventId}/participants`);
  }

  async updateEvent(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: string): Promise<ApiResponse<any>> {
    return this.request(`/events/${id}`, {
      method: "DELETE",
    });
  }

  async deleteTask(id: string): Promise<ApiResponse<any>> {
    return this.request(`/tasks/${id}`, {
      method: "DELETE",
    });
  }


  async getGroupDetails(groupId: string): Promise<ApiResponse<any>> {
    return this.request(`/chat/groups/${groupId}`, {}, false);
  }

  // Admission
  async getMeritLists(): Promise<ApiResponse<any[]>> {
    // TODO: Implement backend endpoint
    return Promise.resolve({ data: [], error: null });
  }

  async generateMeritList(data: any): Promise<ApiResponse<any>> {
    // TODO: Implement backend endpoint
    return Promise.resolve({ data: { candidates_shortlisted: 0 }, error: null });
  }

  async createEntranceExam(data: any): Promise<ApiResponse<any>> {
    // TODO: Implement backend endpoint
    return Promise.resolve({ data: {}, error: null });
  }

  async getApplications(userId?: string): Promise<ApiResponse<any[]>> {
    // TODO: Implement backend endpoint
    return Promise.resolve({ data: [], error: null });
  }

  async submitApplication(data: any): Promise<ApiResponse<any>> {
    // TODO: Implement backend endpoint
    return Promise.resolve({ data: {}, error: null });
  }

  // Student specific routes
  async getStudentRegistrations(studentId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/sim/registration/my-courses/${studentId}`);
  }

  async getAcademicHistory(studentId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/sim/academic/history/${studentId}`);
  }

  // Exam & Timetable Management methods are already defined above (lines 834+)

  async getStudents(): Promise<ApiResponse<any[]>> {
    return this.request("/students");
  }



  async getCourses(): Promise<ApiResponse<any[]>> {
    return this.request("/academic/courses");
  }

  // Tasks Filter Logic Reminder:
  // getTasks params are passed directly to query string.
  // Backend /tasks filters by assigned_to or assigned_by respectively.
  // "My Tasks" calls getTasks({ assigned_to: currentId }), which matches backend logic.


  // E2EE
  async getHostelDashboard(): Promise<ApiResponse<any>> {
    return this.request("/hostel/dashboard");
  }

  async createHostel(data: any): Promise<ApiResponse<any>> {
    return this.request("/hostel", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getPublicKey(userId: string): Promise<ApiResponse<string>> {
    return this.request(`/users/${userId}/public-key`);
  }

  async uploadPublicKey(userId: string, publicKey: string): Promise<ApiResponse<any>> {
    return this.request("/users/public-key", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, public_key: publicKey }),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
