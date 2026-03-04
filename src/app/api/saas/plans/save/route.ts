import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', session.user.id).single();
    if (profile?.role !== 'saas_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const payload = {
        name: data.name,
        name_en: data.name_en,
        price: data.price,
        period: data.period,
        description: data.description,
        description_en: data.description_en,
        features: data.features,
        features_en: data.features_en,
        product_limit: data.product_limit,
        customer_limit: data.customer_limit,
        order_limit: data.order_limit,
        duration_value: data.duration_value,
        duration_unit: data.duration_unit,
    };

    let result;
    if (id && id.trim() !== '') {
      const { data: updated, error } = await supabaseAdmin.from('plans').update(payload).eq('id', id).select().single();
      if (error) throw error;
      result = updated;
    } else {
      const newId = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const { data: inserted, error } = await supabaseAdmin.from('plans').insert({ ...payload, id: newId }).select().single();
      if (error) throw error;
      result = inserted;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Save Plan API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}