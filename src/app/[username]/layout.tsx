
import type { Metadata } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { fontMap } from '@/lib/fonts';
import Header from '@/components/header';
import Footer from '@/components/footer';
import FixedCartButton from '@/components/fixed-cart-button';
import BottomNav from '@/components/BottomNav';
import type { HeaderLink, FooterLinkCategory, SocialLink } from '@/types';
import LanguageProvider from '@/components/language-provider';
import en from '@/locales/en.json';
import bn from '@/locales/bn.json';
import ThemeInitializer from '@/components/theme-initializer';
import { notFound } from 'next/navigation';
import FloatingChatButton from '@/components/floating-chat-button';
import Script from 'next/script';

const translations = { en, bn };

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, site_name, site_description, store_settings(seo_title, seo_description, seo_keywords, favicon_url, social_share_image_url, pwa_logo_url, logo_image_url, facebook_meta_tag)')
    .eq('domain', username)
    .maybeSingle();

  if (!profile) return { title: 'Store Not Found' };

  const settings = (Array.isArray(profile.store_settings) ? profile.store_settings[0] : profile.store_settings) || {};
  const title = settings.seo_title || `${profile.site_name || 'Store'} - Pure Natural Products`;

  const metadata: Metadata = {
    title,
    description: settings.seo_description || profile.site_description || 'Natural products.',
    keywords: settings.seo_keywords || '',
    icons: {
      icon: settings.favicon_url || '/favicon.ico',
      apple: settings.pwa_logo_url || settings.logo_image_url || '/logo.png',
    },
    manifest: '/manifest.json',
    verification: {
        other: {}
    }
  };

  if (settings.facebook_meta_tag) {
      metadata.verification!.other!['facebook-domain-verification'] = [settings.facebook_meta_tag];
  }

  return metadata;
}

export default async function UsernameLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, site_name, site_description')
    .eq('domain', username)
    .maybeSingle();

  if (!profile) notFound();

  const siteId = profile.id;

  const [
    { data: settingsData },
    { data: headerLinksData },
    { data: footerCatData },
    { data: socialData }
  ] = await Promise.all([
    supabase.from('store_settings').select('*').eq('site_id', siteId).maybeSingle(),
    supabase.from('header_links').select('*').eq('site_id', siteId).order('order'),
    supabase.from('footer_link_categories').select('*, footer_links(*)').eq('site_id', siteId).order('order'),
    supabase.from('social_links').select('*').eq('site_id', siteId)
  ]);

  const siteInfo = {
    id: profile.id,
    name: profile.site_name || username,
    description: profile.site_description,
    logoType: (settingsData?.logo_type as 'icon' | 'image') || 'icon',
    logoIcon: settingsData?.logo_icon || 'Leaf',
    logoImageUrl: settingsData?.logo_image_url || null,
  };

  const headerLinks = (headerLinksData && headerLinksData.length > 0) ? (headerLinksData as HeaderLink[]) : [
      { id: '1', site_id: '', label: 'হোম', href: '/', order: 0 },
      { id: '2', site_id: '', label: 'পণ্য', href: `/products`, order: 1 },
      { id: '3', site_id: '', label: 'Flash Deals', href: `/flash-deals`, order: 2 },
      { id: '4', site_id: '', label: 'ট্র্যাক অর্ডার', href: `/track-order`, order: 3 },
      { id: '5', site_id: '', label: 'আমাদের সম্পর্কে', href: `/about`, order: 4 },
  ];

  const footerCategories = ((footerCatData as any[]) || []).map(cat => ({
      ...cat,
      links: (cat.footer_links || []).sort((a: any, b: any) => a.order - b.order)
  })).sort((a,b) => a.order - b.order) as FooterLinkCategory[];

  const lang = settingsData?.language || 'bn';
  const translationsToUse = translations[lang as keyof typeof translations] || bn;

  let themeStyles = '';
  if (settingsData) {
    const primaryFontVar = settingsData.font_primary ? fontMap[settingsData.font_primary]?.variable : null;
    const secondaryFontVar = settingsData.font_secondary ? fontMap[settingsData.font_secondary]?.variable : null;
    
    // Core brand variables that should apply to both light and dark modes
    const brandVars = [
      settingsData.theme_primary && `--primary: ${settingsData.theme_primary};`,
      settingsData.theme_primary_foreground && `--primary-foreground: ${settingsData.theme_primary_foreground};`,
      settingsData.theme_accent && `--accent: ${settingsData.theme_accent};`,
      settingsData.theme_accent_foreground && `--accent-foreground: ${settingsData.theme_accent_foreground};`,
      settingsData.theme_destructive && `--destructive: ${settingsData.theme_destructive};`,
      primaryFontVar && `--font-body: var(${primaryFontVar});`,
      secondaryFontVar && `--font-headline: var(${secondaryFontVar});`,
    ].filter(Boolean).join(' ');

    // Layout variables that should typically only apply to light mode unless specified otherwise
    const lightModeVars = [
      settingsData.theme_background && `--background: ${settingsData.theme_background};`,
      settingsData.theme_foreground && `--foreground: ${settingsData.theme_foreground};`,
      settingsData.theme_card && `--card: ${settingsData.theme_card};`,
      settingsData.theme_card_foreground && `--card-foreground: ${settingsData.theme_card_foreground};`,
      settingsData.theme_muted && `--muted: ${settingsData.theme_muted};`,
      settingsData.theme_muted_foreground && `--muted-foreground: ${settingsData.theme_muted_foreground};`,
      settingsData.theme_border && `--border: ${settingsData.theme_border};`,
      settingsData.theme_input && `--input: ${settingsData.theme_input};`,
    ].filter(Boolean).join(' ');

    if (brandVars || lightModeVars) {
      themeStyles = `
        :root { ${brandVars} ${lightModeVars} }
        .dark { ${brandVars} }
      `;
    }
  }

  return (
    <LanguageProvider translations={translationsToUse}>
      {/* Google Analytics Rendering */}
      {settingsData?.google_analytics_id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${settingsData.google_analytics_id}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${settingsData.google_analytics_id}');
            `}
          </Script>
        </>
      )}

      {/* Facebook Pixel Rendering */}
      {settingsData?.facebook_pixel_id && (
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${settingsData.facebook_pixel_id}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* Google Search Console Verification Meta */}
      {settingsData?.google_search_console_tag && (
          <div dangerouslySetInnerHTML={{ __html: settingsData.google_search_console_tag }} />
      )}

      <ThemeInitializer defaultMode={settingsData?.theme_mode || 'light'} />
      {themeStyles && <style dangerouslySetInnerHTML={{ __html: themeStyles }} />}
      <div className="flex flex-col min-h-screen">
        <Header siteInfo={siteInfo} navLinks={headerLinks} isLoading={false} />
        <main className="flex-grow container mx-auto px-1 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          {children}
        </main>
        <Footer siteInfo={siteInfo} footerCategories={footerCategories} socialLinks={(socialData || []) as SocialLink[]} isLoading={false} />
        <BottomNav />
        <div className="hidden md:block">
          <FixedCartButton />
        </div>
        <FloatingChatButton />
      </div>
    </LanguageProvider>
  );
}
