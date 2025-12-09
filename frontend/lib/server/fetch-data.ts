/**
 * Server-side data fetching utilities
 * 
 * Server components call the backend API directly for optimal performance.
 * Client components use BFF routes (app/api/*) for security and consistency.
 * 
 * This approach provides:
 * - Optimal performance (direct backend calls from server)
 * - Type safety with TypeScript
 * - Centralized error handling
 * - Next.js caching strategies (revalidate, tags)
 * - Automatic authentication token handling
 */

import { cookies } from 'next/headers';
import { PaginatedResponse, ListQueryOptions } from '../types';

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ServerFetchOptions {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  searchParams?: Record<string, string | number | boolean | undefined>;
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

/**
 * Server-side fetch utility that automatically includes auth token
 * 
 * Note: Server components call the backend directly for optimal performance.
 * Client components should use the BFF routes (app/api/*) instead.
 */
export async function serverFetch<T>(options: ServerFetchOptions): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    const error = new Error('Unauthorized');
    (error as any).status = 401;
    throw error;
  }

  const { path, method = 'GET', body, searchParams, cache = 'no-store', next } = options;

  // Build query string
  const queryParams = new URLSearchParams();
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  const queryString = queryParams.toString();
  const url = `${API_BASE}${path}${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache,
      next,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP ${response.status}`);
      (error as any).status = response.status;
      (error as any).data = errorData;
      throw error;
    }

    return response.json() as Promise<T>;
  } catch (error: any) {
    // Re-throw if it's already our formatted error
    if (error.status) {
      throw error;
    }
    // Wrap network errors
    const networkError = new Error(error.message || 'Network error');
    (networkError as any).status = 500;
    (networkError as any).data = { message: 'Failed to connect to server' };
    throw networkError;
  }
}

/**
 * Server-side data fetching for paginated resources
 */
export async function fetchPaginatedData<T>(
  resource: string,
  options: ListQueryOptions = {}
): Promise<PaginatedResponse<T>> {
  const searchParams: Record<string, string | number | undefined> = {
    page: String(options.page || 1),
    limit: String(options.limit || 20),
  };

  if (options.search) {
    searchParams.search = options.search;
  }
  if (options.status) {
    searchParams.status = options.status;
  }
  if (options.category) {
    searchParams.category = options.category;
  }
  if (options.triggerType) {
    searchParams.triggerType = options.triggerType;
  }
  if (options.sortBy) {
    searchParams.sortBy = options.sortBy;
  }
  if (options.sortOrder) {
    searchParams.sortOrder = options.sortOrder;
  }

  return serverFetch<PaginatedResponse<T>>({
    path: `/${resource}`,
    searchParams,
    next: {
      revalidate: 60, // Revalidate every 60 seconds
      tags: [resource],
    },
  });
}

/**
 * Server-side fetch for single resource by ID
 */
export async function fetchResourceById<T>(
  resource: string,
  id: string
): Promise<T> {
  return serverFetch<{ data: T } | T>({
    path: `/${resource}/${id}`,
    next: {
      revalidate: 60,
      tags: [resource, `${resource}:${id}`],
    },
  }).then((data) => {
    // Handle both { data: T } and T response formats
    return (data as { data: T }).data || (data as T);
  });
}

/**
 * Invalidate cache for a specific resource
 */
export function revalidateResource(resource: string, id?: string) {
  // This would be used with Next.js revalidateTag or revalidatePath
  // In practice, you'd call: revalidateTag(resource) or revalidatePath(`/${resource}`)
  return { resource, id };
}
