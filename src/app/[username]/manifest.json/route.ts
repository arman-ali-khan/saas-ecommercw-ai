
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

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
  
  const siteInitial = (profile.site_name || 'S').charAt(0).toUpperCase();
  const pwaIconUrl = rawIconUrl 
    ? `${rawIconUrl}${rawIconUrl.includes('?') ? '&' : '?'}v=${cacheBuster}`
    : `https://placehold.co/512/FFFFFF/000000?text=${siteInitial}`;

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
        src: pwaIconUrl,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: pwaIconUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
       {
        src: pwaIconUrl,
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
