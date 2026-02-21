'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import SaasHeader from './saas-header';
import SaasFooter from './saas-footer';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const saasAuthPaths = ['/login', '/register', '/get-started'];
  if (saasAuthPaths.some(p => pathname.startsWith(p))) {
    return (
      <div className="flex flex-col min-h-screen">
        <SaasHeader />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
          {children}
        </main>
        <SaasFooter />
      </div>
    );
  }

  // Paths that should have no standard layout (e.g., landing, admin)
  const noLayoutPaths = ['/'];
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
