
'use client';

import ProfileSidebar from '@/components/profile-sidebar';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { Loader2 } from 'lucide-react';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { customer: user, loading } = useCustomerAuth();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.push(`/login`);
      return;
    }
  }, [user, loading, router, username]);

  if (loading || !user) {
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
