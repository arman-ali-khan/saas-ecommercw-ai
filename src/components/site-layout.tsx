
'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import SaasHeader from './saas-header';
import SaasFooter from './saas-footer';
import FixedCartButton from '@/components/fixed-cart-button';
import FloatingChatButton from '@/components/floating-chat-button';
import { useState, useEffect } from 'react';
import BottomNav from './BottomNav';
import StorePreloader from './store-preloader';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hostname, setHostname] = useState('');

  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  useEffect(() => {
    const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'schoolbd.top';
    const isStorePage = hostname && hostname !== rootDomain && hostname !== `www.${rootDomain}`;
    
    if (isStorePage && 'serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('/sw.js')
            .then(registration => console.log('Service Worker registered with scope:', registration.scope))
            .catch(error => console.error('Service Worker registration failed:', error));
    }
  }, [hostname]);

  if (!hostname) {
    return null;
  }

  const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'schoolbd.top';
  
  const isStorePage = hostname !== rootDomain && hostname !== `www.${rootDomain}`;

  if (pathname.includes('/admin') || pathname.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  if (isStorePage) {
    return (
      <div className="flex flex-col min-h-screen">
        <StorePreloader />
        <Header />
        <main className="flex-grow container mx-auto px-1 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          {children}
        </main>
        <Footer />
        <BottomNav />
        <div className="hidden md:block">
          <FixedCartButton />
        </div>
        <FloatingChatButton />
      </div>
    );
  }

  if (pathname === '/') {
     return <>{children}</>;
  }
  
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
