'use client';

import ProfileSidebar from '@/components/profile-sidebar';
import { useAuth } from '@/stores/auth';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const username = params.username as string;
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    // If there is a user, and the domain in the URL doesn't match the user's domain,
    // redirect them to their own profile page.
    if (!loading && user && user.domain !== username) {
      const newPath = pathname.replace(
        `/${username}/`,
        `/${user.domain}/`
      );
      router.replace(newPath);
    }
  }, [user, loading, username, router, pathname]);

  if (loading || !user || user.domain !== username) {
    return (
        <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] gap-8 items-start">
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div>
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] gap-8 items-start">
      <ProfileSidebar username={username} />
      <main>{children}</main>
    </div>
  );
}
