
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * @fileOverview Products API for Mobile App.
 * Supports searching, category filtering, and pagination.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!domain) return NextResponse.json({ error: 'Domain required' }, { status: 400 });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('domain', domain).single();
    if (!profile) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    let query = supabaseAdmin
      .from('products')
      .select('*', { count: 'exact' })
      .eq('site_id', profile.id);

    if (category) query = query.overlaps('categories', [category]);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      products: data,
      total: count,
      has_more: count ? (offset + limit < count) : false
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
