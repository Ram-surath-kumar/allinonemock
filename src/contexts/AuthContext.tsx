import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, ROLE_HIERARCHY, ROLE_DEFAULT_PERMISSIONS } from '@/types/erp';
import { api } from '@/services/api';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (roleOrUserId: UserRole | string, orgName?: string, userId?: number) => Promise<void>; // Can accept role, user ID, or orgName + userId
  logout: () => void;
  canManageRole: (targetRole: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
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
  admin: 'admin@school.edu',
  vice_head: 'vicehead@school.edu',
  teacher: 'teacher@school.edu',
  student: 'student@school.edu',
  housekeeping: 'maintenance@school.edu',
  librarian: 'library@school.edu',
  accountant: 'accounts@school.edu',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load admin user by default on mount
  useEffect(() => {
    loadUser('admin');
  }, []);

  const loadUserById = async (userId: string) => {
    try {
      const response = await api.getUserById(userId);
      if (response.error) throw new Error(response.error);
      const data = response.data as ApiUserData | null;

      if (data) {
        // Fetch organization if org_id exists
        let organization = undefined;
        if (data.org_id) {
          const orgResponse = await api.getOrganizations({ id: String(data.org_id) });
          if (!orgResponse.error && orgResponse.data && Array.isArray(orgResponse.data) && orgResponse.data.length > 0) {
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
          user_id: data.user_id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          permissions: data.permissions || [],
          department: data.department,
          createdAt: new Date(data.created_at),
          status: data.status as 'active' | 'inactive',
          avatar: data.avatar,
          organization,
        };
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error loading user by ID:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserByOrgAndUserId = async (orgName: string, userId: number) => {
    try {
      // First get the organization
      const orgResponse = await api.getOrganizations({ org_name: orgName });
      if (orgResponse.error) throw new Error(orgResponse.error);
      if (!orgResponse.data || !Array.isArray(orgResponse.data) || orgResponse.data.length === 0) throw new Error('Organization not found');
      const orgData = orgResponse.data[0] as ApiOrgData;

      // Then get the user
      const userResponse = await api.getUsers({ org_id: String(orgData.id), user_id: String(userId) });
      if (userResponse.error) throw new Error(userResponse.error);
      if (!userResponse.data || !Array.isArray(userResponse.data) || userResponse.data.length === 0) throw new Error('User not found');
      const data = userResponse.data[0] as ApiUserData;

      const user: User = {
        id: data.id,
        loopid: data.loopid,
        org_id: data.org_id,
        user_id: data.user_id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        permissions: data.permissions || [],
        department: data.department,
        createdAt: new Date(data.created_at),
        status: data.status as 'active' | 'inactive',
        avatar: data.avatar,
        organization: {
          id: orgData.id,
          org_id: orgData.org_id,
          org_code: orgData.org_code,
          org_name: orgData.org_name,
        },
      };
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user by org and user_id:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUser = async (role: UserRole) => {
    try {
      const email = ROLE_EMAIL_MAP[role];
      const response = await api.getUsers({ email });
      if (response.error) throw new Error(response.error);
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) throw new Error('User not found');
      const data = response.data[0] as ApiUserData;

      // Fetch organization if org_id exists
      let organization = undefined;
      if (data.org_id) {
        const orgResponse = await api.getOrganizations({ id: String(data.org_id) });
        if (!orgResponse.error && orgResponse.data && Array.isArray(orgResponse.data) && orgResponse.data.length > 0) {
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
        user_id: data.user_id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        permissions: data.permissions || [],
        department: data.department,
        createdAt: new Date(data.created_at),
        status: data.status as 'active' | 'inactive',
        avatar: data.avatar,
        organization,
      };
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
      console.log('Login failed for email:', ROLE_EMAIL_MAP[role]);
    } finally {
      setLoading(false);
    }
  };

  const login = async (roleOrUserId: UserRole | string, orgName?: string, userId?: number) => {
    // If orgName and userId are provided, use the new format
    if (orgName && userId) {
      await loadUserByOrgAndUserId(orgName, userId);
      return;
    }

    // Check if it's a UUID (user ID) or a role
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roleOrUserId);

    if (isUUID) {
      await loadUserById(roleOrUserId);
    } else {
      await loadUser(roleOrUserId as UserRole);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const canManageRole = (targetRole: UserRole): boolean => {
    if (!currentUser) return false;
    return ROLE_HIERARCHY[currentUser.role] < ROLE_HIERARCHY[targetRole];
  };

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    return currentUser.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, canManageRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
