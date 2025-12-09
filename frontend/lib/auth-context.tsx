'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from './api-client';
import { User, Staff, AuthResponse, LoginCredentials, ChangePasswordDto } from './types';
import toast from 'react-hot-toast';
import { usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | Staff | null;
  loading: boolean;
  isAuthenticated: boolean;
  isStaff: boolean;
  login: (credentials: LoginCredentials, isStaff?: boolean) => Promise<void>;
  logout: () => void;
  changePassword: (data: ChangePasswordDto) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const PUBLIC_ROUTES = ['/login', '/staff-login', '/forgot-password', '/reset-password'];

function setBrowserCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires}; Path=/`;
}

function clearBrowserCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Max-Age=0; Path=/`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStaffUser, setIsStaffUser] = useState(false);
  const pathname = usePathname();

  // Initialize auth on mount only if not on a public auth route
  useEffect(() => {
    // Skip profile initialization on public auth pages to avoid unnecessary API calls
    if (!PUBLIC_ROUTES.includes(pathname)) {
      initializeAuth();
    } else {
      // On public routes, still set loading to false after a tick
      setLoading(false);
    }
  }, [pathname]);

  const initializeAuth = async () => {
    try {
      const response = await apiClient.get<AuthResponse>('/auth/profile', {
        cache: 'no-store',
      });
      
      // Handle different response structures
      let userData: User | Staff | null = null;
      
      if (response.data) {
        // Check if response.data has a user property
        if ('user' in response.data && response.data.user) {
          userData = response.data.user as User | Staff;
        } else {
          // Response might be the user object directly
          userData = response.data as unknown as User | Staff;
        }
      }
      
      if (userData) {
        // Ensure roles array exists (backend might return roles as array of strings or objects)
        if (!userData.roles) {
          userData.roles = [];
        }
        
        setUser(userData);
        setIsStaffUser('department' in userData);
      }
    } catch (error: any) {
      console.error('Failed to initialize auth:', error);
      // If 401, clear auth state
      if (error.response?.status === 401) {
        clearBrowserCookie('access_token');
        clearBrowserCookie('refresh_token');
        setUser(null);
        setIsStaffUser(false);
      }
      // Don't set user to null on other errors - might be a temporary network issue
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (credentials: LoginCredentials, staffLogin = false) => {
    try {
      setLoading(true);
      const endpoint = staffLogin ? '/auth/staff-login' : '/auth/login';
      const response = await apiClient.post<AuthResponse>(endpoint, credentials, {
        auth: false,
        cache: 'no-store',
      });
      const data = response.data;

      if (!data) throw new Error('Invalid response');

      // Persist tokens in cookies so middleware + SSR can see them
      if (data.accessToken) {
        setBrowserCookie(ACCESS_COOKIE, data.accessToken);
      }
      if (data.refreshToken) {
        setBrowserCookie(REFRESH_COOKIE, data.refreshToken);
      }

      setUser(data.user);
      setIsStaffUser(staffLogin || 'department' in data.user);
      toast.success('Login successful');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearBrowserCookie(ACCESS_COOKIE);
    clearBrowserCookie(REFRESH_COOKIE);
    setUser(null);
    setIsStaffUser(false);
    toast.success('Logged out successfully');
  }, []);

  const changePassword = useCallback(async (data: ChangePasswordDto) => {
    try {
      setLoading(true);
      await apiClient.post('/auth/change-password', data);
      toast.success('Password changed successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiClient.get<AuthResponse>('/auth/profile', {
        cache: 'no-store',
      });
      const userData =
        response.data?.user ||
        ((response.data as unknown) as User | Staff | null);
      if (userData) {
      setUser(userData);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  }, [logout]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isStaff: isStaffUser,
    login,
    logout,
    changePassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
