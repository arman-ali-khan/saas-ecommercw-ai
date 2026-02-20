
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

    // Sanitize and ensure data types match DB expectations
    const sanitizedProductData = {
        ...productData,
        // Ensure unit is a string and handle empty values
        unit: productData.unit && productData.unit.trim() !== '' ? productData.unit : null,
        // Ensure variants is either null or a valid object for JSONB
        variants: productData.variants && productData.variants.length > 0 ? productData.variants : null,
        // Clean arrays
        brand: Array.isArray(productData.brand) ? productData.brand : [],
        color: Array.isArray(productData.color) ? productData.color : [],
        categories: Array.isArray(productData.categories) ? productData.categories : [],
    };

    if (isNew) {
      // Create new product
      const { data, error } = await supabaseAdmin
        .from('products')
        .insert({ ...sanitizedProductData, site_id: siteId })
        .select()
        .single();

      if (error) {
        console.error("Supabase Insert Error:", error);
        if (error.code === '23505') {
          return NextResponse.json({ error: 'This Product ID/Slug is already taken. Please choose another.' }, { status: 409 });
        }
        // Specific check for malformed array literal which usually means a string was sent to a TEXT[] column
        if (error.message.includes('malformed array literal')) {
            return NextResponse.json({ 
                error: 'Database Schema Mismatch: The "unit" column in your products table might be an Array type. Please run the SQL fix provided by the assistant.' 
            }, { status: 500 });
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

      if (error) {
        console.error("Supabase Update Error:", error);
        throw error;
      }
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
