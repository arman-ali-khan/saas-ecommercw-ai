
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
  
  // Force simple layout for platform dashboard
  if (pathname.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  // If we are on a store domain (subdomain or custom), return only children.
  // The [username]/layout.tsx will provide the store-specific header/footer.
  if (isStorePage) {
    return <>{children}</>;
  }
  
  // Platform root pages (Landing, About, Login etc) get the SaaS layout
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
