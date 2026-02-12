'use client';

import ProfileSidebar from '@/components/profile-sidebar';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerAuth } from '@/stores/useCustomerAuth';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { customer: user, _hasHydrated } = useCustomerAuth();
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated) {
      return;
    }

    // If no user is logged in after hydration, redirect to the domain-specific login page
    if (!user) {
      router.push(`/login`);
      return;
    }
  }, [user, _hasHydrated, router]);

  const shouldShowSkeleton = !_hasHydrated;

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

  // Once hydrated, if there is no user, the useEffect will redirect.
  // If there is a user, we can render the children.
  return user ? (
    <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] gap-8 items-start">
      <ProfileSidebar />
      <main>{children}</main>
    </div>
  ) : null; // Render nothing while redirecting
}
