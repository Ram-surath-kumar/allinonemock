import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole, ROLE_HIERARCHY, ROLE_DEFAULT_PERMISSIONS } from '@/types/erp';

interface AuthContextType {
  currentUser: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  canManageRole: (targetRole: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: Record<UserRole, User> = {
  admin: {
    id: '1',
    name: 'Dr. Sarah Johnson',
    email: 'admin@school.edu',
    role: 'admin',
    permissions: ROLE_DEFAULT_PERMISSIONS.admin,
    department: 'Administration',
    createdAt: new Date('2020-01-15'),
    status: 'active',
  },
  vice_head: {
    id: '2',
    name: 'Prof. Michael Chen',
    email: 'vicehead@school.edu',
    role: 'vice_head',
    permissions: ROLE_DEFAULT_PERMISSIONS.vice_head,
    department: 'Academic Affairs',
    createdAt: new Date('2021-03-20'),
    status: 'active',
  },
  teacher: {
    id: '3',
    name: 'Ms. Emily Parker',
    email: 'teacher@school.edu',
    role: 'teacher',
    permissions: ROLE_DEFAULT_PERMISSIONS.teacher,
    department: 'Science',
    createdAt: new Date('2022-08-01'),
    status: 'active',
  },
  student: {
    id: '4',
    name: 'Alex Thompson',
    email: 'student@school.edu',
    role: 'student',
    permissions: ROLE_DEFAULT_PERMISSIONS.student,
    department: 'Grade 10',
    createdAt: new Date('2023-09-01'),
    status: 'active',
  },
  housekeeping: {
    id: '5',
    name: 'John Martinez',
    email: 'maintenance@school.edu',
    role: 'housekeeping',
    permissions: ROLE_DEFAULT_PERMISSIONS.housekeeping,
    department: 'Facilities',
    createdAt: new Date('2021-06-15'),
    status: 'active',
  },
  librarian: {
    id: '6',
    name: 'Lisa Wong',
    email: 'library@school.edu',
    role: 'librarian',
    permissions: ROLE_DEFAULT_PERMISSIONS.librarian,
    department: 'Library',
    createdAt: new Date('2020-09-01'),
    status: 'active',
  },
  accountant: {
    id: '7',
    name: 'Robert Davis',
    email: 'accounts@school.edu',
    role: 'accountant',
    permissions: ROLE_DEFAULT_PERMISSIONS.accountant,
    department: 'Finance',
    createdAt: new Date('2019-11-10'),
    status: 'active',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(MOCK_USERS.admin);

  const login = (role: UserRole) => {
    setCurrentUser(MOCK_USERS[role]);
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
