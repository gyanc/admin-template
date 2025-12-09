import { redirect } from "next/navigation";
import { User, Staff } from "@/lib/types";
import { getSession } from "@/lib/auth/session";
import { DashboardClient, DashboardStats } from "./dashboard-client";
import { format, subDays } from "date-fns";
import { fetchPaginatedData } from "@/lib/server/fetch-data";
import { Suspense } from "react";
import DashboardLoading from "./loading";

export const revalidate = 60; // Revalidate every 60 seconds

async function DashboardStatsLoader() {
  // Fetch dashboard stats with error handling using server-side utilities
  let usersRes: { data: { meta: { total: number } } } = { data: { meta: { total: 0 } } };
  let staffRes: { data: { meta: { total: number } } } = { data: { meta: { total: 0 } } };
  let cmsRes: { data: { meta: { total: number } } } = { data: { meta: { total: 0 } } };
  let faqRes: { data: { meta: { total: number } } } = { data: { meta: { total: 0 } } };
  
  try {
    const results = await Promise.allSettled([
      fetchPaginatedData('users', { limit: 1 }),
      fetchPaginatedData('staff', { limit: 1 }),
      fetchPaginatedData('cms', { limit: 1 }),
      fetchPaginatedData('faq', { limit: 1 }),
    ]);
    
    // Extract data from settled promises
    if (results[0].status === 'fulfilled') {
      usersRes = results[0].value as any;
}
    if (results[1].status === 'fulfilled') {
      staffRes = results[1].value as any;
    }
    if (results[2].status === 'fulfilled') {
      cmsRes = results[2].value as any;
    }
    if (results[3].status === 'fulfilled') {
      faqRes = results[3].value as any;
    }
  } catch (error) {
    // If all requests fail, use default values
    console.error('Failed to fetch dashboard stats:', error);
  }

  return { usersRes, staffRes, cmsRes, faqRes };
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent user={session.user as User | Staff} />
    </Suspense>
  );
}

async function DashboardContent({ user }: { user: User | Staff }) {
  const { usersRes, staffRes, cmsRes, faqRes } = await DashboardStatsLoader();

      const userGrowth = Array.from({ length: 7 }, (_, i) => ({
    date: format(subDays(new Date(), 6 - i), "MMM dd"),
        users: Math.floor(Math.random() * 50) + 100,
      }));

      const pageViews = Array.from({ length: 7 }, (_, i) => ({
    date: format(subDays(new Date(), 6 - i), "MMM dd"),
        views: Math.floor(Math.random() * 200) + 500,
      }));

  const recentActivity = [
        {
      id: "1",
      type: "user" as const,
      action: "created",
      description: "New user registered",
          timestamp: new Date().toISOString(),
      user: "John Doe",
        },
        {
      id: "2",
      type: "cms" as const,
      action: "published",
          description: 'CMS page "About Us" published',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
      user: "Jane Smith",
        },
        {
      id: "3",
      type: "staff" as const,
      action: "created",
      description: "New staff member added",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
      user: "Admin",
        },
      ];

  const stats: DashboardStats = {
    totalUsers: usersRes.data?.meta?.total || 0,
    totalStaff: staffRes.data?.meta?.total || 0,
    totalPages: cmsRes.data?.meta?.total || 0,
    totalFaqs: faqRes.data?.meta?.total || 0,
    activeUsers: Math.floor((usersRes.data?.meta?.total || 0) * 0.75),
        recentActivity,
        userGrowth,
        pageViews,
  };

  return <DashboardClient user={user} stats={stats} />;
}
