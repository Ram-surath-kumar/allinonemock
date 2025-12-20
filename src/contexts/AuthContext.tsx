import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, ROLE_HIERARCHY, ROLE_DEFAULT_PERMISSIONS } from '@/types/erp';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  login: (role: UserRole | string) => void; // Can accept role or user ID
  logout: () => void;
  canManageRole: (targetRole: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        // Fetch organization if org_id exists
        let organization = undefined;
        if (data.org_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', data.org_id)
            .single();
          
          if (orgData) {
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
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('org_name', orgName)
        .single();

      if (orgError) throw orgError;
      if (!orgData) throw new Error('Organization not found');

      // Then get the user
      const { data, error } = await supabase
        .from('users')
        .select('*, organizations(*)')
        .eq('org_id', orgData.id)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (data) {
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
          organization: data.organizations ? {
            id: data.organizations.id,
            org_id: data.organizations.org_id,
            org_code: data.organizations.org_code,
            org_name: data.organizations.org_name,
          } : undefined,
        };
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error loading user by org and user_id:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUser = async (role: UserRole) => {
    try {
      const email = ROLE_EMAIL_MAP[role];
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;

      if (data) {
        // Fetch organization if org_id exists
        let organization = undefined;
        if (data.org_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', data.org_id)
            .single();
          
          if (orgData) {
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
      console.error('Error loading user:', error);
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
    <AuthContext.Provider value={{ currentUser, login, logout, canManageRole, hasPermission }}>
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
