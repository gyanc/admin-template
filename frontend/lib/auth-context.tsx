'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient, { getAccessToken, setAccessToken, setRefreshToken, clearAuthTokens, isAuthenticated } from './api-client';
import { User, Staff, AuthResponse, LoginCredentials, ChangePasswordDto } from './types';
import toast from 'react-hot-toast';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStaffUser, setIsStaffUser] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      if (isAuthenticated()) {
        // Fetch user profile
        const response = await apiClient.get<AuthResponse>('/auth/profile');
        const userData = response.data.user || response.data;
        setUser(userData);
        setIsStaffUser('department' in userData);
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      clearAuthTokens();
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (credentials: LoginCredentials, staffLogin = false) => {
    try {
      setLoading(true);
      const endpoint = staffLogin ? '/auth/staff-login' : '/auth/login';
      const response = await apiClient.post<AuthResponse>(endpoint, credentials);
      const data = response.data;

      if (!data) throw new Error('Invalid response');

      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUser(data.user);
      setIsStaffUser(staffLogin);
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
    clearAuthTokens();
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
      const response = await apiClient.get<AuthResponse>('/auth/profile');
      const userData = response.data.user || response.data;
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      clearAuthTokens();
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
