
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/encryption';
import { addMinutes } from 'date-fns';

export async function POST(request: Request) {
  try {
    const { email, password, siteId } = await request.json();

    if (!email || !password || !siteId) {
        return NextResponse.json({ error: 'ইমেল এবং পাসওয়ার্ড দিন।' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const normalizedEmail = email.toLowerCase().trim();

    const { data: users, error } = await supabaseAdmin
      .from('customer_profiles')
      .select('*')
      .eq('site_id', siteId);

    if (error) throw error;

    const user = users?.find(u => {
        try { return decrypt(u.email).toLowerCase() === normalizedEmail; } catch (e) { return false; }
    });

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'ভুল ইমেল বা পাসওয়ার্ড।' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'ভুল ইমেল বা পাসওয়ার্ড।' }, { status: 401 });
    }

    // --- NEW: VERIFICATION CHECK ---
    const userPhone = decrypt(user.phone);
    if (!user.is_verified) {
        // Generate new OTP for the pending user
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = addMinutes(new Date(), 10);
        await supabaseAdmin.from('customer_otps').insert({
            site_id: siteId,
            phone: userPhone,
            otp: otp,
            expires_at: expiresAt.toISOString()
        });
        console.log(`[LOGIN OTP RE-SENT] For: ${userPhone}, OTP: ${otp}`);

        return NextResponse.json({ 
            error: 'verification_pending',
            phone: userPhone,
            message: 'আপনার অ্যাকাউন্টটি এখনো ভেরিফাই করা হয়নি।'
        }, { status: 403 });
    }

    const { password_hash: removed, ...safeUser } = user;
    return NextResponse.json({ 
        user: {
            ...safeUser,
            full_name: decrypt(user.full_name),
            email: decrypt(user.email),
            phone: userPhone
        } 
    }, { status: 200 });

  } catch (err: any) {
    console.error("Customer Login API Error:", err);
    return NextResponse.json({ error: 'সার্ভারে ত্রুটি হয়েছে।' }, { status: 500 });
  }
}
