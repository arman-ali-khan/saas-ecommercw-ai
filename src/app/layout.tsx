import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import SiteLayout from '@/components/site-layout';
import AuthProvider from '@/components/auth-provider';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
 
export async function generateMetadata(): Promise<Metadata> {
  // ১. cookies() await করতে হবে
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // এখন cookieStore একটি resolved অবজেক্ট
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data } = await supabase
    .from('saas_settings')
    .select('platform_name, platform_description, seo_title, seo_description, seo_keywords')
    .eq('id', 1)
    .single();

  const settings = data || {};

  const title = settings.seo_title || settings.platform_name || 'বাংলা ন্যাচারালস';
  const description = settings.seo_description || settings.platform_description || 'প্রাকৃতিক বাংলাদেশী পণ্যের জন্য একটি প্রাণবন্ত ই-কমার্স।';

  return {
    title: title,
    description: description,
    keywords: settings.seo_keywords || '',
  }
}

// ২. RootLayout-কে async করতে হবে যাতে এটি সার্ভার রেন্ডারিং ঠিকমতো করতে পারে
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
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;700&family=Orbitron:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <AuthProvider>
          <SiteLayout>{children}</SiteLayout>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}