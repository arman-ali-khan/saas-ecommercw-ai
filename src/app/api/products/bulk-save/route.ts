import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Enhanced Bulk Product Importer API
 * Handles unique slug generation, recursive category creation, and attribute auto-mapping.
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

/**
 * Ensures a category hierarchy exists. Returns the final leaf category name.
 * Input format: "Clothing > Men > T-shirts"
 */
async function ensureCategoryHierarchy(supabase: any, siteId: string, categoryPath: string) {
  const parts = categoryPath.split('>').map(p => p.trim()).filter(Boolean);
  let parentId: number | null = null;
  let lastCategoryName = '';

  for (const part of parts) {
    // Check if category exists at this level
    let query = supabase.from('categories').select('id, name').eq('site_id', siteId).eq('name', part);
    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      parentId = existing.id;
      lastCategoryName = existing.name;
    } else {
      // Create new category
      const { data: created, error } = await supabase
        .from('categories')
        .insert({
          site_id: siteId,
          name: part,
          parent_id: parentId,
          icon: 'Package'
        })
        .select('id, name')
        .single();
      
      if (error) {
        console.error(`Error creating category "${part}":`, error);
        break;
      }
      parentId = created.id;
      lastCategoryName = created.name;
    }
  }
  return lastCategoryName;
}

/**
 * Ensures attributes exist in the product_attributes table.
 */
async function ensureAttributes(supabase: any, siteId: string, attrMap: Record<string, string[]>) {
  for (const [type, values] of Object.entries(attrMap)) {
    const normalizedType = type.toLowerCase().trim();
    for (const val of values) {
      const { data: existing } = await supabase
        .from('product_attributes')
        .select('id')
        .eq('site_id', siteId)
        .eq('type', normalizedType)
        .eq('value', val.trim())
        .maybeSingle();

      if (!existing) {
        await supabase.from('product_attributes').insert({
          site_id: siteId,
          type: normalizedType,
          value: val.trim()
        });
      }
    }
  }
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
        return NextResponse.json({ error: 'আপনার সাবস্ক্রিপশন স্ট্যাটাস সক্রিয় নয়।' }, { status: 403 });
    }

    // Get current product count for limits
    const { count: currentCount } = await supabaseAdmin
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', siteId);

    const { data: planData } = await supabaseAdmin.from('plans').select('product_limit').eq('id', profile.subscription_plan).single();
    const limit = planData?.product_limit;
    const remainingSlots = limit !== null ? limit - (currentCount || 0) : 1000000;

    if (remainingSlots <= 0) {
        return NextResponse.json({ error: 'Your product limit has been reached.' }, { status: 403 });
    }

    const productsToImport = products.slice(0, remainingSlots);
    const results = [];

    // 2. Sequential Processing
    for (const p of productsToImport) {
        // A. Handle Slug
        const baseSlug = p.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\u0980-\u09FF-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '') || 'product';
        
        const finalSlug = await findUniqueSlug(supabaseAdmin, baseSlug);

        // B. Handle Categories (Auto-create Hierarchy)
        const finalCategoryNames: string[] = [];
        if (p.categories && Array.isArray(p.categories)) {
            for (const catPath of p.categories) {
                const leafName = await ensureCategoryHierarchy(supabaseAdmin, siteId, catPath);
                if (leafName && !finalCategoryNames.includes(leafName)) {
                    finalCategoryNames.push(leafName);
                }
            }
        }

        // C. Handle Attributes (Auto-create)
        if (p.custom_attributes && typeof p.custom_attributes === 'object') {
            await ensureAttributes(supabaseAdmin, siteId, p.custom_attributes);
        }

        // D. Build Sanitize Product
        const sanitizedProduct = {
            id: finalSlug,
            site_id: siteId,
            name: p.name,
            price: p.price || 0,
            stock: p.stock || 0,
            currency: 'BDT',
            description: p.description || '',
            long_description: p.long_description || '',
            categories: finalCategoryNames,
            tags: Array.isArray(p.tags) ? p.tags : [],
            images: Array.isArray(p.images) ? p.images : [],
            is_featured: !!p.is_featured,
            origin: p.origin || '',
            story: p.story || '',
            brand: Array.isArray(p.brand) ? p.brand : [],
            color: Array.isArray(p.color) ? p.color : [],
            unit: p.unit || null,
            custom_attributes: p.custom_attributes || {}
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
