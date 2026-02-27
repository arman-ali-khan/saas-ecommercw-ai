
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { siteId, ...brandingData } = await request.json();

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // SUBSCRIPTION STATUS CHECK
    const { data: profileStatus } = await supabaseAdmin
        .from('profiles')
        .select('subscription_status')
        .eq('id', siteId)
        .single();

    const blockedStatuses = ['inactive', 'canceled', 'pending', 'pending_verification', 'failed'];
    if (profileStatus && blockedStatuses.includes(profileStatus.subscription_status)) {
        return NextResponse.json({ error: 'আপনার সাবস্ক্রিপশন স্ট্যাটাস সক্রিয় নয়।' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('store_settings')
      .upsert({ 
        site_id: siteId,
        logo_type: brandingData.logo_type,
        logo_icon: brandingData.logo_icon,
        logo_image_url: brandingData.logo_image_url,
        favicon_url: brandingData.favicon_url,
        pwa_logo_url: brandingData.pwa_logo_url,
        social_share_image_url: brandingData.social_share_image_url
      }, { onConflict: 'site_id' });

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Save Branding API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
