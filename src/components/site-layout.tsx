
'use client';

import { usePathname } from 'next/navigation';
import SaasHeader from './saas-header';
import SaasFooter from './saas-footer';
import { useState, useEffect } from 'react';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isStorePage, setIsStorePage] = useState(false);

  useEffect(() => {
    // Detect if we are on a tenant subdomain or custom domain
    const h = window.location.hostname.toLowerCase();
    const platformRootDomains = ['dokanbd.shop', 'e-bd.shop', 'localhost'];
    
    // It's a platform root if it matches exactly or is a dev environment
    const isPlatformRoot = platformRootDomains.some(d => h === d || h === `www.${d}`) || 
                          h.endsWith('.vercel.app') ||
                          h.includes('cloudworkstations.dev') ||
                          h.includes('cluster-aic6jbiihrhmyrqafasatvzbwe');
    
    // It's a store page if it's NOT the platform root AND not a system dashboard path
    const isSystemPath = pathname.startsWith('/dashboard');
    setIsStorePage(!isPlatformRoot && !isSystemPath);
  }, [pathname]);
  
  // Platform dashboard has its own fixed layout
  if (pathname.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  // If it's a store page, we only return children. 
  // Store-specific layout is handled in src/app/[username]/layout.tsx
  if (isStorePage) {
    return <>{children}</>;
  }
  
  // Platform homepage and root pages (About, Login etc) get the SaaS layout
  const isHomePage = pathname === '/';
  if (isHomePage) {
      return <>{children}</>;
  }

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
