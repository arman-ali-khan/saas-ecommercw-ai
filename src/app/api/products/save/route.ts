
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

    // 1. SUBSCRIPTION STATUS CHECK
    const { data: profileStatus } = await supabaseAdmin
        .from('profiles')
        .select('subscription_status')
        .eq('id', siteId)
        .single();

    const blockedStatuses = ['inactive', 'canceled', 'pending', 'pending_verification', 'failed'];
    if (profileStatus && blockedStatuses.includes(profileStatus.subscription_status)) {
        return NextResponse.json({ 
            error: 'আপনার সাবস্ক্রিপশন সক্রিয় নয়। দয়া করে সেটিংস থেকে সাবস্ক্রিপশন চেক করুন অথবা পেমেন্ট সম্পন্ন করুন।' 
        }, { status: 403 });
    }

    // 2. LIMIT CHECK for new products
    if (isNew) {
        const [profileRes, productsCountRes] = await Promise.all([
            supabaseAdmin.from('profiles').select('subscription_plan, subscription_status').eq('id', siteId).single(),
            supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('site_id', siteId)
        ]);

        if (profileRes.data) {
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

    // Sanitize and ensure data types match DB expectations
    const sanitizedProductData = {
        ...productData,
        unit: productData.unit && productData.unit.trim() !== '' ? productData.unit : null,
        variants: productData.variants && productData.variants.length > 0 ? productData.variants : null,
        brand: Array.isArray(productData.brand) ? productData.brand : [],
        color: Array.isArray(productData.color) ? productData.color : [],
        categories: Array.isArray(productData.categories) ? productData.categories : [],
        tags: Array.isArray(productData.tags) ? productData.tags : [],
    };

    let resultProduct;

    if (isNew) {
      // REQUIREMENT: Check if BOTH ID and Site ID match
      const { data: existingInStore } = await supabaseAdmin
        .from('products')
        .select('id')
        .match({ id: sanitizedProductData.id, site_id: siteId })
        .maybeSingle();
      
      if (existingInStore) {
          return NextResponse.json({ 
              error: 'এই স্লাগটি (ID) আপনার স্টোরে ইতিমধ্যে ব্যবহৃত হয়েছে। দয়া করে অন্য স্লাগ দিন।' 
          }, { status: 409 });
      }

      // If not in this store, proceed to insert. 
      // Uniqueness across the WHOLE table is handled by the database itself.
      const { data, error } = await supabaseAdmin
        .from('products')
        .insert({ ...sanitizedProductData, site_id: siteId })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ 
            error: 'দুঃখিত, এই স্লাগটি অন্য একটি স্টোর ব্যবহার করছে। স্লাগের শেষে সংখ্যা বা শব্দ যোগ করে পরিবর্তন করুন (যেমন: -নতুন)।' 
          }, { status: 409 });
        }
        throw error;
      }
      resultProduct = data;
    } else {
      // UPDATE CASE: If slug changed, check if it's taken in THIS store
      if (productData.id && productData.id !== productId) {
          const { data: existingInternal } = await supabaseAdmin
            .from('products')
            .select('id')
            .match({ id: productData.id, site_id: siteId })
            .maybeSingle();
          
          if (existingInternal) {
              return NextResponse.json({ 
                error: 'এই নতুন স্লাগটি ইতিমধ্যে আপনার অন্য একটি পণ্যে ব্যবহার করা হয়েছে।' 
              }, { status: 409 });
          }
      }

      const { data, error } = await supabaseAdmin
        .from('products')
        .update(sanitizedProductData)
        .match({ id: productId, site_id: siteId })
        .select()
        .single();

      if (error) {
          if (error.code === '23505') {
              return NextResponse.json({ 
                error: 'দুঃখিত, এই স্লাগটি অন্য একটি স্টোর ব্যবহার করছে। স্লাগের শেষে সংখ্যা বা শব্দ যোগ করে পরিবর্তন করুন।' 
              }, { status: 409 });
          }
          throw error;
      }
      resultProduct = data;
    }

    const targetProductId = isNew ? resultProduct.id : (productData.id || productId);
    
    // Manage Flash Deals
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
