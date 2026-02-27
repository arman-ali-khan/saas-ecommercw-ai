import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Bulk Product Importer API
 * Efficiently saves multiple products and handles unique slug generation.
 */

async function findUniqueSlug(supabase: any, baseSlug: string) {
  let slug = baseSlug;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    const { data } = await supabase
      .from('products')
      .select('id')
      .eq('id', slug)
      .maybeSingle();

    if (!data) {
      isUnique = true;
    } else {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  return slug;
}

export async function POST(request: Request) {
  try {
    const { siteId, products } = await request.json();

    if (!siteId || !Array.isArray(products)) {
      return NextResponse.json({ error: 'Site ID and Products array are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Subscription & Limit Check
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('subscription_plan, subscription_status')
        .eq('id', siteId)
        .single();

    if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const blockedStatuses = ['inactive', 'canceled', 'pending', 'pending_verification', 'failed'];
    if (blockedStatuses.includes(profile.subscription_status)) {
        return NextResponse.json({ error: 'আপনার সাবস্ক্রিপশন সক্রিয় নয়।' }, { status: 403 });
    }

    // Get limits
    const { data: planData } = await supabaseAdmin
        .from('plans')
        .select('product_limit')
        .eq('id', profile.subscription_plan)
        .single();

    const { count: currentCount } = await supabaseAdmin
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId);

    const limit = planData?.product_limit;
    const remainingSlots = limit !== null ? limit - (currentCount || 0) : 1000000;

    if (remainingSlots <= 0) {
        return NextResponse.json({ error: 'Your product limit has been reached.' }, { status: 403 });
    }

    const productsToImport = products.slice(0, remainingSlots);
    const results = [];

    // 2. Process each product
    // Note: We use a loop for individual unique slug generation safety, 
    // though bulk insert is faster, unique slugs require sequential checking or a sophisticated strategy.
    for (const p of productsToImport) {
        const baseSlug = p.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\u0980-\u09FF-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '') || 'product';
        
        const finalSlug = await findUniqueSlug(supabaseAdmin, baseSlug);

        const sanitizedProduct = {
            id: finalSlug,
            site_id: siteId,
            name: p.name,
            price: p.price || 0,
            stock: p.stock || 0,
            currency: 'BDT',
            description: p.description || '',
            long_description: p.long_description || '',
            categories: Array.isArray(p.categories) ? p.categories : [],
            tags: Array.isArray(p.tags) ? p.tags : [],
            images: Array.isArray(p.images) ? p.images : [],
            is_featured: !!p.is_featured,
            origin: p.origin || '',
            story: p.story || '',
        };

        const { data, error } = await supabaseAdmin
            .from('products')
            .insert(sanitizedProduct)
            .select()
            .single();

        if (error) {
            console.error(`Failed to insert product: ${p.name}`, error);
        } else {
            results.push(data);
        }
    }

    return NextResponse.json({ 
        success: true, 
        count: results.length,
        skipped: products.length - results.length
    }, { status: 200 });

  } catch (err: any) {
    console.error('Bulk Import API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
