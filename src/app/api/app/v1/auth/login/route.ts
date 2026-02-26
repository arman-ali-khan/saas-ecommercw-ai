
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const { email, password, domain } = await request.json();

    if (!email || !password || !domain) {
        return NextResponse.json({ error: 'Email, password and domain are required.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Resolve site
    const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('domain', domain).single();
    if (!profile) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    // 2. Fetch customers for this site
    const { data: users, error } = await supabaseAdmin
      .from('customer_profiles')
      .select('*')
      .eq('site_id', profile.id);

    if (error || !users) return NextResponse.json({ error: 'Database connection failed.' }, { status: 500 });

    // 3. Match decrypted email
    const user = users.find(u => {
        try {
            return decrypt(u.email).toLowerCase() === email.toLowerCase().trim();
        } catch (e) {
            return false;
        }
    });

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // 4. Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });

    // 5. Return success
    const { password_hash, ...safeUser } = user;
    return NextResponse.json({ 
        user: {
            ...safeUser,
            full_name: decrypt(user.full_name),
            email: decrypt(user.email)
        } 
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
