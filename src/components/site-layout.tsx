
'use client';

import { usePathname } from 'next/navigation';
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

  // 1. Handle pages that provide their own full layout.
  const isSaaSHomePage = pathname === '/';
  const isStoreAdminPage = pathname.includes('/admin');
  const isSaasAdminPage = pathname.startsWith('/dashboard');

  if (isSaaSHomePage || isStoreAdminPage || isSaasAdminPage) {
    return <>{children}</>;
  }
  
  // 2. Differentiate between SaaS pages and Store pages
  const pathSegments = pathname.split('/').filter(Boolean);
  const potentialUsername = pathSegments[0];
  const saasPublicRoutes = ['login', 'register', 'get-started'];

  // If the first path segment is not a known SaaS route, it's a store page.
  const isStorePage = potentialUsername && !saasPublicRoutes.includes(potentialUsername);

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
  
  // 3. For all other SaaS pages like /login, /register, etc.
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
