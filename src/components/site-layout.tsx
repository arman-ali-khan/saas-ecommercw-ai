'use client';

import { usePathname } from 'next/navigation';
import SaasHeader from './saas-header';
import SaasFooter from './saas-footer';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface SiteLayoutProps {
  children: React.ReactNode;
}

export default function SiteLayout({ children }: SiteLayoutProps) {
  const pathname = usePathname();
  const [isPlatform, setIsPlatform] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const host = window.location.hostname.toLowerCase();
    const base = (process.env.NEXT_PUBLIC_BASE_DOMAIN || 'ihut.shop').toLowerCase();
    
    // Identify platform roots (main domain, preview domain, or local dev)
    const platformRoots = [
        base,
        `www.${base}`,
        'e-bd.shop',
        'www.e-bd.shop',
        'localhost',
        'cloudworkstations.dev'
    ];

    const isPlatformRoot = platformRoots.some(root => host === root || host.endsWith(root) && !host.endsWith('.' + root));
    // Re-verify: it's only a platform root if it's EXACTLY the domain or www.domain
    const isExactRoot = host === base || host === `www.${base}` || host === 'e-bd.shop' || host === 'www.e-bd.shop' || host.includes('localhost') || host.includes('cloudworkstations.dev');

    // Dashboard and admin are never platform-landing layouts
    if (pathname.startsWith('/dashboard') || pathname.includes('/admin')) {
      setIsPlatform(false);
      return;
    }

    const platformSegments = ['about', 'login', 'register', 'get-started', 'leave-a-review', 'p'];
    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0];
    
    // It's a platform path only if we are on a platform root domain
    // AND we are on the home page or a reserved platform segment
    const isPlatformPath = isExactRoot && (pathname === '/' || platformSegments.includes(firstSegment));

    setIsPlatform(isPlatformPath);
  }, [pathname]);

  // Don't render anything until mounted to prevent hydration mismatch with hostname
  if (!mounted) return <main className="flex-grow">{children}</main>;

  // Dashboard or Admin routes: just children
  if (pathname.startsWith('/dashboard') || pathname.includes('/admin')) {
    return <>{children}</>;
  }

  // If it's a store page, return children directly (the store layout will handle its own header/footer)
  if (!isPlatform) {
    return <>{children}</>;
  }
  
  const isLandingPage = pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
        <SaasHeader lang="bn" />
        <main className={cn(
            "flex-grow",
            !isLandingPage ? "pt-32 pb-8 container mx-auto px-4 sm:px-6 lg:px-8" : "pt-0"
        )}>
          {children}
        </main>
        <SaasFooter lang="bn" />
    </div>
  );
}
