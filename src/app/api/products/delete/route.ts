
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { productId, siteId } = await request.json();

    if (!productId || !siteId) {
      return NextResponse.json({ error: 'Product ID and Site ID are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Also delete associated flash deals first
    await supabaseAdmin
      .from('flash_deals')
      .delete()
      .match({ product_id: productId, site_id: siteId });

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .match({ id: productId, site_id: siteId });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Delete Product API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
