'use client';

import ProfileSidebar from '@/components/profile-sidebar';
import { useAuth } from '@/context/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfileLayout({
  children,
  params: { username },
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
    // If there is a user, and the domain in the URL doesn't match the user's domain,
    // redirect them to their own profile page.
    if (!isLoading && user && user.domain !== username) {
      const newPath = pathname.replace(
        `/${username}/`,
        `/${user.domain}/`
      );
      router.replace(newPath);
    }
  }, [user, isLoading, username, router, pathname]);

  if (isLoading || !user || user.domain !== username) {
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
