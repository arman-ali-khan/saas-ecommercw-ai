
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { encrypt, decrypt } from '@/lib/encryption';
import { addMinutes } from 'date-fns';

export async function POST(request: Request) {
  try {
    const { fullName, email, password, phone, siteId } = await request.json();

    if (!fullName || !email || !password || !phone || !siteId) {
        return NextResponse.json({ error: 'সকল তথ্য প্রদান করা আবশ্যক।' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. LIMIT CHECK
    const [profileRes, customersCountRes] = await Promise.all([
        supabaseAdmin.from('profiles').select('subscription_plan').eq('id', siteId).single(),
        supabaseAdmin.from('customer_profiles').select('*', { count: 'exact', head: true }).eq('site_id', siteId)
    ]);

    if (profileRes.data) {
        const { data: planData } = await supabaseAdmin
            .from('plans')
            .select('customer_limit')
            .eq('id', profileRes.data.subscription_plan)
            .single();

        const currentCount = customersCountRes.count || 0;
        const limit = planData?.customer_limit;

        if (limit !== null && limit !== undefined && currentCount >= limit) {
            return NextResponse.json({ 
                error: 'দুঃখিত, এই স্টোরটিতে বর্তমানে আর নতুন মেম্বার গ্রহণ করা সম্ভব হচ্ছে না।' 
            }, { status: 403 });
        }
    }
    
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Duplicate Checks
    const { data: existingUsers } = await supabaseAdmin
        .from('customer_profiles')
        .select('email, phone')
        .eq('site_id', siteId);

    const isEmailDuplicate = existingUsers?.some(u => {
        try { return decrypt(u.email).toLowerCase() === normalizedEmail; } catch (e) { return false; }
    });
    if (isEmailDuplicate) return NextResponse.json({ error: 'এই ইমেলটি ইতিমধ্যে ব্যবহৃত হয়েছে।' }, { status: 409 });

    const isPhoneDuplicate = existingUsers?.some(u => {
        try { return decrypt(u.phone) === phone; } catch (e) { return false; }
    });
    if (isPhoneDuplicate) return NextResponse.json({ error: 'এই ফোন নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে।' }, { status: 409 });
    
    const password_hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // 3. Create Profile
    const { data, error: insertError } = await supabaseAdmin
      .from('customer_profiles')
      .insert([{
        id: userId,
        full_name: encrypt(fullName),
        email: encrypt(normalizedEmail),
        phone: encrypt(phone),
        site_id: siteId,
        role: 'customer',
        password_hash: password_hash,
        is_verified: false
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    // 4. Generate Initial OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = addMinutes(new Date(), 10);
    await supabaseAdmin.from('customer_otps').insert({
        site_id: siteId,
        phone: phone,
        otp: otp,
        expires_at: expiresAt.toISOString()
    });

    console.log(`[REGISTRATION OTP] For: ${phone}, OTP: ${otp}`);

    const { password_hash: removed, ...safeUser } = data;

    return NextResponse.json({ 
        user: { ...safeUser, phone: phone }, 
        message: 'OTP sent to your phone' 
    }, { status: 201 });

  } catch (err: any) {
    console.error("Customer Registration API Error:", err);
    return NextResponse.json({ error: 'সার্ভারে সমস্যা হয়েছে।' }, { status: 500 });
  }
}
