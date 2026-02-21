
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

    // LIMIT CHECK for new products
    if (isNew) {
        // Fetch the limit and current count
        const [profileRes, productsCountRes] = await Promise.all([
            supabaseAdmin.from('profiles').select('subscription_plan, subscription_status').eq('id', siteId).single(),
            supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('site_id', siteId)
        ]);

        if (profileRes.data) {
            // Get product limit from the associated plan
            const { data: planData } = await supabaseAdmin
                .from('plans')
                .select('product_limit')
                .eq('id', profileRes.data.subscription_plan)
                .single();

            const currentCount = productsCountRes.count || 0;
            const limit = planData?.product_limit;

            if (limit !== null && limit !== undefined && currentCount >= limit) {
                return NextResponse.json({ 
                    error: `আপনার প্রোডাক্ট লিমিট (${limit}) শেষ হয়ে গেছে। আরও পণ্য যোগ করতে আপনার প্ল্যান আপগ্রেড করুন।` 
                }, { status: 403 });
            }
        }
    }

    let resultProduct;

    // Sanitize and ensure data types match DB expectations
    const sanitizedProductData = {
        ...productData,
        unit: productData.unit && productData.unit.trim() !== '' ? productData.unit : null,
        variants: productData.variants && productData.variants.length > 0 ? productData.variants : null,
        brand: Array.isArray(productData.brand) ? productData.brand : [],
        color: Array.isArray(productData.color) ? productData.color : [],
        categories: Array.isArray(productData.categories) ? productData.categories : [],
    };

    if (isNew) {
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
      const { data, error } = await supabaseAdmin
        .from('products')
        .update(sanitizedProductData)
        .match({ id: productId, site_id: siteId })
        .select()
        .single();

      if (error) throw error;
      resultProduct = data;
    }

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
            await supabaseAdmin.from('flash_deals').update(flashPayload).eq('id', existingDeal.id);
        } else {
            await supabaseAdmin.from('flash_deals').insert(flashPayload);
        }
    } else if (existingDeal) {
        await supabaseAdmin.from('flash_deals').delete().eq('id', existingDeal.id);
    }

    return NextResponse.json({ success: true, product: resultProduct }, { status: 200 });

  } catch (err: any) {
    console.error('Save Product API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
