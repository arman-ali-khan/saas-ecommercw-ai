
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
import OfflineWarning from '@/components/offline-warning';
 
export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      title: 'বাংলা ন্যাচারালস',
      description: 'প্রাকৃতিক বাংলাদেশী পণ্যের জন্য একটি প্রাণবন্ত ই-কমার্স।'
    };
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data } = await supabase
    .from('saas_settings')
    .select('platform_name, platform_description, seo_title, seo_description, seo_keywords, favicon_url')
    .eq('id', 1)
    .maybeSingle();

  const settings = data || {};

  const title = settings.seo_title || settings.platform_name || 'বাংলা ন্যাচারালস';
  const description = settings.seo_description || settings.platform_description || 'প্রাকৃতিক বাংলাদেশী পণ্যের জন্য একটি প্রাণবন্ত ই-কমার্স।';

  return {
    title: title,
    description: description,
    keywords: settings.seo_keywords || '',
    icons: settings.favicon_url ? [{ rel: 'icon', url: settings.favicon_url }] : null,
    manifest: '/manifest.json',
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
        <OfflineWarning />
        <Toaster />
        
        {/* Handle ChunkLoadError globally by refreshing the page */}
        <Script id="chunk-error-handler" strategy="beforeInteractive">
          {`
            window.addEventListener('error', function(event) {
              if (event.message && (event.message.indexOf('ChunkLoadError') !== -1 || event.message.indexOf('Loading chunk') !== -1)) {
                console.warn('ChunkLoadError detected, reloading page...');
                window.location.reload();
              }
            }, true);
          `}
        </Script>

        {/* Service Worker Registration for PWA and FCM */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('PWA ServiceWorker registered with scope: ', registration.scope);
                }, function(err) {
                  console.log('PWA ServiceWorker registration failed: ', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
