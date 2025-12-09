'use client';

import { useMemo } from 'react';
import { navigationItems, NavItem } from '../navigation';
import { useAuth } from '../auth-context';
import { hasPermission } from '../permissions';

export type NavigationEntry = NavItem & { children?: NavItem[] };

export function useNavigation(): NavigationEntry[] {
  const { user } = useAuth();

  return useMemo(() => {
    return (
      navigationItems
        .map((item) => {
          if (item.requiredPermission && !hasPermission(user, item.requiredPermission)) {
            return null;
          }

          const children = item.children
            ?.filter((child) => {
              if (!child.requiredPermission) return true;
              return hasPermission(user, child.requiredPermission);
            })
            ?.map((child) => ({ ...child }));

          if (item.children && (!children || children.length === 0)) {
            return null;
          }

          return { ...item, children } as NavigationEntry;
        })
        .filter(Boolean) as NavigationEntry[]
    );
  }, [user]);
}
