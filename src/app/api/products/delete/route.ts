
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { productId, productIds, siteId } = await request.json();

    if ((!productId && !productIds) || !siteId) {
      return NextResponse.json({ error: 'Product ID(s) and Site ID are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const idsToDelete = productIds || [productId];

    // 1. Delete associated flash deals first to maintain integrity
    await supabaseAdmin
      .from('flash_deals')
      .delete()
      .in('product_id', idsToDelete)
      .eq('site_id', siteId);

    // 2. Delete the products
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .in('id', idsToDelete)
      .eq('site_id', siteId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, count: idsToDelete.length }, { status: 200 });
  } catch (err: any) {
    console.error('Delete Product API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
