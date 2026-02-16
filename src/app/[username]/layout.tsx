
import type { Metadata } from 'next';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { fontMap } from '@/lib/fonts';

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

  // Fetch the main profile and its related settings in one go.
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

  // The joined store_settings might be an object or an array with one object.
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

// The default export now just passes its children through.
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
    .select('id, store_settings(theme_primary, theme_background, theme_accent, theme_card, theme_foreground, theme_secondary, font_primary, font_secondary)')
    .eq('domain', params.username)
    .single();

  let themeStyles = '';

  if (profile) {
    const settings = (Array.isArray(profile.store_settings) ? profile.store_settings[0] : profile.store_settings) || {};

    if (settings) {
      const primaryFontVar = settings.font_primary ? fontMap[settings.font_primary]?.variable : null;
      const secondaryFontVar = settings.font_secondary ? fontMap[settings.font_secondary]?.variable : null;
      
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
        primaryFontVar && `--font-body: var(${primaryFontVar});`,
        secondaryFontVar && `--font-headline: var(${secondaryFontVar});`,
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
