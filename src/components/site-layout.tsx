
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
  
  // Platform Dashboard never gets the SaaS landing layout
  if (pathname.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  /**
   * Determine if we should show the SaaS Platform Layout (Header/Footer).
   * 
   * isStorePage is calculated server-side in RootLayout.
   * On dev/local, we also check path segments to avoid wrapping store pages 
   * that are being accessed via rewritten paths (e.g., localhost:3000/sam).
   */
  const platformSegments = ['about', 'login', 'register', 'get-started', 'leave-a-review', 'p'];
  const firstSegment = pathname.split('/')[1];
  
  // It's a platform path if it's root OR starts with a known platform segment
  const isPlatformPath = pathname === '/' || platformSegments.includes(firstSegment);

  // If identified as a store domain, or a store path on the base domain, skip SaaS layout
  if (isStorePage || !isPlatformPath) {
    return <>{children}</>;
  }
  
  // Main SaaS Platform Layout
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
