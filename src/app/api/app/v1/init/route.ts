
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * @fileOverview Initialization API for Mobile App.
 * Returns site branding, theme, home sections, hero slides, and flash deals.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Resolve Site Profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, site_name, site_description, domain, subscription_status')
      .eq('domain', domain)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (profile.subscription_status === 'inactive') {
        return NextResponse.json({ error: 'This store is temporarily disabled.' }, { status: 403 });
    }

    const siteId = profile.id;

    // 2. Fetch all relevant data in parallel
    const [settingsRes, slidesRes, categoriesRes, flashDealsRes, featuresRes] = await Promise.all([
      supabaseAdmin.from('store_settings').select('*').eq('site_id', siteId).single(),
      supabaseAdmin.from('carousel_slides').select('*').eq('site_id', siteId).eq('is_enabled', true).order('order'),
      supabaseAdmin.from('categories').select('*').eq('site_id', siteId).order('name'),
      supabaseAdmin.from('flash_deals').select('*, products(*)').eq('site_id', siteId).eq('is_active', true).gt('end_date', new Date().toISOString()),
      supabaseAdmin.from('store_features').select('*').eq('site_id', siteId).order('order')
    ]);

    const settings = settingsRes.data || {};

    return NextResponse.json({
      site: {
        id: profile.id,
        name: profile.site_name,
        description: profile.site_description,
        domain: profile.domain,
        branding: {
            logo_type: settings.logo_type || 'icon',
            logo_icon: settings.logo_icon || 'Leaf',
            logo_image_url: settings.logo_image_url || null,
            theme_mode: settings.theme_mode || 'light',
            primary_color: settings.theme_primary || '207 90% 61%',
        }
      },
      home: {
        sections: settings.homepage_sections || [],
        hero_slides: slidesRes.data || [],
        categories: categoriesRes.data || [],
        flash_deals: flashDealsRes.data || [],
        features: featuresRes.data || []
      }
    }, { status: 200 });

  } catch (err: any) {
    console.error('Mobile Init API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
