import React, { createContext, useContext, useState, useEffect } from 'react';
import { ROLE_HIERARCHY } from '@/types/erp';
import { api } from '@/services/api';

const AuthContext = createContext(undefined);

// Map role to email for login
const ROLE_EMAIL_MAP = {
  admin: 'admin@school.edu',
  vice_head: 'vicehead@school.edu',
  teacher: 'teacher@school.edu',
  student: 'student@school.edu',
  housekeeping: 'maintenance@school.edu',
  librarian: 'library@school.edu',
  accountant: 'accounts@school.edu',
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load admin user by default on mount
  useEffect(() => {
    loadUser('admin');
  }, []);

  const loadUserById = async (userId) => {
    try {
      const response = await api.getUserById(userId);
      if (response.error) throw new Error(response.error);
      const data = response.data;

      if (data) {
        // Fetch organization if org_id exists
        let organization = undefined;
        if (data.org_id) {
          const orgResponse = await api.getOrganizations({ id: String(data.org_id) });
          if (!orgResponse.error && orgResponse.data && Array.isArray(orgResponse.data) && orgResponse.data.length > 0) {
            const orgData = orgResponse.data[0];
            organization = {
              id: orgData.id,
              org_id: orgData.org_id,
              org_code: orgData.org_code,
              org_name: orgData.org_name,
            };
          }
        }

        const user = {
          id: data.id,
          loopid: data.loopid,
          org_id: data.org_id,
          user_id: data.user_id,
          name: data.name,
          email: data.email,
          role: data.role,
          permissions: data.permissions || [],
          department: data.department,
          createdAt: new Date(data.created_at),
          status: data.status,
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

  const loadUserByOrgAndUserId = async (orgName, userId) => {
    try {
      // First get the organization
      const orgResponse = await api.getOrganizations({ org_name: orgName });
      if (orgResponse.error) throw new Error(orgResponse.error);
      if (!orgResponse.data || !Array.isArray(orgResponse.data) || orgResponse.data.length === 0) throw new Error('Organization not found');
      const orgData = orgResponse.data[0];

      // Then get the user
      const userResponse = await api.getUsers({ org_id: String(orgData.id), user_id: String(userId) });
      if (userResponse.error) throw new Error(userResponse.error);
      if (!userResponse.data || !Array.isArray(userResponse.data) || userResponse.data.length === 0) throw new Error('User not found');
      const data = userResponse.data[0];

      const user = {
        id: data.id,
        loopid: data.loopid,
        org_id: data.org_id,
        user_id: data.user_id,
        name: data.name,
        email: data.email,
        role: data.role,
        permissions: data.permissions || [],
        department: data.department,
        createdAt: new Date(data.created_at),
        status: data.status,
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

  const loadUser = async (role) => {
    try {
      const email = ROLE_EMAIL_MAP[role];
      const response = await api.getUsers({ email });
      if (response.error) throw new Error(response.error);
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) throw new Error('User not found');
      const data = response.data[0];

      // Fetch organization if org_id exists
      let organization = undefined;
      if (data.org_id) {
        const orgResponse = await api.getOrganizations({ id: String(data.org_id) });
        if (!orgResponse.error && orgResponse.data && Array.isArray(orgResponse.data) && orgResponse.data.length > 0) {
          const orgData = orgResponse.data[0];
          organization = {
            id: orgData.id,
            org_id: orgData.org_id,
            org_code: orgData.org_code,
            org_name: orgData.org_name,
          };
        }
      }

      const user = {
        id: data.id,
        loopid: data.loopid,
        org_id: data.org_id,
        user_id: data.user_id,
        name: data.name,
        email: data.email,
        role: data.role,
        permissions: data.permissions || [],
        department: data.department,
        createdAt: new Date(data.created_at),
        status: data.status,
        avatar: data.avatar,
        organization,
      };
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (roleOrUserId, orgName, userId) => {
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
      await loadUser(roleOrUserId);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const canManageRole = (targetRole) => {
    if (!currentUser) return false;
    return ROLE_HIERARCHY[currentUser.role] < ROLE_HIERARCHY[targetRole];
  };

  const hasPermission = (permission) => {
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
