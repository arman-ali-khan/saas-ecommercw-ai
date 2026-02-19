
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, site_name, site_description')
    .eq('domain', username)
    .single();

  if (!profile) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const { data: settings } = await supabase
    .from('store_settings')
    .select('favicon_url')
    .eq('site_id', profile.id)
    .single();
    
  const faviconUrl = settings?.favicon_url;
  const siteInitial = (profile.site_name || 'S').charAt(0).toUpperCase();

  const manifest = {
    name: profile.site_name || 'Store',
    short_name: profile.site_name || 'Store',
    description: profile.site_description || `E-commerce store.`,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: faviconUrl || `https://placehold.co/192/FFFFFF/000000?text=${siteInitial}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: faviconUrl || `https://placehold.co/512/FFFFFF/000000?text=${siteInitial}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
       {
        src: faviconUrl || `https://placehold.co/512/FFFFFF/000000?text=${siteInitial}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  };

  return NextResponse.json(manifest);
}
