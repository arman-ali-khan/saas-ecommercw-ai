
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { encrypt, decrypt } from '@/lib/encryption';

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

    // 1. LIMIT CHECK: Verify if site has reached customer limit
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
                error: 'দুঃখিত, এই স্টোরটিতে বর্তমানে আর নতুন মেম্বার গ্রহণ করা সম্ভব হচ্ছে না। স্টোর অ্যাডমিনের সাথে যোগাযোগ করুন।' 
            }, { status: 403 });
        }
    }
    
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check if email already exists
    const { data: existingEmailUsers } = await supabaseAdmin
        .from('customer_profiles')
        .select('email')
        .eq('site_id', siteId);

    const isEmailDuplicate = existingEmailUsers?.some(u => {
        try {
            return decrypt(u.email).toLowerCase() === normalizedEmail;
        } catch (e) {
            return false;
        }
    });

    if (isEmailDuplicate) {
        return NextResponse.json({ error: 'এই ইমেলটি দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।' }, { status: 409 });
    }

    // 3. Check if phone already exists
    const { data: existingPhoneUsers } = await supabaseAdmin
        .from('customer_profiles')
        .select('phone')
        .eq('site_id', siteId);

    const isPhoneDuplicate = existingPhoneUsers?.some(u => {
        try {
            return decrypt(u.phone) === phone;
        } catch (e) {
            return false;
        }
    });

    if (isPhoneDuplicate) {
        return NextResponse.json({ error: 'এই ফোন নম্বরটি দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।' }, { status: 409 });
    }
    
    const password_hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const { data, error: insertError } = await supabaseAdmin
      .from('customer_profiles')
      .insert([{
        id: userId,
        full_name: encrypt(fullName),
        email: encrypt(normalizedEmail),
        phone: encrypt(phone),
        site_id: siteId,
        role: 'customer',
        password_hash: password_hash
      }])
      .select()
      .single();

    if (insertError) {
      console.error("DB Error on customer insert:", insertError);
      return NextResponse.json({ error: `ডাটাবেস এরর: ${insertError.message}` }, { status: 500 });
    }

    // Create notification for admin about the new customer
    if (data) {
        await supabaseAdmin.from('notifications').insert({
            recipient_id: siteId,
            recipient_type: 'admin',
            site_id: siteId,
            message: `নতুন গ্রাহক: ${fullName} আপনার স্টোরে নিবন্ধিত হয়েছেন।`,
            link: '/admin/customers',
        });
    }

    const { password_hash: removed, ...safeUser } = data;

    return NextResponse.json({ user: safeUser }, { status: 201 });

  } catch (err: any) {
    console.error("Customer Registration API Error:", err);
    return NextResponse.json({ error: 'সার্ভারে একটি অভ্যন্তরীণ ত্রুটি হয়েছে।' }, { status: 500 });
  }
}
