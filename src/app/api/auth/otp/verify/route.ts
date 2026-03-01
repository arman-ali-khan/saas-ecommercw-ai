
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAfter } from 'date-fns';
import { decrypt } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const { identifier, otp, siteId, purpose } = await request.json();

    if (!identifier || !otp || !siteId) {
      return NextResponse.json({ error: 'তথ্য অসম্পূর্ণ।' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const isEmail = identifier.includes('@');
    
    let query = supabaseAdmin
      .from('customer_otps')
      .select('*')
      .eq('site_id', siteId)
      .eq('otp', otp);
    
    if (isEmail) query = query.eq('email', identifier.toLowerCase().trim());
    else query = query.eq('phone', identifier.trim());

    const { data: records, error } = await query.order('created_at', { ascending: false }).limit(1);

    if (error || !records || records.length === 0) {
      return NextResponse.json({ error: 'ভুল ওটিপি কোড।' }, { status: 401 });
    }

    const record = records[0];
    const now = new Date();
    const expiry = new Date(record.expires_at);

    if (isAfter(now, expiry)) {
      return NextResponse.json({ error: 'ওটিপি কোডের মেয়াদ শেষ হয়ে গেছে।' }, { status: 401 });
    }

    // --- SUCCESS: MARK AS VERIFIED ---
    // Find the user and set is_verified = true
    const { data: users } = await supabaseAdmin
        .from('customer_profiles')
        .select('id, email, phone')
        .eq('site_id', siteId);
    
    const targetUser = users?.find(u => {
        const val = isEmail ? decrypt(u.email) : decrypt(u.phone);
        return val.toLowerCase() === identifier.toLowerCase().trim();
    });

    if (targetUser) {
        await supabaseAdmin
            .from('customer_profiles')
            .update({ is_verified: true })
            .eq('id', targetUser.id);
    }

    return NextResponse.json({ success: true, message: 'ভেরিফিকেশন সফল হয়েছে।' }, { status: 200 });

  } catch (err: any) {
    console.error('Verify OTP API Error:', err);
    return NextResponse.json({ error: 'সার্ভারে সমস্যা হয়েছে।' }, { status: 500 });
  }
}
