// src/app/api/auth/register-customer/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { fullName, email, password, siteId } = await request.json();

    // 1. Validate input
    if (!fullName || !email || !password || !siteId) {
        return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // 2. Check if user already exists for this site
    const { data: existingUser, error: findError } = await supabaseAdmin
        .from('customer_profiles')
        .select('id')
        .eq('email', email)
        .eq('site_id', siteId)
        .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 means no rows found
         return NextResponse.json({ error: `Database error: ${findError.message}` }, { status: 500 });
    }
    
    if (existingUser) {
        return NextResponse.json({ error: 'A customer with this email already exists on this site.' }, { status: 409 });
    }
    
    // 3. Hash the password
    const password_hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // 4. Insert the new customer
    const { data, error: insertError } = await supabaseAdmin
      .from('customer_profiles')
      .insert([{
        id: userId,
        full_name: fullName,
        email: email,
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
