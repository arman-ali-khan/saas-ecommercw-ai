import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { siteId, sms_notifications_enabled, admin_sms_number } = await request.json();

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. SUBSCRIPTION STATUS CHECK
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('subscription_status, subscription_plan')
        .eq('id', siteId)
        .single();

    if (!profile) {
        return NextResponse.json({ error: 'প্রোফাইল খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    const blockedStatuses = ['inactive', 'canceled', 'pending', 'pending_verification', 'failed'];
    if (blockedStatuses.includes(profile.subscription_status)) {
        return NextResponse.json({ error: 'আপনার সাবস্ক্রিপশন স্ট্যাটাস সক্রিয় নয়।' }, { status: 403 });
    }

    // 2. PLAN RESTRICTION: Paid only
    if (profile.subscription_plan === 'free') {
        return NextResponse.json({ error: 'দুঃখিত, SMS সার্ভিসটি শুধুমাত্র পেইড ইউজারদের জন্য।' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('store_settings')
      .upsert({ 
        site_id: siteId, 
        sms_notifications_enabled, 
        admin_sms_number 
      }, { onConflict: 'site_id' });

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Save SMS Settings API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
