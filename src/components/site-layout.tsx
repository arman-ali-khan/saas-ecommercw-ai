
'use client';

import { usePathname } from 'next/navigation';
import SaasHeader from './saas-header';
import SaasFooter from './saas-footer';
import { useState, useEffect } from 'react';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isStorePage, setIsStorePage] = useState(false);

  useEffect(() => {
    // Determine if we are on a tenant subdomain or custom domain
    const h = window.location.hostname.toLowerCase();
    const platformDomains = ['dokanbd.shop', 'e-bd.shop', 'localhost'];
    
    // Check if the current host is a root platform domain
    const isRoot = platformDomains.some(d => h === d || h === `www.${d}`) || 
                   h.endsWith('.vercel.app') ||
                   h.includes('cloudworkstations.dev') ||
                   h.includes('cluster-aic6jbiihrhmyrqafasatvzbwe');
    
    // Check if we are inside a system dashboard path
    const isSystemPath = pathname.startsWith('/dashboard');

    // It's a store page if it's not the platform root
    setIsStorePage(!isRoot && !isSystemPath);
  }, [pathname]);
  
  // Platform dashboard has its own specific layout
  if (pathname.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  // If it's a store page (subdomain or custom domain), we return only children
  // The /[username]/layout.tsx will handle the store-specific design
  if (isStorePage) {
    return <>{children}</>;
  }
  
  // The root landing page and platform pages (like /about, /login) get the SaaS layout
  const isHomePage = pathname === '/';

  if (isHomePage) {
      return <>{children}</>
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
