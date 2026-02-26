
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { recipientId, recipientType, siteId, limit = 100, platformView = false } = await request.json();

    if (!recipientType) {
      return NextResponse.json({ error: 'Recipient Type is required.' }, { status: 400 });
    }

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

    const { data: { session } } = await supabase.auth.getSession();
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('recipient_type', recipientType);

    // SECURITY & FILTERING LOGIC
    if (platformView && session) {
        // Verify caller is actually a SaaS admin before allowing platform-wide view
        const { data: caller } = await supabaseAdmin.from('profiles').select('role').eq('id', session.user.id).single();
        if (caller?.role !== 'saas_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        // For SaaS Admin in platform view, we show EVERYTHING for that recipient type (usually 'admin')
        // No additional recipient_id filter needed to show all history
    } else {
        // Standard user or site admin view
        if (recipientId) {
          query = query.eq('recipient_id', recipientId);
        } else {
          query = query.is('recipient_id', null);
        }
    }

    if (siteId && !platformView) {
      query = query.eq('site_id', siteId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ notifications: data }, { status: 200 });
  } catch (err: any) {
    console.error('List Notifications API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
