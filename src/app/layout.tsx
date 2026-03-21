
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import SiteLayout from '@/components/site-layout';
import AuthProvider from '@/components/auth-provider';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import CustomTopLoader from '@/components/custom-top-loader';
import { allFontVariables } from '@/lib/fonts';
import { Analytics } from "@vercel/analytics/next";
import Script from 'next/script';
import SaasPreloader from '@/components/saas-preloader';
import OfflineWarning from '@/components/offline-warning';
import ThemeInitializer from '@/components/theme-initializer';
 
export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      title: 'দোকানবিডি',
      description: 'প্রাকৃতিক বাংলাদেশী পণ্যের জন্য একটি প্রাণবন্ত ই-কমার্স।'
    };
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: { get: (name) => cookieStore.get(name)?.value }
  });

  const { data } = await supabase.from('saas_settings').select('*').eq('id', 1).maybeSingle();
  const settings = data || {};

  return {
    title: settings.seo_title || settings.platform_name || 'দোকানবিডি',
    description: settings.seo_description || settings.platform_description || 'প্রাকৃতিক বাংলাদেশী পণ্যের জন্য একটি প্রাণবন্ত ই-কমার্স।',
    icons: settings.favicon_url ? [{ rel: 'icon', url: settings.favicon_url }] : null,
    manifest: '/manifest.json',
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={allFontVariables} suppressHydrationWarning>
      <head />
      <body className="font-body antialiased bg-background text-foreground">
        <SaasPreloader />
        <CustomTopLoader />
        <Analytics/>
        <ThemeInitializer defaultMode="light" />
        <AuthProvider>
          <SiteLayout>{children}</SiteLayout>
        </AuthProvider>
        <OfflineWarning />
        <Toaster />
        
        <Script id="chunk-error-handler" strategy="beforeInteractive">
          {`
            window.addEventListener('error', function(event) {
              if (event.message && (event.message.indexOf('ChunkLoadError') !== -1 || event.message.indexOf('Loading chunk') !== -1)) {
                window.location.reload();
              }
            }, true);
          `}
        </Script>

        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
