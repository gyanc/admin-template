import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { ProfileClient } from './profile-client';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  return <ProfileClient initialUser={session.user} />;
}
