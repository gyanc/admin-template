import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import EmailTemplatesClient from './email-templates-client';
import { fetchPaginatedData } from '@/lib/server/fetch-data';
import { EmailTemplate } from '@/lib/types';
import { Suspense } from 'react';
import EmailTemplatesLoading from './loading';

export const revalidate = 60; // Revalidate every 60 seconds

interface EmailTemplatesPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    triggerType?: string;
  }>;
}

export default async function EmailTemplatesPage({ searchParams }: EmailTemplatesPageProps) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const search = params.search || '';
  const triggerFilter = params.triggerType || 'all';

  return (
    <Suspense fallback={<EmailTemplatesLoading />}>
      <EmailTemplatesPageContent
        page={page}
        search={search}
        triggerFilter={triggerFilter}
      />
    </Suspense>
  );
}

async function EmailTemplatesPageContent({
  page,
  search,
  triggerFilter,
}: {
  page: number;
  search: string;
  triggerFilter: string;
}) {
  let initialData;

  try {
    initialData = await fetchPaginatedData<EmailTemplate>('email-templates', {
      page,
      limit: 20,
      search: search || undefined,
      triggerType: triggerFilter !== 'all' ? triggerFilter : undefined,
    });
  } catch (error) {
    console.error('Failed to fetch email templates:', error);
  }

  return (
    <EmailTemplatesClient
      initialData={initialData}
      initialPage={page}
      initialSearch={search}
      initialTriggerFilter={triggerFilter}
    />
  );
}
