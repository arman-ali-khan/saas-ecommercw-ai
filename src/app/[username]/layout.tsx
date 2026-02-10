import FixedCartButton from '@/components/fixed-cart-button';
import FloatingChatButton from '@/components/floating-chat-button';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import CustomerAuthInitializer from '@/components/auth/customer-auth-initializer';

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
    .select('seo_title, seo_description, seo_keywords')
    .eq('site_id', profile.id)
    .single();

  // Use the specific SEO settings if they exist, otherwise fall back to the main profile info
  const title = settings?.seo_title || profile.site_name || 'Store';
  const description = settings?.seo_description || profile.site_description || 'An e-commerce store.';
  const keywords = settings?.seo_keywords || '';

  return {
    title,
    description,
    keywords,
  };
}


export default async function UsernameLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { username: string };
}) {
  const { username } = params;

  return (
    <>
      <CustomerAuthInitializer />
      {children}
      <FixedCartButton username={username} />
      <FloatingChatButton />
    </>
  );
}
