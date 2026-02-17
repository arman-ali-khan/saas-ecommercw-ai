
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password, siteId } = await request.json();

    if (!email || !password || !siteId) {
        return NextResponse.json({ error: 'Email, password, and siteId are required.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Find customer by email and siteId
    const { data: user, error } = await supabaseAdmin
      .from('customer_profiles')
      .select('*')
      .eq('email', email)
      .eq('site_id', siteId)
      .single();

    if (error || !user || !user.password_hash) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // 3. Return safe user object
    const { password_hash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser }, { status: 200 });

  } catch (err: any) {
    console.error("Login API Error:", err);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
