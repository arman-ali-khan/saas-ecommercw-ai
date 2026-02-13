
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import SiteLayout from '@/components/site-layout';
import AuthProvider from '@/components/auth-provider';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
<<<<<<< HEAD
=======
import CustomTopLoader from '@/components/custom-top-loader';
>>>>>>> 2f69cf2fa7fcd62c85e1b2e488b6f9f2bfb2d4e8

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
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;700&family=Lato:wght@400;700&family=Montserrat:wght@400;700&family=Noto+Sans+Bengali:wght@400;700&family=Open+Sans:wght@400;700&family=Orbitron:wght@700&family=Roboto:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
<<<<<<< HEAD
=======
        <CustomTopLoader />
>>>>>>> 2f69cf2fa7fcd62c85e1b2e488b6f9f2bfb2d4e8
        <AuthProvider>
          <SiteLayout>{children}</SiteLayout>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
