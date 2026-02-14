// src/app/api/auth/register-customer/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { fullName, email, password, siteId } = await request.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Set to true to send a confirmation email
        user_metadata: {
            full_name: fullName,
            role: 'customer',
            site_id: siteId,
        }
    });

    if (authError) {
        console.error("Auth Error:", authError);
        return NextResponse.json({ error: `Authentication error: ${authError.message}` }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Insert into customer_profiles
    const { data, error: profileError } = await supabaseAdmin
      .from('customer_profiles')
      .insert([{
        id: userId,
        full_name: fullName,
        email: email,
        site_id: siteId,
        role: 'customer'
      }])
      .select()
      .single();

    if (profileError) {
      console.error("DB Error:", profileError);
      // If profile creation fails, we should delete the auth user to avoid orphans
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ user: data }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
