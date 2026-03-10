
'use client';

import { usePathname } from 'next/navigation';
import SaasHeader from './saas-header';
import SaasFooter from './saas-footer';
import { useState, useEffect } from 'react';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isStorePage, setIsStorePage] = useState(false);

  useEffect(() => {
    const h = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
    const baseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN || 'e-bd.shop').toLowerCase();
    
    // Platform roots
    const platformRootDomains = [baseDomain, 'localhost'];
    
    const isPlatformRoot = platformRootDomains.some(d => h === d || h === `www.${d}`) || 
                          h.endsWith('.vercel.app') ||
                          h.includes('cloudworkstations.dev');
    
    // It's a store page if it's NOT the platform root domain
    const isSystemPath = pathname.startsWith('/dashboard');
    setIsStorePage(!isPlatformRoot && !isSystemPath);
  }, [pathname]);
  
  // Platform dashboard layout
  if (pathname.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  // Individual store pages (subdomain or custom domain)
  if (isStorePage) {
    return <>{children}</>;
  }
  
  // Platform root pages (Landing, About, Login etc)
  return (
    <div className="flex flex-col min-h-screen">
        <SaasHeader />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-32">
          {children}
        </main>
        <SaasFooter />
    </div>
  );
}
