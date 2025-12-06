'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationItems, NavItem } from '@/lib/navigation';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import * as Icons from 'lucide-react';

function NavItemComponent({ item, isActive, onNavigate }: { item: NavItem; isActive: boolean; onNavigate?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;

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
  };

  const IconComponent = item.icon ? iconMap[item.icon] : null;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors font-medium ${
            isOpen ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {IconComponent && <IconComponent className="w-5 h-5 flex-shrink-0" />}
            <span className="truncate">{item.label}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children?.map((child) => {
              const childActive = pathname === child.href;
              return (
                <Link
                  key={child.href}
                  href={child.href || '#'}
                  onClick={onNavigate}
                  className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
                    childActive
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
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
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors font-medium ${
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
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

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      {/* Navigation items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigationItems.map((item) => (
          <NavItemComponent
            key={item.label}
            item={item}
            isActive={pathname === item.href}
            onNavigate={onClose}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 text-xs text-gray-500">
        <p className="font-semibold">Admin Panel v1.0</p>
        <p className="mt-1">© 2025 All rights reserved</p>
      </div>
    </div>
  );
}
