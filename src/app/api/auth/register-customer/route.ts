
// src/app/api/auth/register-customer/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { encrypt, decrypt } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const { fullName, email, password, siteId } = await request.json();

    if (!fullName || !email || !password || !siteId) {
        return NextResponse.json({ error: 'সকল তথ্য প্রদান করা আবশ্যক।' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Check if user already exists
    // Since we use random IV for encryption, we must fetch and decrypt to verify uniqueness
    const { data: existingUsers, error: fetchError } = await supabaseAdmin
        .from('customer_profiles')
        .select('email')
        .eq('site_id', siteId);

    if (fetchError) {
        console.error("Error fetching existing customers:", fetchError);
        return NextResponse.json({ error: 'ডাটাবেস সংযোগে সমস্যা হয়েছে।' }, { status: 500 });
    }

    const isDuplicate = existingUsers?.some(u => decrypt(u.email) === email);
    if (isDuplicate) {
        return NextResponse.json({ error: 'এই ইমেলটি দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।' }, { status: 409 });
    }
    
    const password_hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const { data, error: insertError } = await supabaseAdmin
      .from('customer_profiles')
      .insert([{
        id: userId,
        full_name: encrypt(fullName),
        email: encrypt(email),
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

    const { password_hash: removed, ...safeUser } = data;

    return NextResponse.json({ user: safeUser }, { status: 201 });

  } catch (err: any) {
    console.error("Customer Registration API Error:", err);
    return NextResponse.json({ error: 'সার্ভারে একটি অভ্যন্তরীণ ত্রুটি হয়েছে।' }, { status: 500 });
  }
}
