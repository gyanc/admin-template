'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ChevronDown, LogOut, User, Menu, Search, Bell, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Navbar({ sidebarOpen, setSidebarOpen }: NavbarProps) {
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.trim() || 'AP';

  return (
    <nav className="h-16 border-b border-gray-200 bg-white sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4 flex-1">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-sm">AP</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">Admin Panel</h1>
        </Link>

        {/* Search Bar - Modern CRM Style */}
        <div className="hidden md:flex flex-1 max-w-md ml-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search users, pages, settings..."
              className="pl-10 pr-4 w-full"
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            />
            {searchOpen && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
                <p className="text-xs text-gray-500 px-2 py-1">Quick search coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search button for mobile */}
        <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Search className="w-5 h-5 text-gray-600" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex-shrink-0 text-white text-sm font-semibold">
                {initials}
              </div>
              <div className="text-sm text-left hidden sm:block">
                <p className="font-medium text-gray-900 truncate max-w-[120px]">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-[120px]">{user?.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600 hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <Link href="/settings">
              <DropdownMenuItem className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </DropdownMenuItem>
            </Link>
            <Link href="/profile">
              <DropdownMenuItem className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <button
              onClick={logout}
              className="w-full text-left"
            >
              <DropdownMenuItem className="flex items-center gap-2 text-red-600 hover:text-red-700">
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
