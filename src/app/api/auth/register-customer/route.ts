
// src/app/api/auth/register-customer/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { encrypt } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const { fullName, email, password, siteId } = await request.json();

    if (!fullName || !email || !password || !siteId) {
        return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Deterministic search for encrypted fields is hard without blind indexing.
    // For this prototype, we store a separate hashed_email for lookups if needed, 
    // or just search auth.users if they are linked. 
    // However, since we're using a custom table, we'll keep it simple.
    
    // Check if user already exists (simplified check)
    const { data: existingUsers } = await supabaseAdmin
        .from('customer_profiles')
        .select('id, email')
        .eq('site_id', siteId);

    // Manual check because of encryption
    const duplicate = existingUsers?.find(u => u.email === email);
    if (duplicate) {
        return NextResponse.json({ error: 'A customer with this email already exists on this site.' }, { status: 409 });
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
      return NextResponse.json({ error: `Database error: ${insertError.message}` }, { status: 500 });
    }

    const { password_hash: removed, ...safeUser } = data;

    return NextResponse.json({ user: safeUser }, { status: 201 });

  } catch (err: any) {
    console.error("Customer Registration API Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
