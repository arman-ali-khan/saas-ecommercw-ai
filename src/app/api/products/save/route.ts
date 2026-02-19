
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { isNew, productData, flashDealData, siteId, productId } = body;

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let resultProduct;

    // Ensure variants is handled as JSONB
    const sanitizedProductData = {
        ...productData,
        variants: productData.variants || null
    };

    if (isNew) {
      // Create new product
      const { data, error } = await supabaseAdmin
        .from('products')
        .insert({ ...sanitizedProductData, site_id: siteId })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'This Product ID/Slug is already taken. Please choose another.' }, { status: 409 });
        }
        throw error;
      }
      resultProduct = data;
    } else {
      // Update existing product
      const { data, error } = await supabaseAdmin
        .from('products')
        .update(sanitizedProductData)
        .match({ id: productId, site_id: siteId })
        .select()
        .single();

      if (error) throw error;
      resultProduct = data;
    }

    // Handle Flash Deal logic
    const targetProductId = isNew ? resultProduct.id : productId;
    
    const { data: existingDeal } = await supabaseAdmin
        .from('flash_deals')
        .select('id')
        .eq('product_id', targetProductId)
        .eq('site_id', siteId)
        .maybeSingle();

    if (flashDealData) {
        const flashPayload = {
            ...flashDealData,
            site_id: siteId,
            product_id: targetProductId,
            is_active: true,
        };

        if (existingDeal) {
            const { error: flashUpdateError } = await supabaseAdmin
                .from('flash_deals')
                .update(flashPayload)
                .eq('id', existingDeal.id);
            if (flashUpdateError) throw flashUpdateError;
        } else {
            const { error: flashInsertError } = await supabaseAdmin
                .from('flash_deals')
                .insert(flashPayload);
            if (flashInsertError) throw flashInsertError;
        }
    } else if (existingDeal) {
        const { error: flashDeleteError } = await supabaseAdmin
            .from('flash_deals')
            .delete()
            .eq('id', existingDeal.id);
        if (flashDeleteError) throw flashDeleteError;
    }

    return NextResponse.json({ success: true, product: resultProduct }, { status: 200 });

  } catch (err: any) {
    console.error('Save Product API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
