import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { UsersClient } from './users-client';
import { fetchPaginatedData } from '@/lib/server/fetch-data';
import { User } from '@/lib/types';
import { Suspense } from 'react';
import UsersLoading from './loading';

export const revalidate = 60; // Revalidate every 60 seconds

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const search = params.search || '';
  const statusFilter = params.status || 'all';

  return (
    <Suspense fallback={<UsersLoading />}>
      <UsersPageContent
        page={page}
        search={search}
        statusFilter={statusFilter}
      />
    </Suspense>
  );
}

async function UsersPageContent({
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
    initialData = await fetchPaginatedData<User>('users', {
          page,
          limit: 20,
      search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
    });
    } catch (error) {
    // If fetch fails, still render client component - it will handle error state
      console.error('Failed to fetch users:', error);
  }

  return (
    <UsersClient
      initialData={initialData}
      initialPage={page}
      initialSearch={search}
      initialStatusFilter={statusFilter}
    />
  );
}
