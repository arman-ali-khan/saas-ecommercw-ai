
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  if (!domain) return NextResponse.json({ error: 'Domain required' }, { status: 400 });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('domain', domain).single();
    if (!profile) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('site_id', profile.id)
      .order('name');

    if (error) throw error;
    return NextResponse.json({ categories: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
