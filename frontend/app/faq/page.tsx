import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import FAQClient from './faq-client';
import { fetchPaginatedData } from '@/lib/server/fetch-data';
import { Faq } from '@/lib/types';
import { Suspense } from 'react';
import FAQLoading from './loading';

export const revalidate = 60; // Revalidate every 60 seconds

interface FAQPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    category?: string;
  }>;
}

export default async function FAQPage({ searchParams }: FAQPageProps) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const search = params.search || '';
  const statusFilter = params.status || 'all';
  const categoryFilter = params.category || 'all';

  return (
    <Suspense fallback={<FAQLoading />}>
      <FAQPageContent
        page={page}
        search={search}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
      />
    </Suspense>
  );
}

async function FAQPageContent({
  page,
  search,
  statusFilter,
  categoryFilter,
}: {
  page: number;
  search: string;
  statusFilter: string;
  categoryFilter: string;
}) {
  let initialData;

  try {
    initialData = await fetchPaginatedData<Faq>('faq', {
      page,
      limit: 20,
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
    });
  } catch (error) {
    console.error('Failed to fetch FAQs:', error);
  }

  return (
    <FAQClient
      initialData={initialData}
      initialPage={page}
      initialSearch={search}
      initialStatusFilter={statusFilter}
      initialCategoryFilter={categoryFilter}
    />
  );
}
