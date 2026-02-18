
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const { email, password, siteId } = await request.json();

    if (!email || !password || !siteId) {
        return NextResponse.json({ error: 'ইমেল, পাসওয়ার্ড এবং সাইট আইডি প্রদান করা আবশ্যক।' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Fetch all customers for this site
    const { data: users, error } = await supabaseAdmin
      .from('customer_profiles')
      .select('*')
      .eq('site_id', siteId);

    if (error) {
      console.error("Database error during customer login:", error);
      return NextResponse.json({ error: 'ডাটাবেস সংযোগে সমস্যা হয়েছে।' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'ভুল ইমেল বা পাসওয়ার্ড।' }, { status: 401 });
    }

    // 2. Find the user with matching decrypted email
    const user = users.find(u => {
        try {
            return decrypt(u.email).toLowerCase() === normalizedEmail;
        } catch (e) {
            return false;
        }
    });

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'ভুল ইমেল বা পাসওয়ার্ড।' }, { status: 401 });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json({ error: 'ভুল ইমেল বা পাসওয়ার্ড।' }, { status: 401 });
    }

    // 4. Return safe user object (decrypted)
    const { password_hash, ...safeUser } = user;
    const decryptedUser = {
        ...safeUser,
        full_name: decrypt(user.full_name),
        email: decrypt(user.email)
    };

    return NextResponse.json({ user: decryptedUser }, { status: 200 });

  } catch (err: any) {
    console.error("Customer Login API Catch Error:", err);
    return NextResponse.json({ error: 'সার্ভারে একটি অভ্যন্তরীণ ত্রুটি হয়েছে।' }, { status: 500 });
  }
}
