
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import SiteLayout from '@/components/site-layout';
import AuthProvider from '@/components/auth-provider';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import CustomTopLoader from '@/components/custom-top-loader';

// Force dynamic rendering to ensure the latest settings (like favicon) are always used.
export const dynamic = 'force-dynamic';
 
export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {}
        },
      },
    }
  );

  const { data } = await supabase
    .from('saas_settings')
    .select('platform_name, platform_description, seo_title, seo_description, seo_keywords, favicon_url')
    .eq('id', 1)
    .single();

  const settings = data || {};

  const title = settings.seo_title || settings.platform_name || 'বাংলা ন্যাচারালস';
  const description = settings.seo_description || settings.platform_description || 'প্রাকৃতিক বাংলাদেশী পণ্যের জন্য একটি প্রাণবন্ত ই-কমার্স।';

  return {
    title: title,
    description: description,
    keywords: settings.seo_keywords || '',
    icons: settings.favicon_url ? [{ rel: 'icon', url: settings.favicon_url }] : null,
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const headersList = headers();
  const host = headersList.get('host');
  const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'schoolbd.top';
  const isStorePage = host && host !== rootDomain && !host.startsWith('www.');
  const subdomain = isStorePage ? host.split('.')[0] : null;

  let fontPrimary = 'Hind Siliguri';
  let fontSecondary = 'Orbitron';

  try {
    if (isStorePage && subdomain) {
      const { data: profile } = await supabase.from('profiles').select('id').eq('domain', subdomain).single();
      if (profile) {
          const { data: settings } = await supabase
              .from('store_settings')
              .select('font_primary, font_secondary')
              .eq('site_id', profile.id)
              .single();
          if (settings) {
              fontPrimary = settings.font_primary || fontPrimary;
              fontSecondary = settings.font_secondary || fontSecondary;
          }
      }
    } else {
      const { data: settings } = await supabase
          .from('saas_settings')
          .select('font_primary, font_secondary')
          .eq('id', 1)
          .single();
      if (settings) {
          fontPrimary = settings.font_primary || fontPrimary;
          fontSecondary = settings.font_secondary || fontSecondary;
      }
    }
  } catch(e) {
    console.error("Error fetching font settings:", e);
    // Defaults will be used in case of an error
  }

  const fontFamilies = [fontPrimary, fontSecondary]
    .filter(Boolean)
    .map(font => `${font.replace(/ /g, '+')}:wght@400;700`)
    .join('&family=');
  
  const fontUrl = fontFamilies ? `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap` : '';


  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {fontUrl && <link href={fontUrl} rel="stylesheet" />}
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <CustomTopLoader />
        <AuthProvider>
          <SiteLayout>{children}</SiteLayout>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
