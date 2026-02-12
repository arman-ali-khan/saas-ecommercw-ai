
import type { Metadata } from 'next';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Force dynamic rendering to ensure the latest settings (like favicon) are always used.
export const dynamic = 'force-dynamic';

// This function generates dynamic metadata for the store's pages.
export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const { username } = params;
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

  // Fetch the main profile to get the site ID and default names/descriptions
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, site_name, site_description')
    .eq('domain', username)
    .single();

  if (!profile) {
    return {
      title: 'Store Not Found',
    };
  }

  // Fetch the specific SEO settings for this site
  const { data: settings } = await supabase
    .from('store_settings')
    .select('seo_title, seo_description, seo_keywords, favicon_url')
    .eq('site_id', profile.id)
    .single();

  // Use the specific SEO settings if they exist, otherwise fall back to the main profile info
  const title = settings?.seo_title || profile.site_name || 'Store';
  const description = settings?.seo_description || profile.site_description || 'An e-commerce store.';
  const keywords = settings?.seo_keywords || '';
  const faviconUrl = settings?.favicon_url;

  return {
    title,
    description,
    keywords,
    icons: faviconUrl ? { icon: faviconUrl } : null,
  };
}

// The default export now just passes its children through.
// The actual layout is now handled by src/components/site-layout.tsx
export default function UsernameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
