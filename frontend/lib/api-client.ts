import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || (() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // Use the same host as the frontend, port 3000
      return `http://${hostname}:3000`;
    }
    return 'http://localhost:3000';
  })(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/refresh`,
          { refreshToken }
        );

        const { data } = response.data as ApiResponse<{ accessToken: string; refreshToken: string }>;
        
        if (data) {
          setAccessToken(data.accessToken);
          if (data.refreshToken) {
            setRefreshToken(data.refreshToken);
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearAuthTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      toast.error('Access denied. You do not have permission to access this resource.');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found.');
    } else if (error.response?.status === 422) {
      // Validation error
      const apiError = error.response.data as ApiResponse;
      if (apiError.errors) {
        const errorMessages = Object.values(apiError.errors).flat();
        toast.error(errorMessages[0] || apiError.message || 'Validation error');
      } else {
        toast.error(apiError.message || 'Validation error');
      }
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.message === 'Network Error') {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// Token management functions
export function setAccessToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
}

export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
}

export function setRefreshToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
}

export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
}

export function clearAuthTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

export default apiClient;
