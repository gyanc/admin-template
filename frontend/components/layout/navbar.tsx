'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ChevronDown, LogOut, User, Menu } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Navbar({ sidebarOpen, setSidebarOpen }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <nav className="h-[60px] border-b border-neutral-200 bg-white sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-neutral-600" />
        </button>
        
        {/* Logo */}
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex-shrink-0">
          <span className="text-white font-bold text-sm">AP</span>
        </div>
        <h1 className="text-lg font-semibold text-neutral-900 hidden sm:block">Admin Panel</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors">
              <div className="flex items-center justify-center w-8 h-8 bg-neutral-200 rounded-full flex-shrink-0">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600" />
              </div>
              <div className="text-sm text-left hidden sm:block">
                <p className="font-medium text-neutral-900 truncate">
                  {user?.firstName}
                </p>
                <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-neutral-600 hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <Link
              href="/settings"
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 cursor-pointer w-full rounded"
            >
              <User className="w-4 h-4" />
              Settings
            </Link>
            <DropdownMenuSeparator />
            <button
              onClick={logout}
              className="w-full text-left"
            >
              <DropdownMenuItem className="flex items-center gap-2 text-sm text-red-600 cursor-pointer">
                <LogOut className="w-4 h-4" />
                Logout
              </DropdownMenuItem>
            </button>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
