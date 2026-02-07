'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Paths that should have no standard layout (e.g., landing, auth, admin)
  const noLayoutPaths = ['/', '/login', '/register'];
  if (pathname.startsWith('/admin') || noLayoutPaths.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
