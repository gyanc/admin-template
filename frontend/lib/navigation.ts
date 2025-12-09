import { ReactNode } from 'react';

export interface NavItem {
  label: string;
  href?: string;
  icon?: string;
  children?: NavItem[];
  requiredPermission?: string;
}

export const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    // No requiredPermission - always visible
  },
  {
    label: 'Management',
    icon: 'Settings',
    children: [
      {
        label: 'Users',
        href: '/users',
        requiredPermission: 'users:read',
      },
      {
        label: 'Staff',
        href: '/staff',
        requiredPermission: 'staff:read',
      },
      {
        label: 'Roles & Permissions',
        href: '/roles',
        requiredPermission: 'roles:read',
      },
      {
        label: 'Permissions',
        href: '/permissions',
        requiredPermission: 'permissions:read',
      },
    ],
  },
  {
    label: 'Content',
    icon: 'FileText',
    children: [
      {
        label: 'CMS Pages',
        href: '/cms',
        requiredPermission: 'cms:read',
      },
      {
        label: 'FAQ',
        href: '/faq',
        requiredPermission: 'faq:read',
      },
      {
        label: 'Email Templates',
        href: '/email-templates',
        requiredPermission: 'email_templates:read',
      },
    ],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: 'Sliders',
    // Make settings optional - show if user has permission or if no permission required
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: 'User',
    // Profile is always accessible to logged-in users
  },
];

export const publicRoutes = ['/login', '/staff-login', '/forgot-password'];

export const authRoutes = ['/login', '/staff-login', '/forgot-password', '/reset-password'];
