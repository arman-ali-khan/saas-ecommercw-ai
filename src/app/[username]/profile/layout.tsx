'use client';

import ProfileSidebar from '@/components/profile-sidebar';
import { useAuth } from '@/context/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { username: string };
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (!isLoading && user && user.name !== params.username) {
      // Redirect to the correct user's page, preserving the sub-path
      const newPath = pathname.replace(
        `/${params.username}/`,
        `/${user.name}/`
      );
      router.replace(newPath);
    }
  }, [user, isLoading, params.username, router, pathname]);

  if (isLoading || !user || user.name !== params.username) {
    // You can return a loading skeleton here
    return <div>Loading...</div>;
  }

  return (
    <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] gap-8 items-start">
      <ProfileSidebar username={params.username} />
      <main>{children}</main>
    </div>
  );
}
