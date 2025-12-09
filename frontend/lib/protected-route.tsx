'use client';

import { ReactNode, useEffect, useMemo } from 'react';
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

  const publicEntryPoints = useMemo(() => new Set([...publicRoutes, ...authRoutes]), []);
  const isPublic = publicEntryPoints.has(pathname);

  useEffect(() => {
    if (loading || isAuthenticated || isPublic) return;

    // Preserve intent so user can be redirected post-login
    const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
    router.replace(`/login${next}`);
  }, [isAuthenticated, isPublic, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated && !isPublic) {
    return null;
  }

  return <>{children}</>;
}
