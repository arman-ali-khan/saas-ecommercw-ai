
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * @fileOverview Secure API for SaaS admins to fetch platform-wide data.
 * Validates session and saas_admin role before fetching from administrative tables.
 */

export async function POST(request: Request) {
  try {
    const { entity } = await request.json();
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

    // 1. Verify Authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // 2. Verify Authorization (SaaS Admin only)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'saas_admin') {
      return NextResponse.json({ error: 'Forbidden: SaaS Admin access required.' }, { status: 403 });
    }

    // 3. Fetch Entity Data
    let query;
    switch (entity) {
      case 'plans':
        query = supabaseAdmin.from('plans').select('*').order('price', { ascending: true });
        break;
      case 'features':
        query = supabaseAdmin.from('saas_features').select('*').order('name', { ascending: true });
        break;
      case 'seo_requests':
        query = supabaseAdmin.from('seo_requests').select('*').order('created_at', { ascending: false });
        break;
      case 'reviews':
        query = supabaseAdmin.from('saas_reviews').select('*').order('created_at', { ascending: false });
        break;
      case 'showcase':
        query = supabaseAdmin.from('saas_showcase').select('*').order('order', { ascending: true });
        break;
      case 'pages':
        query = supabaseAdmin.from('saas_pages').select('id, title, slug, is_published, updated_at').order('title', { ascending: true });
        break;
      case 'settings':
        query = supabaseAdmin.from('saas_settings').select('*').eq('id', 1).single();
        break;
      case 'visitors':
        query = supabaseAdmin.from('visitors').select('*').order('created_at', { ascending: false }).limit(500);
        break;
      default:
        return NextResponse.json({ error: 'Invalid entity type requested.' }, { status: 400 });
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });

  } catch (err: any) {
    console.error('Fetch Data API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
