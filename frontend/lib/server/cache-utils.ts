/**
 * Cache management utilities for Next.js
 * Provides helpers for cache invalidation and revalidation
 */

import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Invalidate cache for a specific resource
 */
export async function invalidateResource(resource: string, id?: string) {
  // Invalidate by tag
  revalidateTag(resource);
  
  // If specific ID provided, invalidate that too
  if (id) {
    revalidateTag(`${resource}:${id}`);
  }
  
  // Also revalidate the path
  revalidatePath(`/${resource}`);
  if (id) {
    revalidatePath(`/${resource}/${id}`);
  }
}

/**
 * Invalidate cache for multiple resources
 */
export async function invalidateResources(resources: string[]) {
  resources.forEach(resource => {
    revalidateTag(resource);
    revalidatePath(`/${resource}`);
  });
}

/**
 * Cache tags for different resource types
 */
export const CACHE_TAGS = {
  users: 'users',
  staff: 'staff',
  roles: 'roles',
  cms: 'cms',
  faq: 'faq',
  emailTemplates: 'email-templates',
  dashboard: 'dashboard',
} as const;

/**
 * Get cache tag for a specific resource and ID
 */
export function getCacheTag(resource: string, id?: string): string {
  return id ? `${resource}:${id}` : resource;
}
