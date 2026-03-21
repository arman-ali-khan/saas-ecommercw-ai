
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API to apply a theme to a specific store.
 * Updates the active_theme_id in the profiles table.
 */
export async function POST(request: Request) {
  try {
    const { siteId, themeId } = await request.json();

    if (!siteId || !themeId) {
      return NextResponse.json({ error: 'Site ID and Theme ID are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Verify subscription status before allowing theme change
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('subscription_status')
        .eq('id', siteId)
        .single();

    const blockedStatuses = ['inactive', 'canceled', 'pending', 'pending_verification', 'failed'];
    if (profile && blockedStatuses.includes(profile.subscription_status)) {
        return NextResponse.json({ 
            error: 'আপনার সাবস্ক্রিপশন স্ট্যাটাস সক্রিয় নয়। থিম পরিবর্তন করতে পেমেন্ট নিশ্চিত করুন।' 
        }, { status: 403 });
    }

    // 2. Update the profile with new theme ID
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ active_theme_id: themeId })
      .eq('id', siteId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Theme applied successfully' }, { status: 200 });
  } catch (err: any) {
    console.error('Apply Theme API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
