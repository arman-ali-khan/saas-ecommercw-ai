'use client';

import ProfileSidebar from '@/components/profile-sidebar';
import { useAuth } from '@/stores/auth';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const username = params.username as string;
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/login');
    }
    // If there is a user, and the domain in the URL doesn't match the user's domain,
    // redirect them to their own profile page.
    if (isHydrated && user && user.domain !== username) {
      const newPath = pathname.replace(
        `/${username}/`,
        `/${user.domain}/`
      );
      router.replace(newPath);
    }
  }, [user, isHydrated, username, router, pathname]);

  if (!isHydrated || !user || user.domain !== username) {
    // You can return a loading skeleton here
    return <div>Loading...</div>;
  }

  return (
    <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] gap-8 items-start">
      <ProfileSidebar username={username} />
      <main>{children}</main>
    </div>
  );
}
