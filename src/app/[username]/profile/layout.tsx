
'use client';

import ProfileSidebar from '@/components/profile-sidebar';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { Loader2 } from 'lucide-react';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { customer: user, _hasHydrated } = useCustomerAuth();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  useEffect(() => {
    if (!_hasHydrated) {
      return;
    }

    // If no user is logged in after hydration, redirect to the domain-specific login page
    if (!user) {
      router.push(`/login`);
      return;
    }
  }, [user, _hasHydrated, router, username]);

  // Show a full-screen loader while we check auth state.
  if (!_hasHydrated || !user) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // After hydration, if user is not logged in, they will be redirected by the useEffect.
  // If a user exists, render the layout.
  return (
    <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] gap-8 items-start">
      <ProfileSidebar />
      <main>{children}</main>
    </div>
  );
}
