
import type { Metadata } from 'next';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
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

const translations = { en, bn };

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
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {}
        },
        remove: (name: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {}
        },
      },
    }
  );

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, site_name, site_description, store_settings(seo_title, seo_description, seo_keywords, favicon_url, social_share_image_url)')
    .eq('domain', username)
    .single();

  if (!profile) {
    return {
      title: 'Store Not Found',
    };
  }

  const settings = (Array.isArray(profile.store_settings) ? profile.store_settings[0] : profile.store_settings) || {};
  const title = settings.seo_title || profile.site_name || 'Store';
  const description = settings.seo_description || profile.site_description || 'An e-commerce store.';
  const keywords = settings.seo_keywords || '';
  const faviconUrl = settings.favicon_url;
  const socialShareImageUrl = settings.social_share_image_url;

  return {
    title,
    description,
    keywords,
    manifest: '/manifest.json',
    icons: faviconUrl ? [{ rel: 'icon', url: faviconUrl }] : null,
    openGraph: {
        title: title,
        description: description,
        images: socialShareImageUrl ? [
            {
                url: socialShareImageUrl,
                width: 1200,
                height: 630,
                alt: title,
            }
        ] : undefined,
    }
  };
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
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          try { cookieStore.set({ name, value, ...options }); } catch (error) {}
        },
        remove: (name: string, options: CookieOptions) => {
          try { cookieStore.set({ name, value: '', ...options }); } catch (error) {}
        },
      },
    }
  );

  const { data: profile } = await supabase.from('profiles').select('id, site_name, site_description').eq('domain', username).single();
  const siteId = profile?.id;

  const settingsPromise = siteId ? supabase.from('store_settings').select('*').eq('site_id', siteId).single() : Promise.resolve({ data: null });
  const headerLinksPromise = siteId ? supabase.from('header_links').select('*').eq('site_id', siteId).order('order') : Promise.resolve({ data: [] });
  const footerCatPromise = siteId ? supabase.from('footer_link_categories').select('*, footer_links(*)').eq('site_id', siteId).order('order') : Promise.resolve({ data: [] });
  const socialLinksPromise = siteId ? supabase.from('social_links').select('*').eq('site_id', siteId) : Promise.resolve({ data: [] });

  const [
    { data: settingsData },
    { data: headerLinksData },
    { data: footerCatData },
    { data: socialData }
  ] = await Promise.all([settingsPromise, headerLinksPromise, footerCatPromise, socialLinksPromise]);

  const siteInfo = profile ? {
    id: profile.id,
    name: profile.site_name || username,
    description: profile.site_description,
    logoType: settingsData?.logo_type || 'icon',
    logoIcon: settingsData?.logo_icon || 'Leaf',
    logoImageUrl: settingsData?.logo_image_url || null,
  } : null;

  const headerLinks = (headerLinksData && headerLinksData.length > 0) ? headerLinksData as HeaderLink[] : [
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

  const socialLinks = (socialData || []) as SocialLink[];
  const lang = settingsData?.language || 'bn';
  const t = translations[lang as keyof typeof translations] || bn;

  let themeStyles = '';
  if (settingsData) {
    const primaryFontVar = settingsData.font_primary ? fontMap[settingsData.font_primary]?.variable : null;
    const secondaryFontVar = settingsData.font_secondary ? fontMap[settingsData.font_secondary]?.variable : null;
    
    const styleVars = [
      settingsData.theme_background && `--background: ${settingsData.theme_background};`,
      settingsData.theme_foreground && `--foreground: ${settingsData.theme_foreground};`,
      settingsData.theme_primary && `--primary: ${settingsData.theme_primary};`,
      settingsData.theme_secondary && `--secondary: ${settingsData.theme_secondary};`,
      settingsData.theme_accent && `--accent: ${settingsData.theme_accent};`,
      settingsData.theme_card && `--card: ${settingsData.theme_card};`,
      settingsData.theme_foreground && `--card-foreground: ${settingsData.theme_foreground};`,
      settingsData.theme_card && `--popover: ${settingsData.theme_card};`,
      settingsData.theme_foreground && `--popover-foreground: ${settingsData.theme_foreground};`,
      settingsData.theme_secondary && `--muted: ${settingsData.theme_secondary};`,
      settingsData.theme_foreground && `--muted-foreground: ${settingsData.theme_foreground};`,
      settingsData.theme_primary && `--ring: ${settingsData.theme_primary};`,
      primaryFontVar && `--font-body: var(${primaryFontVar});`,
      secondaryFontVar && `--font-headline: var(${secondaryFontVar});`,
    ].filter(Boolean).join(' ');

    if (styleVars) {
      themeStyles = `:root { ${styleVars} }`;
    }
  }

  return (
    <>
      {themeStyles && <style>{themeStyles}</style>}
      <LanguageProvider translations={t}>
        <div className="flex flex-col min-h-screen">
          <Header siteInfo={siteInfo} navLinks={headerLinks} isLoading={false} />
          <main className="flex-grow container mx-auto px-1 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
            {children}
          </main>
          <Footer siteInfo={siteInfo} footerCategories={footerCategories} socialLinks={socialLinks} isLoading={false} />
          <BottomNav />
          <div className="hidden md:block">
            <FixedCartButton />
          </div>
        </div>
      </LanguageProvider>
    </>
  );
}
