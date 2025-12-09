'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItem } from '@/lib/navigation';
import { useState, useEffect } from 'react';
import * as React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/lib/hooks/use-navigation';

function NavItemComponent({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;

  // Children are already filtered by permissions in useNavigation
  const visibleChildren = item.children || [];

  // Check if any child is active
  const hasActiveChild = visibleChildren.some((child) => pathname === child.href);

  // Initialize state: open if has active child, otherwise closed
  const [isOpen, setIsOpen] = useState(hasActiveChild || false);
  
  // Update isOpen when hasActiveChild changes (e.g., when navigating to a child page)
  useEffect(() => {
    if (hasActiveChild) {
      setIsOpen(true);
    }
  }, [hasActiveChild, pathname]);

  // Map icon names to actual components
  const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
    Home: Icons.Home,
    Users: Icons.Users,
    Settings: Icons.Settings,
    FileText: Icons.FileText,
    Mail: Icons.Mail,
    HelpCircle: Icons.HelpCircle,
    LayoutDashboard: Icons.LayoutDashboard,
    Shield: Icons.Shield,
    Sliders: Icons.Sliders,
    User: Icons.User,
  };

  const IconComponent = item.icon ? iconMap[item.icon] : null;

  if (hasChildren) {
    
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm',
            isOpen || hasActiveChild
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            {IconComponent && <IconComponent className="w-5 h-5 flex-shrink-0" />}
            <span className="truncate">{item.label}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 transition-transform flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 transition-transform flex-shrink-0" />
          )}
        </button>

        {(isOpen || hasActiveChild) && (
          <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
            {visibleChildren.map((child) => {
              const childActive = pathname === child.href;
              return (
                <Link
                  key={child.href}
                  href={child.href || '#'}
                  onClick={onNavigate}
                  className={cn(
                    'block px-4 py-2.5 rounded-lg text-sm transition-all duration-200',
                    childActive
                      ? 'bg-blue-100 text-blue-700 font-medium shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href || '#'}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm',
        isActive
          ? 'bg-blue-100 text-blue-700 shadow-sm'
          : 'text-gray-700 hover:bg-gray-100'
      )}
    >
      {IconComponent && <IconComponent className="w-5 h-5 flex-shrink-0" />}
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const navigation = useNavigation();

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      {/* Navigation items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => (
          <NavItemComponent
            key={item.label}
            item={item}
            isActive={pathname === item.href}
            onNavigate={onClose}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="text-xs text-gray-500">
          <p className="font-semibold text-gray-700 mb-1">Admin Panel v1.0</p>
          <p className="text-xs">© 2025 All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
