
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

    const decodedProductId = decodeURIComponent(productId);

    // Fetch product and flash deal in parallel
    const [productRes, flashDealRes] = await Promise.all([
      supabaseAdmin
        .from('products')
        .select('*')
        .match({ id: decodedProductId, site_id: siteId })
        .single(),
      supabaseAdmin
        .from('flash_deals')
        .select('*')
        .match({ product_id: decodedProductId, site_id: siteId })
        .maybeSingle()
    ]);

    if (productRes.error) {
      if (productRes.error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      throw productRes.error;
    }

    return NextResponse.json({ 
      product: productRes.data, 
      flashDeal: flashDealRes.data || null 
    }, { status: 200 });

  } catch (err: any) {
    console.error('Get Product API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
