
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
    .select('seo_title, seo_description, seo_keywords, favicon_url, social_share_image_url')
    .eq('site_id', profile.id)
    .single();

  // Use the specific SEO settings if they exist, otherwise fall back to the main profile info
  const title = settings?.seo_title || profile.site_name || 'Store';
  const description = settings?.seo_description || profile.site_description || 'An e-commerce store.';
  const keywords = settings?.seo_keywords || '';
  const faviconUrl = settings?.favicon_url;
  const socialShareImageUrl = settings?.social_share_image_url;

  return {
    title,
    description,
    keywords,
    icons: faviconUrl ? { icon: faviconUrl } : null,
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

// The default export now just passes its children through.
// The actual layout is now handled by src/components/site-layout.tsx
export default async function UsernameLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { username: string };
}) {
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('domain', params.username)
    .single();

  let themeStyles = '';

  if (profile) {
    const { data: settings } = await supabase
      .from('store_settings')
      .select(
        'theme_primary, theme_background, theme_accent, theme_card, theme_foreground, theme_secondary, font_primary, font_secondary'
      )
      .eq('site_id', profile.id)
      .single();

    if (settings) {
      const styleVars = [
        settings.theme_background && `--background: ${settings.theme_background};`,
        settings.theme_foreground && `--foreground: ${settings.theme_foreground};`,
        settings.theme_primary && `--primary: ${settings.theme_primary};`,
        settings.theme_secondary && `--secondary: ${settings.theme_secondary};`,
        settings.theme_accent && `--accent: ${settings.theme_accent};`,
        settings.theme_card && `--card: ${settings.theme_card};`,
        settings.theme_foreground && `--card-foreground: ${settings.theme_foreground};`,
        settings.theme_card && `--popover: ${settings.theme_card};`,
        settings.theme_foreground && `--popover-foreground: ${settings.theme_foreground};`,
        settings.theme_secondary && `--muted: ${settings.theme_secondary};`,
        settings.theme_foreground && `--muted-foreground: ${settings.theme_foreground};`,
        settings.theme_primary && `--ring: ${settings.theme_primary};`,
        settings.font_primary && `--font-body: '${settings.font_primary}';`,
        settings.font_secondary && `--font-headline: '${settings.font_secondary}';`,
      ]
        .filter(Boolean)
        .join(' ');

      if (styleVars) {
        themeStyles = `:root { ${styleVars} }`;
      }
    }
  }

  return (
    <>
      {themeStyles && <style>{themeStyles}</style>}
      {children}
    </>
  );
}

    