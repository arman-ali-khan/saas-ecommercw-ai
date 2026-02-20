import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import SiteLayout from '@/components/site-layout';
import AuthProvider from '@/components/auth-provider';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import CustomTopLoader from '@/components/custom-top-loader';
import { allFontVariables } from '@/lib/fonts';
import { Analytics } from "@vercel/analytics/next"
import Script from 'next/script';
import SaasPreloader from '@/components/saas-preloader';
 
export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();

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

  return (
    <html lang="en" className={`${allFontVariables} dark`} suppressHydrationWarning>
      <head />
      <body className="font-body antialiased bg-background text-foreground">
        <SaasPreloader />
        <CustomTopLoader />
        <Analytics/>
        <AuthProvider>
          <SiteLayout>{children}</SiteLayout>
        </AuthProvider>
        <Toaster />
        
        {/* PWA Service Worker Registration */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, function(err) {
                  console.log('ServiceWorker registration failed: ', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
