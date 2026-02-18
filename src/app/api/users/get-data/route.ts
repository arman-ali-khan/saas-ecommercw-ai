
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'saas_admins', 'site_admins', 'customers'
  const siteId = searchParams.get('siteId');

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

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    // Fetch caller's profile to check permissions
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, id')
      .eq('id', session.user.id)
      .single();

    if (!callerProfile) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 });
    }

    const isSaaSAdmin = callerProfile.role === 'saas_admin';

    // 1. Fetch SaaS Admins (SaaS Admin only)
    if (type === 'saas_admins') {
      if (!isSaaSAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('role', 'saas_admin');
      if (error) throw error;
      return NextResponse.json({ users: data });
    }

    // 2. Fetch Site Admins (SaaS Admin only)
    if (type === 'site_admins') {
      if (!isSaaSAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('role', 'admin');
      if (error) throw error;
      return NextResponse.json({ users: data });
    }

    // 3. Fetch Customers (SaaS Admin or relevant Site Admin)
    if (type === 'customers') {
      const targetSiteId = siteId || (callerProfile.role === 'admin' ? callerProfile.id : null);
      
      if (!targetSiteId) {
        return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
      }

      // Check permission: SaaS admin can see any site's customers, site admin only their own
      if (!isSaaSAdmin && targetSiteId !== callerProfile.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data, error } = await supabaseAdmin
        .from('customer_profiles')
        .select('*')
        .eq('site_id', targetSiteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ users: data });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });

  } catch (e: any) {
    console.error('API get-data error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
