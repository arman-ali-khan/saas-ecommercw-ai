// src/app/api/auth/register-customer/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { fullName, email, password, siteId } = await request.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Generate ID and Hash Password
    const userId = uuidv4(); 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 2. Insert into customer_profiles
    const { data, error } = await supabaseAdmin
      .from('customer_profiles')
      .insert([{
        id: userId,
        full_name: fullName,
        email: email, // Make sure this column exists in your table!
        password_hash: hashedPassword,
        site_id: siteId,
        role: 'customer'
      }])
      .select()
      .single();

    if (error) {
      console.error("DB Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ user: data }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}