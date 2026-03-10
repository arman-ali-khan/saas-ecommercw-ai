
'use client';

import { usePathname } from 'next/navigation';
import SaasHeader from './saas-header';
import SaasFooter from './saas-footer';

interface SiteLayoutProps {
  children: React.ReactNode;
  isStorePage: boolean;
}

export default function SiteLayout({ children, isStorePage }: SiteLayoutProps) {
  const pathname = usePathname();
  
  // Platform Admin Dashboard gets no SaaS landing layout
  if (pathname.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  // If identified as a store domain, return children directly.
  // The store-specific header/footer will be handled in src/app/[username]/layout.tsx
  if (isStorePage) {
    return <>{children}</>;
  }
  
  // Main SaaS Landing Page & Platform-level Pages
  return (
    <div className="flex flex-col min-h-screen">
        <SaasHeader />
        <main className="flex-grow container mx-auto px-1 sm:px-6 lg:px-8 py-8 pt-32">
          {children}
        </main>
        <SaasFooter />
    </div>
  );
}
