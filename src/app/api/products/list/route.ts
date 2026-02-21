
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { siteId, isFeatured, category, limit, offset } = await request.json();

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabaseAdmin
      .from('products')
      .select('*', { count: 'exact' })
      .eq('site_id', siteId);

    if (isFeatured !== undefined) {
        query = query.eq('is_featured', isFeatured);
    }

    if (category) {
        query = query.overlaps('categories', [category]);
    }

    if (limit) {
        const from = offset || 0;
        const to = from + limit - 1;
        query = query.range(from, to);
    }

    const { data, error, count } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Database error in products list API:', error);
      throw error;
    }

    return NextResponse.json({ 
        products: data,
        total: count 
    }, { status: 200 });
  } catch (err: any) {
    console.error('List Products API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
