import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User, UserRole } from "@/types";
import { ROLE_HIERARCHY, ROLE_DEFAULT_PERMISSIONS } from "@/types/erp";
import { api } from "@/services/api";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  currentUser: User | null;
  login: (roleOrUserId: UserRole | string, orgName?: string, userId?: string | number) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => void;
  canManageRole: (targetRole: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API response type definitions
interface ApiUserData {
  id: string;
  loopid?: string;
  org_id?: number;
  user_id?: number;
  name: string;
  email: string;
  role: string;
  permissions?: string[];
  department?: string;
  created_at: string;
  status: string;
  avatar?: string;
}

interface ApiOrgData {
  id: number;
  org_id: number;
  org_code: string;
  org_name: string;
}

// Map role to email for login
const ROLE_EMAIL_MAP: Record<UserRole, string> = {
  admin: "admin@school.edu",
  vice_head: "vicehead@school.edu",
  teacher: "teacher@school.edu",
  student: "student@school.edu",
  housekeeping: "maintenance@school.edu",
  librarian: "library@school.edu",
  accountant: "accounts@school.edu",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      // If there's an error with the session (e.g., invalid refresh token), clear it
      if (error) {
        console.warn("Session error, clearing:", error.message);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (session?.user?.email) {
        // Load user by email if session exists
        await loadUserByEmail(session.user.email);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error checking session:", error);
      // Clear any stale session data
      await supabase.auth.signOut();
      setLoading(false);
    }
  };

  const loadUserById = async (userId: string) => {
    try {
      setLoading(true);
      const response = await api.getUserById(userId);
      if (response.error) throw new Error(response.error);
      const data = response.data as ApiUserData | null;

      if (data) {
        // Fetch organization if org_id exists
        let organization = undefined;
        if (data.org_id) {
          const orgResponse = await api.getOrganizations({ id: String(data.org_id) });
          if (
            !orgResponse.error &&
            orgResponse.data &&
            Array.isArray(orgResponse.data) &&
            orgResponse.data.length > 0
          ) {
            const orgData = orgResponse.data[0] as ApiOrgData;
            organization = {
              id: orgData.id,
              org_id: orgData.org_id,
              org_code: orgData.org_code,
              org_name: orgData.org_name,
            };
          }
        }

        const user: User = {
          id: data.id,
          loopid: data.loopid,
          org_id: data.org_id,
          user_id: data.user_id ? String(data.user_id) : undefined,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          permissions:
            data.permissions && data.permissions.length > 0
              ? data.permissions
              : ROLE_DEFAULT_PERMISSIONS[data.role as UserRole] || [],
          department: data.department,
          createdAt: new Date(data.created_at),
          status: data.status as "active" | "inactive",
          avatar: data.avatar,
          organization,
        };
        setCurrentUser(user);
      }
    } catch (error) {
      console.error("Error loading user by ID:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadUserByOrgAndUserId = async (orgName: string, userId: string | number) => {
    try {
      setLoading(true);
      // First get the organization
      const orgResponse = await api.getOrganizations({ org_name: orgName });
      if (orgResponse.error) throw new Error(orgResponse.error);
      if (!orgResponse.data || !Array.isArray(orgResponse.data) || orgResponse.data.length === 0)
        throw new Error("Organization not found");
      const orgData = orgResponse.data[0] as ApiOrgData;

      // Then get the user
      const userResponse = await api.getUsers({
        org_id: String(orgData.id),
        user_id: String(userId),
      });
      if (userResponse.error) throw new Error(userResponse.error);
      if (!userResponse.data || !Array.isArray(userResponse.data) || userResponse.data.length === 0)
        throw new Error("User not found");
      const data = userResponse.data[0] as ApiUserData;

      const user: User = {
        id: data.id,
        loopid: data.loopid,
        org_id: data.org_id,
        user_id: data.user_id ? String(data.user_id) : undefined,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        permissions:
          data.permissions && data.permissions.length > 0
            ? data.permissions
            : ROLE_DEFAULT_PERMISSIONS[data.role as UserRole] || [],
        department: data.department,
        createdAt: new Date(data.created_at),
        status: data.status as "active" | "inactive",
        avatar: data.avatar,
        organization: {
          id: orgData.id,
          org_id: String(orgData.org_id),
          org_code: orgData.org_code,
          org_name: orgData.org_name,
        },
      };
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user by org and user_id:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadUser = async (role: UserRole) => {
    try {
      setLoading(true);
      const email = ROLE_EMAIL_MAP[role];
      const response = await api.getUsers({ email });
      if (response.error) throw new Error(response.error);
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0)
        throw new Error("User not found");
      const data = response.data[0] as ApiUserData;

      // Fetch organization if org_id exists
      let organization = undefined;
      if (data.org_id) {
        const orgResponse = await api.getOrganizations({ id: String(data.org_id) });
        if (
          !orgResponse.error &&
          orgResponse.data &&
          Array.isArray(orgResponse.data) &&
          orgResponse.data.length > 0
        ) {
          const orgData = orgResponse.data[0] as ApiOrgData;
          organization = {
            id: orgData.id,
            org_id: orgData.org_id,
            org_code: orgData.org_code,
            org_name: orgData.org_name,
          };
        }
      }

      const user: User = {
        id: data.id,
        loopid: data.loopid,
        org_id: data.org_id,
        user_id: data.user_id ? String(data.user_id) : undefined,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        permissions:
          data.permissions && data.permissions.length > 0
            ? data.permissions
            : ROLE_DEFAULT_PERMISSIONS[data.role as UserRole] || [],
        department: data.department,
        createdAt: new Date(data.created_at),
        status: data.status as "active" | "inactive",
        avatar: data.avatar,
        organization,
      };
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadUserByEmail = async (email: string) => {
    try {
      setLoading(true);
      const response = await api.getUsers({ email });
      if (response.error) throw new Error(response.error);
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        // Try to fallback to role-based email if specific email not found,
        // useful for demo environment
        const roleEntry = Object.entries(ROLE_EMAIL_MAP).find(
          ([_role, roleEmail]) => roleEmail === email
        );
        if (roleEntry) {
          // It was a role email, but maybe user isn't in DB yet?
          // No, we should throw error here as per .jsx logic
          throw new Error("User data not found in database");
        }
        throw new Error("User data not found in database");
      }
      const data = response.data[0] as ApiUserData;

      // Fetch organization if org_id exists
      let organization = undefined;
      if (data.org_id) {
        const orgResponse = await api.getOrganizations({ id: String(data.org_id) });
        if (
          !orgResponse.error &&
          orgResponse.data &&
          Array.isArray(orgResponse.data) &&
          orgResponse.data.length > 0
        ) {
          const orgData = orgResponse.data[0] as ApiOrgData;
          organization = {
            id: orgData.id,
            org_id: String(orgData.org_id),
            org_code: orgData.org_code,
            org_name: orgData.org_name,
          };
        }
      }

      const user: User = {
        id: data.id,
        loopid: data.loopid,
        org_id: data.org_id,
        user_id: data.user_id ? String(data.user_id) : undefined,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        permissions:
          data.permissions && data.permissions.length > 0
            ? data.permissions
            : ROLE_DEFAULT_PERMISSIONS[data.role as UserRole] || [],
        department: data.department,
        createdAt: new Date(data.created_at),
        status: data.status as "active" | "inactive",
        avatar: data.avatar,
        organization,
      };
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user by email:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithCredentials = async (email: string, password: string) => {
    try {
      setLoading(true);

      // Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // Load user data
      await loadUserByEmail(email);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (roleOrUserId: UserRole | string, orgName?: string, userId?: string | number) => {
    // If orgName and userId are provided, use the new format
    if (orgName && userId) {
      await loadUserByOrgAndUserId(orgName, userId);
      return;
    }

    // Check if it's a UUID (user ID) or a role
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      roleOrUserId
    );

    if (isUUID) {
      await loadUserById(roleOrUserId);
    } else {
      await loadUser(roleOrUserId as UserRole);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      // Clear any cached data
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      setCurrentUser(null);
      window.location.href = "/login";
    }
  };

  const canManageRole = (targetRole: UserRole): boolean => {
    if (!currentUser) return false;
    return ROLE_HIERARCHY[currentUser.role] < ROLE_HIERARCHY[targetRole];
  };

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === "admin") return true;
    return currentUser.permissions.includes(permission);
  };

  const refreshUser = async () => {
    if (currentUser?.email) {
      await loadUserByEmail(currentUser.email);
    } else if (currentUser?.id) {
      await loadUserById(currentUser.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        loginWithCredentials,
        logout,
        canManageRole,
        hasPermission,
        loading,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
