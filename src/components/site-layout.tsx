
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
  
  // 1. Never wrap the dashboard
  if (pathname.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  // 2. Identify platform paths (Landing, About, Login, etc.)
  const platformSegments = ['about', 'login', 'register', 'get-started', 'leave-a-review', 'p'];
  const firstSegment = pathname.split('/')[1];
  
  const isPlatformPath = pathname === '/' || platformSegments.includes(firstSegment);

  // 3. Conditional Rendering
  // If it's a store page (detected via domain or explicit subpath), don't show SaaS layout.
  // We prioritize the path check for platform segments.
  // CRUCIAL: Always show SaaS layout on the root path (/) of the platform.
  if (!isPlatformPath || (isStorePage && pathname !== '/')) {
    return <>{children}</>;
  }
  
  const isLandingPage = pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
        <SaasHeader />
        <main className={cn(
            "flex-grow",
            // Padding for sub-pages, landing page handles its own layout
            !isLandingPage ? "pt-32 pb-8 container mx-auto px-4 sm:px-6 lg:px-8" : "pt-0"
        )}>
          {children}
        </main>
        <SaasFooter />
    </div>
  );
}
