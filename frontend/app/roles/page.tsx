import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import RolesClient from './roles-client';
import { fetchPaginatedData } from '@/lib/server/fetch-data';
import { Role } from '@/lib/types';
import { Suspense } from 'react';
import RolesLoading from './loading';

export const revalidate = 60; // Revalidate every 60 seconds

interface RolesPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function RolesPage({ searchParams }: RolesPageProps) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const search = params.search || '';
  const statusFilter = params.status || 'all';

  return (
    <Suspense fallback={<RolesLoading />}>
      <RolesPageContent
        page={page}
        search={search}
        statusFilter={statusFilter}
      />
    </Suspense>
  );
}

async function RolesPageContent({
  page,
  search,
  statusFilter,
}: {
  page: number;
  search: string;
  statusFilter: string;
}) {
  let initialData;

  try {
    initialData = await fetchPaginatedData<Role>('roles', {
          page,
          limit: 20,
      search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
      });
    } catch (error) {
      console.error('Failed to fetch roles:', error);
  }

  return (
    <RolesClient
      initialData={initialData}
      initialPage={page}
      initialSearch={search}
      initialStatusFilter={statusFilter}
    />
  );
}
