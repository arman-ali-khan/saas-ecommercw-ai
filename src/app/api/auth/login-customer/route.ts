
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/encryption';

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

    // 1. Fetch all customers for this site
    // Since email is encrypted with a random IV, we cannot search directly by equality.
    // We fetch users for the site and find the matching one in memory.
    const { data: users, error } = await supabaseAdmin
      .from('customer_profiles')
      .select('*')
      .eq('site_id', siteId);

    if (error || !users || users.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // 2. Find the user with matching decrypted email
    const user = users.find(u => decrypt(u.email) === email);

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
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
    console.error("Customer Login API Error:", err);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
