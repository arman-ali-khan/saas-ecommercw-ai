
'use client';

import { usePathname } from 'next/navigation';
import SaasHeader from './saas-header';
import SaasFooter from './saas-footer';
import { cn } from '@/lib/utils';

interface SiteLayoutProps {
  children: React.ReactNode;
}

export default function SiteLayout({ children }: SiteLayoutProps) {
  const pathname = usePathname();
  
  // 1. Never wrap the dashboard or admin areas with SaaS layout
  if (pathname.startsWith('/dashboard') || pathname.includes('/admin')) {
    return <>{children}</>;
  }

  // 2. Identify platform paths (Landing, About, Login, etc.)
  // These are paths that belong to the main SaaS platform, NOT a tenant store.
  // Note: tenant stores have paths like /username/products, /username/, etc.
  const platformSegments = ['about', 'login', 'register', 'get-started', 'leave-a-review', 'p'];
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  // It's a platform path if it's the root OR it starts with a reserved platform segment
  // IMPORTANT: Stores always have the username as the first segment due to middleware rewrite.
  const isPlatformPath = pathname === '/' || platformSegments.includes(firstSegment);

  // If it's a store page (first segment is a username, not in platformSegments), 
  // we return children directly. The store's own layout (/[username]/layout.tsx) 
  // handles the store-specific header/footer.
  if (!isPlatformPath) {
    return <>{children}</>;
  }
  
  const isLandingPage = pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
        <SaasHeader />
        <main className={cn(
            "flex-grow",
            // Padding for sub-pages, landing page handles its own inner layout
            !isLandingPage ? "pt-32 pb-8 container mx-auto px-4 sm:px-6 lg:px-8" : "pt-0"
        )}>
          {children}
        </main>
        <SaasFooter />
    </div>
  );
}
