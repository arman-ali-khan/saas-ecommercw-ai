
'use client';

import ProfileSidebar from '@/components/profile-sidebar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { Loader2 } from 'lucide-react';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { customer: user, _hasHydrated } = useCustomerAuth();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated && !user) {
      router.replace(`/login`);
    }
  }, [user, _hasHydrated, router]);

  // Show a loader until hydration is complete or if there is no user (before redirect)
  if (!_hasHydrated || !user) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] gap-8 items-start">
      <ProfileSidebar />
      <main>{children}</main>
    </div>
  );
}
