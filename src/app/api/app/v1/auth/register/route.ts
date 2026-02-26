
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { encrypt, decrypt } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const { fullName, email, password, domain } = await request.json();

    if (!fullName || !email || !password || !domain) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Resolve Site & Check Limits
    const { data: profile } = await supabaseAdmin.from('profiles').select('id, subscription_plan').eq('domain', domain).single();
    if (!profile) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const [planRes, countRes] = await Promise.all([
        supabaseAdmin.from('plans').select('customer_limit').eq('id', profile.subscription_plan).single(),
        supabaseAdmin.from('customer_profiles').select('*', { count: 'exact', head: true }).eq('site_id', profile.id)
    ]);

    const limit = planRes.data?.customer_limit;
    if (limit !== null && (countRes.count || 0) >= limit!) {
        return NextResponse.json({ error: 'Store registration limit reached.' }, { status: 403 });
    }

    // 2. Check Duplicate
    const { data: existing } = await supabaseAdmin.from('customer_profiles').select('email').eq('site_id', profile.id);
    const isDuplicate = existing?.some(u => {
        try { return decrypt(u.email).toLowerCase() === email.toLowerCase().trim(); } catch(e) { return false; }
    });

    if (isDuplicate) return NextResponse.json({ error: 'Email already registered.' }, { status: 409 });

    // 3. Create User
    const password_hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabaseAdmin.from('customer_profiles').insert([{
        id: uuidv4(),
        full_name: encrypt(fullName),
        email: encrypt(email.toLowerCase().trim()),
        site_id: profile.id,
        role: 'customer',
        password_hash
    }]).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, userId: data.id });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
