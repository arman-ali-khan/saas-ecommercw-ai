
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { siteId, siteName, siteDescription } = await request.json();

    if (!siteId || !siteName) {
      return NextResponse.json({ error: 'Site ID and Name are required' }, { status: 400 });
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
        return NextResponse.json({ 
            error: 'আপনার সাবস্ক্রিপশন সক্রিয় নয়। প্রোফাইল বা সাইট সেটিংস পরিবর্তন করতে দয়া করে সাবস্ক্রিপশন রিনিউ করুন।' 
        }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        site_name: siteName,
        site_description: siteDescription
      })
      .eq('id', siteId);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Save General Settings API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
