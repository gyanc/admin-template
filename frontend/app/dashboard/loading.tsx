import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
