import { User, Staff } from './types';

type SessionUser = User | Staff;

/**
 * Check if user has a specific permission
 * @param user - The user/staff object with roles and permissions
 * @param permission - Permission string in format "resource:action" (e.g., "users:read")
 */
export function hasPermission(
  user: SessionUser | null | undefined,
  permission: string
): boolean {
  if (!user) return false;
  
  // If user has no roles, deny access
  if (!user.roles || user.roles.length === 0) return false;

  // Flatten all permissions from all roles
  const userPermissions = user.roles.flatMap((role) => {
    // Handle role as string (just role name) or object with permissions
    if (typeof role === 'string') {
      return [];
    }
    
    if (!role.permissions || !Array.isArray(role.permissions)) return [];
    
    return role.permissions.map((perm) => {
      // Handle permission as object with resource/action or as string
      if (typeof perm === 'string') {
        return perm;
      }
      if (perm && typeof perm === 'object' && 'resource' in perm && 'action' in perm) {
        return `${perm.resource}:${perm.action}`;
      }
      return '';
    }).filter(Boolean);
  });

  return userPermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  user: SessionUser | null | undefined,
  permissions: string[]
): boolean {
  return permissions.some((perm) => hasPermission(user, perm));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  user: SessionUser | null | undefined,
  permissions: string[]
): boolean {
  return permissions.every((perm) => hasPermission(user, perm));
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(
  user: SessionUser | null | undefined
): string[] {
  if (!user || !user.roles) return [];

  return user.roles.flatMap((role) => {
    if (!role.permissions) return [];
    return role.permissions.map(
      (perm) => `${perm.resource}:${perm.action}`
    );
  });
}

/**
 * Check if user has a specific role
 */
export function hasRole(
  user: SessionUser | null | undefined,
  roleName: string
): boolean {
  if (!user || !user.roles) return false;
  return user.roles.some((role) => role.name === roleName);
}
