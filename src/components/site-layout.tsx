
'use client';

import { usePathname } from 'next/navigation';
import SaasHeader from './saas-header';
import SaasFooter from './saas-footer';
import { useState, useEffect } from 'react';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isStorePage, setIsStorePage] = useState(false);

  useEffect(() => {
    // This check is reliable on the client side for determining if we're on a tenant subdomain or custom domain
    const h = window.location.hostname.toLowerCase();
    const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'dokanbd.shop';
    const addonDomain = 'e-bd.shop';
    
    const isRoot = h === rootDomain || h === `www.${rootDomain}` || h === addonDomain || h === `www.${addonDomain}` || h === 'localhost' || h.includes('cloudworkstations.dev');
    
    setIsStorePage(!isRoot);
  }, []);
  
  // Admin and dashboard pages have their own specific layouts
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  // If it's a store page, we defer to the layout in `src/app/[username]/layout.tsx`
  if (isStorePage) {
    return <>{children}</>;
  }
  
  // The root landing page has its own built-in header/footer inside the component
  if (pathname === '/') {
      return <>{children}</>
  }
  
  // For auth pages on the main domain (/login, /register, /get-started)
  const isAuthPage = ['/login', '/register', '/get-started'].some(p => pathname.startsWith(p));

  // All other pages on the main domain get the default SaaS layout.
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
