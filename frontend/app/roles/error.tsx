'use client';

import { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface RolesErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RolesError({ error, reset }: RolesErrorProps) {
  useEffect(() => {
    console.error('Roles page error:', error);
  }, [error]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to load roles</h2>
          <p className="text-gray-600 mb-6">
            {error.message || 'An unexpected error occurred while loading roles.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={reset} variant="default">
              Try again
            </Button>
            <Button onClick={() => window.location.href = '/roles'} variant="outline">
              Reload page
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
