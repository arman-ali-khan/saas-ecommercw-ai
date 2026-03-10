
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * Helper to transform Cloudinary URLs for PWA Icons.
 * Ensures the icon is square and in PNG format.
 */
function getTransformedIcon(url: string | null | undefined, size: number) {
    if (!url) return null;
    if (url.includes('res.cloudinary.com')) {
        // Force square cropping and PNG format
        return url.replace('/upload/', `/upload/w_${size},h_${size},c_pad,b_white,f_png/`);
    }
    return url;
}

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const cookieStore = await cookies();

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
    .select('id, site_name, site_description, updated_at')
    .eq('domain', username)
    .single();

  if (!profile) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const { data: settings } = await supabase
    .from('store_settings')
    .select('favicon_url, logo_image_url, pwa_logo_url, theme_primary')
    .eq('site_id', profile.id)
    .single();
    
  // Use updated_at timestamp to bypass cache if icons change
  const cacheBuster = profile.updated_at ? new Date(profile.updated_at).getTime() : Date.now();
  const rawIconUrl = settings?.pwa_logo_url || settings?.logo_image_url || settings?.favicon_url;
  
  const icon192 = getTransformedIcon(rawIconUrl, 192) || `https://placehold.co/192/FFFFFF/000000?text=${(profile.site_name || 'S').charAt(0)}`;
  const icon512 = getTransformedIcon(rawIconUrl, 512) || `https://placehold.co/512/FFFFFF/000000?text=${(profile.site_name || 'S').charAt(0)}`;

  const themeColor = settings?.theme_primary ? `hsl(${settings.theme_primary})` : '#ffffff';

  const manifest = {
    name: profile.site_name || 'Store',
    short_name: profile.site_name || 'Store',
    description: profile.site_description || `E-commerce store.`,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: themeColor,
    orientation: 'portrait',
    icons: [
      {
        src: `${icon192}${icon192.includes('?') ? '&' : '?'}v=${cacheBuster}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${icon512}${icon512.includes('?') ? '&' : '?'}v=${cacheBuster}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
       {
        src: `${icon512}${icon512.includes('?') ? '&' : '?'}v=${cacheBuster}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
}
