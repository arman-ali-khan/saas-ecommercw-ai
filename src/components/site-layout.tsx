
'use client';

import { usePathname } from 'next/navigation';
import SaasHeader from './saas-header';
import SaasFooter from './saas-footer';
import { useState, useEffect } from 'react';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isStorePage, setIsStorePage] = useState(false);

  useEffect(() => {
    // This check determines if we are on a tenant subdomain or custom domain
    const h = window.location.hostname.toLowerCase();
    const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'dokanbd.shop';
    const addonDomain = 'e-bd.shop';
    
    // Check if the current host is a root platform domain or development environment
    const isRoot = h === rootDomain || 
                   h === `www.${rootDomain}` || 
                   h === addonDomain || 
                   h === `www.${addonDomain}` || 
                   h === 'localhost' || 
                   h.endsWith('.vercel.app') ||
                   h.includes('cloudworkstations.dev') ||
                   h.includes('cluster-aic6jbiihrhmyrqafasatvzbwe');
    
    // Check if we are inside a reserved system path but on a potential store domain
    // This handles cases where the middleware rewrote the path but we're in admin/dashboard
    const isSystemPath = pathname.startsWith('/admin') || pathname.startsWith('/dashboard');

    // If it's not a root platform domain, it's a store page
    setIsStorePage(!isRoot && !isSystemPath);
  }, [pathname]);
  
  // Admin and dashboard pages have their own specific layouts
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  // If it's a store page, we defer to the layout in `src/app/[username]/layout.tsx`
  // We return only children to avoid wrapping store pages in SaaS headers/footers
  if (isStorePage) {
    return <>{children}</>;
  }
  
  // The root landing page and other platform pages get the default SaaS layout
  const isHomePage = pathname === '/';
  const isAuthPage = ['/login', '/register', '/get-started'].some(p => pathname.startsWith(p));

  if (isHomePage) {
      return <>{children}</>
  }

  return (
    <div className="flex flex-col min-h-screen">
        <SaasHeader />
        <main className={`flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pb-16 ${isAuthPage ? 'pt-32' : 'py-8'}`}>
          {children}
        </main>
        <SaasFooter />
    </div>
  );
}
