'use client';

import { ReactNode } from 'react';
import { useAuth } from './auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { publicRoutes, authRoutes } from './navigation';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If already authenticated, allow access
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated and on auth route, allow (they're trying to login)
  if (authRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // If not authenticated and trying to access protected route, redirect to login
  if (!isAuthenticated && !publicRoutes.includes(pathname)) {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
}
