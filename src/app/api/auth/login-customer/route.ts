
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/encryption';

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

    // Fetch users for this site
    const { data: users, error } = await supabaseAdmin
      .from('customer_profiles')
      .select('*')
      .eq('site_id', siteId);

    if (error) throw error;

    // Find user by decrypted email
    const user = users?.find(u => {
        try { return decrypt(u.email).toLowerCase() === normalizedEmail; } catch (e) { return false; }
    });

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'ভুল ইমেল বা পাসওয়ার্ড।' }, { status: 401 });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'ভুল ইমেল বা পাসওয়ার্ড।' }, { status: 401 });
    }

    // Check if verified
    if (!user.is_verified) {
        const userPhone = decrypt(user.phone);
        return NextResponse.json({ 
            error: 'verification_pending',
            phone: userPhone,
            message: 'আপনার একাউন্টটি এখনো ভেরিফাই করা হয়নি।'
        }, { status: 403 });
    }

    const { password_hash: removed, ...safeUser } = user;
    return NextResponse.json({ 
        user: {
            ...safeUser,
            full_name: decrypt(user.full_name),
            email: decrypt(user.email),
            phone: decrypt(user.phone)
        } 
    }, { status: 200 });

  } catch (err: any) {
    console.error("Customer Login API Error:", err);
    return NextResponse.json({ error: 'সার্ভারে ত্রুটি হয়েছে।' }, { status: 500 });
  }
}
