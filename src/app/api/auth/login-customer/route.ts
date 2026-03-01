
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const { identifier, password, siteId, type = 'email' } = await request.json();

    if (!identifier || !password || !siteId) {
        return NextResponse.json({ error: 'সকল তথ্য প্রদান করুন।' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const normalizedIdentifier = identifier.toLowerCase().trim();

    // Fetch users for this site
    const { data: users, error } = await supabaseAdmin
      .from('customer_profiles')
      .select('*')
      .eq('site_id', siteId);

    if (error) throw error;

    // Find user by decrypted email or phone
    const user = users?.find(u => {
        try {
            const decryptedVal = type === 'email' ? decrypt(u.email) : decrypt(u.phone);
            return decryptedVal.toLowerCase().trim() === normalizedIdentifier;
        } catch (e) { return false; }
    });

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'ভুল ইমেল/ফোন বা পাসওয়ার্ড।' }, { status: 401 });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'ভুল ইমেল/ফোন বা পাসওয়ার্ড।' }, { status: 401 });
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
