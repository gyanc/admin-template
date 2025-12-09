import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import StaffClient from './staff-client';
import { fetchPaginatedData } from '@/lib/server/fetch-data';
import { Staff } from '@/lib/types';
import { Suspense } from 'react';
import StaffLoading from './loading';

export const revalidate = 60; // Revalidate every 60 seconds

interface StaffPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    department?: string;
  }>;
}

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const search = params.search || '';
  const statusFilter = params.status || 'all';
  const departmentFilter = params.department || 'all';

  return (
    <Suspense fallback={<StaffLoading />}>
      <StaffPageContent
        page={page}
        search={search}
        statusFilter={statusFilter}
        departmentFilter={departmentFilter}
      />
    </Suspense>
  );
}

async function StaffPageContent({
  page,
  search,
  statusFilter,
  departmentFilter,
}: {
  page: number;
  search: string;
  statusFilter: string;
  departmentFilter: string;
}) {
  let initialData;

  try {
    initialData = await fetchPaginatedData<Staff>('staff', {
      page,
      limit: 20,
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      department: departmentFilter !== 'all' ? departmentFilter : undefined,
    });
  } catch (error) {
    console.error('Failed to fetch staff:', error);
  }

  return (
    <StaffClient
      initialData={initialData}
      initialPage={page}
      initialSearch={search}
      initialStatusFilter={statusFilter}
      initialDepartmentFilter={departmentFilter}
    />
  );
}
