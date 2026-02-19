
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * @fileOverview Secure API for SaaS admins to save (create/update) showcase items.
 */

export async function POST(request: Request) {
  try {
    const { id, ...data } = await request.json();
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

    // 3. Perform Save Operation
    let result;
    if (id) {
      // Update existing item
      const { data: updated, error } = await supabaseAdmin
        .from('saas_showcase')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      result = updated;
    } else {
      // Create new item
      const { data: inserted, error } = await supabaseAdmin
        .from('saas_showcase')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      result = inserted;
    }

    return NextResponse.json({ success: true, data: result });

  } catch (err: any) {
    console.error('Save Showcase Item API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
