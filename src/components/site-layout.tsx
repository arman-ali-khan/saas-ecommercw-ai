
'use client';

import { usePathname, useParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import SaasHeader from './saas-header';
import SaasFooter from './saas-footer';

// Added these to handle store-specific UI
import FixedCartButton from '@/components/fixed-cart-button';
import FloatingChatButton from '@/components/floating-chat-button';
import CustomerAuthInitializer from '@/components/auth/customer-auth-initializer';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const username = params.username as string | undefined;

  // SaaS main page (no username param)
  if (!username && pathname === '/') {
    return (
        <>
            <SaasHeader />
            <main>{children}</main>
            <SaasFooter />
        </>
    );
  }
  
  // SaaS auth pages (no username param)
  const saasAuthPaths = ['/login', '/register', '/get-started'];
  if (!username && saasAuthPaths.some(p => pathname.startsWith(p))) {
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

  // Admin and SaaS dashboard pages have their own full-page layouts
  if (pathname.includes('/admin') || pathname.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  // If we have a username param, it's a public store page.
  if (username) {
    return (
      <div className="flex flex-col min-h-screen">
        <CustomerAuthInitializer />
        <Header />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Footer />
        <FixedCartButton username={username} />
        <FloatingChatButton />
      </div>
    );
  }

  // Fallback for any other case on the root domain
  return (
    <>
        <SaasHeader />
        <main>{children}</main>
        <SaasFooter />
    </>
  );
}
