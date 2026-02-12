
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

  // 1. Check for admin/dashboard pages first, as they have priority and no layout.
  if (pathname.includes('/admin') || pathname.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  // 2. Check for public store pages (identified by having a username param).
  if (username) {
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

  // 3. Handle all other root-domain pages (SaaS landing, auth, etc.)
  // We can assume if `username` is not present, it's a SaaS page.
  if (pathname === '/') {
     return (
        <>
            <SaasHeader />
            <main>{children}</main>
            <SaasFooter />
        </>
    );
  }

  // For other SaaS pages like /login, /register, etc., that need a container.
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
