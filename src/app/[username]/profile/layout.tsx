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
    if (loading) {
      return;
    }

    // If no user is logged in, redirect to the domain-specific login page
    if (!user) {
      router.push(`/${username}/login`);
      return;
    }

    // If the logged-in user is a site owner (has a domain) and they are trying to
    // access a profile page on a different domain, redirect them to their own.
    if (user.domain && user.domain !== username) {
      const newPath = pathname.replace(`/${username}/`, `/${user.domain}/`);
      router.replace(newPath);
    }
    // If the user is a customer (user.domain is null), they are allowed to view the
    // profile page on the current site's domain. No redirect is necessary.
  }, [user, loading, username, router, pathname]);

  const shouldShowSkeleton = loading || !user || (user.domain && user.domain !== username);

  if (shouldShowSkeleton) {
    return (
      <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] gap-8 items-start">
        <div className="hidden md:block space-y-2">
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
