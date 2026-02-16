'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import SaasHeader from './saas-header';
import SaasFooter from './saas-footer';
import FixedCartButton from '@/components/fixed-cart-button';
import { useState, useEffect } from 'react';
import BottomNav from './BottomNav';
import { supabase } from '@/lib/supabase/client';
import type { HeaderLink, FooterLinkCategory, SocialLink } from '@/types';

type SiteInfo = {
  id: string;
  name: string;
  description: string | null;
  logoType: 'icon' | 'image';
  logoIcon: string;
  logoImageUrl: string | null;
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hostname, setHostname] = useState('');
  const [isStorePage, setIsStorePage] = useState(false);

  // New centralized state for all site-related data
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [headerLinks, setHeaderLinks] = useState<HeaderLink[]>([]);
  const [footerCategories, setFooterCategories] = useState<FooterLinkCategory[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isSiteDataLoading, setIsSiteDataLoading] = useState(true);

  useEffect(() => {
    const h = window.location.hostname;
    setHostname(h);
    const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'schoolbd.top';
    const storePage = h && h !== rootDomain && h !== `www.${rootDomain}`;
    setIsStorePage(storePage);
  }, []);

  useEffect(() => {
    if (!isStorePage) {
      setIsSiteDataLoading(false);
      return;
    }
    const domain = hostname.split('.')[0];
    
    async function fetchAllSiteInfo() {
        setIsSiteDataLoading(true);
        const { data: profileData } = await supabase
            .from('profiles')
            .select('id, site_name, site_description')
            .eq('domain', domain)
            .single();

        if (profileData) {
            const siteId = profileData.id;
            
            const settingsPromise = supabase
                .from('store_settings')
                .select('logo_type, logo_icon, logo_image_url')
                .eq('site_id', siteId)
                .single();

            const headerLinksPromise = supabase
                .from('header_links')
                .select('*')
                .eq('site_id', siteId)
                .order('order');
            
            const footerCatPromise = supabase
                .from('footer_link_categories')
                .select('*, footer_links(*)')
                .eq('site_id', siteId)
                .order('order');

            const socialLinksPromise = supabase.from('social_links').select('*').eq('site_id', siteId);

            const [
                { data: settingsData },
                { data: headerLinksData },
                { data: footerCatData },
                { data: socialData }
            ] = await Promise.all([settingsPromise, headerLinksPromise, footerCatPromise, socialLinksPromise]);

            setSiteInfo({
                id: profileData.id,
                name: profileData.site_name || domain,
                description: profileData.site_description,
                logoType: settingsData?.logo_type || 'icon',
                logoIcon: settingsData?.logo_icon || 'Leaf',
                logoImageUrl: settingsData?.logo_image_url || null,
            });

            if (headerLinksData && headerLinksData.length > 0) {
              setHeaderLinks(headerLinksData);
            } else {
              setHeaderLinks([
                  { id: '1', site_id: '', label: 'হোম', href: '/', order: 0 },
                  { id: '2', site_id: '', label: 'পণ্য', href: `/products`, order: 1 },
                  { id: '3', site_id: '', label: 'Flash Deals', href: `/flash-deals`, order: 2 },
                  { id: '4', site_id: '', label: 'ট্র্যাক অর্ডার', href: `/track-order`, order: 3 },
                  { id: '5', site_id: '', label: 'আমাদের সম্পর্কে', href: `/about`, order: 4 },
              ]);
            }

            if (footerCatData) {
                const categories = footerCatData.map(cat => ({
                    ...cat,
                    links: cat.footer_links.sort((a: any, b: any) => a.order - b.order)
                }));
                setFooterCategories(categories as FooterLinkCategory[]);
            }

            if (socialData) {
              setSocialLinks(socialData as SocialLink[]);
            }

        } else {
             setSiteInfo({ id: '', name: domain, description: 'An e-commerce store', logoType: 'icon', logoIcon: 'Leaf', logoImageUrl: null });
        }
        setIsSiteDataLoading(false);
    }
    
    fetchAllSiteInfo();
  }, [isStorePage, hostname]);

  useEffect(() => {
    if (isStorePage && 'serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('/sw.js')
            .then(registration => console.log('Service Worker registered with scope:', registration.scope))
            .catch(error => console.error('Service Worker registration failed:', error));
    }
  }, [isStorePage]);

  if (!hostname) {
    return null;
  }
  
  if (pathname.includes('/admin') || pathname.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  if (isStorePage) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header siteInfo={siteInfo} navLinks={headerLinks} isLoading={isSiteDataLoading} />
        <main className="flex-grow container mx-auto px-1 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          {children}
        </main>
        <Footer siteInfo={siteInfo} footerCategories={footerCategories} socialLinks={socialLinks} isLoading={isSiteDataLoading} />
        <BottomNav />
        <div className="hidden md:block">
          <FixedCartButton />
        </div>
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
