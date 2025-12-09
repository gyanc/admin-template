import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import CMSClient from './cms-client';
import { fetchPaginatedData } from '@/lib/server/fetch-data';
import { CmsPage } from '@/lib/types';
import { Suspense } from 'react';
import CMSLoading from './loading';

export const revalidate = 60; // Revalidate every 60 seconds

interface CMSPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function CMSPage({ searchParams }: CMSPageProps) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const search = params.search || '';
  const statusFilter = params.status || 'all';

  return (
    <Suspense fallback={<CMSLoading />}>
      <CMSPageContent
        page={page}
        search={search}
        statusFilter={statusFilter}
      />
    </Suspense>
  );
}

async function CMSPageContent({
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
    initialData = await fetchPaginatedData<CmsPage>('cms', {
          page,
          limit: 20,
      search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
    });
    } catch (error) {
      console.error('Failed to fetch CMS pages:', error);
  }

  return (
    <CMSClient
      initialData={initialData}
      initialPage={page}
      initialSearch={search}
      initialStatusFilter={statusFilter}
    />
  );
}
