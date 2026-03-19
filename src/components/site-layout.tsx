
'use client';

import { usePathname } from 'next/navigation';
import SaasHeader from './saas-header';
import SaasFooter from './saas-footer';
import { cn } from '@/lib/utils';

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

  /**
   * Determine if we are on a platform-level page (Landing, About, Login, etc.)
   * or a tenant-level page (Storefront).
   * 
   * On production with subdomains, the isStorePage prop (calculated server-side) 
   * correctly identifies store domains.
   * 
   * On dev environments (localhost or cloud workstations), the domain is 
   * often considered "platformRoot" by default, so we must also check the 
   * pathname segments to see if we are visiting a store path (e.g., /sam).
   */
  const platformSegments = ['about', 'login', 'register', 'get-started', 'leave-a-review', 'p'];
  const firstSegment = pathname.split('/')[1];
  const isPlatformPath = pathname === '/' || platformSegments.includes(firstSegment);

  // If identified as a store domain (production), 
  // or if we are on a path that belongs to a store (dev/rewritten),
  // we return children directly because [username]/layout.tsx handles its own header/footer.
  if (isStorePage || !isPlatformPath) {
    return <>{children}</>;
  }
  
  // Main SaaS Landing Page & Platform-level Pages
  const isLandingPage = pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
        <SaasHeader />
        <main className={cn(
            "flex-grow pt-32 pb-8",
            !isLandingPage && "container mx-auto px-4 sm:px-6 lg:px-8"
        )}>
          {children}
        </main>
        <SaasFooter />
    </div>
  );
}
