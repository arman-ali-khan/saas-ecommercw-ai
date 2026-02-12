'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import SaasHeader from './saas-header';
import SaasFooter from './saas-footer';
import FixedCartButton from '@/components/fixed-cart-button';
import FloatingChatButton from '@/components/floating-chat-button';
import CustomerAuthInitializer from '@/components/auth/customer-auth-initializer';
import { useState, useEffect } from 'react';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hostname, setHostname] = useState('');

  useEffect(() => {
    // This effect runs only on the client side, after hydration.
    // It's safe to access window.location here.
    setHostname(window.location.hostname);
  }, []);

  // While waiting for the hostname to be determined on the client,
  // we can render nothing to prevent a flash of incorrect content.
  if (!hostname) {
    return null;
  }

  const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'schoolbd.top';
  
  // Determine if we are on a subdomain (a store page)
  const isStorePage = hostname !== rootDomain && hostname !== `www.${rootDomain}`;

  // Handle admin pages for both SaaS and stores - they have their own layouts.
  if (pathname.includes('/admin') || pathname.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  // If it's a store page, render the store layout.
  if (isStorePage) {
    return (
      <div className="flex flex-col min-h-screen">
        <CustomerAuthInitializer />
        <Header />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Footer />
        <FixedCartButton />
        <FloatingChatButton />
      </div>
    );
  }

  // Otherwise, it must be a public SaaS platform page.
  // The main landing page ('/') provides its own header and footer.
  if (pathname === '/') {
     return <>{children}</>;
  }
  
  // For other SaaS pages like /login, /register, /get-started
  return (
    <div className="flex flex-col min-h-screen">
        <SaasHeader />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <SaasFooter />
    </div>
  );
}
