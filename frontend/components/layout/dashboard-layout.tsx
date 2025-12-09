'use client';

import { ReactNode, useState } from 'react';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { usePathname } from 'next/navigation';
import { authRoutes } from '@/lib/navigation';
import { ProtectedRoute } from '@/lib/protected-route';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const isAuthPage = authRoutes.includes(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50 flex-col">
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex flex-1 overflow-hidden">
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar */}
          <div
            className={`fixed left-0 top-[60px] bottom-0 w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out lg:relative lg:top-0 lg:transform-none ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
          
          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
