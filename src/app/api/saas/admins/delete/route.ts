
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

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

    // Verify caller is a SaaS Admin
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (callerProfile?.role !== 'saas_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete profile (auth deletion requires more care, usually profiles suffice for cleanup if cascaded)
    const { error } = await supabaseAdmin.from('profiles').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (e: any) {
    console.error('API /saas/admins/delete error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
