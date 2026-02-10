// src/app/api/auth/register-admin/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  const body = await request.json();
  
  const {
    username, fullName, email, password,
    domain, siteName, plan: planId, siteDescription,
    paymentMethod, transactionId,
  } = body;

  let userId: string | undefined;

  try {
    // Step 1: Create the auth user.
    // Data in user_metadata is stored on the auth.users table in the raw_user_meta_data column.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm user as we are in a server environment
      user_metadata: {
        full_name: fullName,
        role: 'admin', // Store basic, non-critical data here
      }
    });

    if (authError) {
      // This is the most likely place for "user already registered" errors
      return NextResponse.json({ error: `Authentication error: ${authError.message}` }, { status: 400 });
    }

    userId = authData.user.id;

    // Step 2: Manually insert the user's full profile into the public 'profiles' table.
    // This gives us full control and avoids any faulty database triggers.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        username,
        full_name: fullName,
        email,
        domain,
        site_name: siteName,
        site_description: siteDescription,
        subscription_plan: planId,
        // Set status based on plan
        subscription_status: planId === 'free' ? 'active' : 'pending',
        role: 'admin' // Explicitly set application-level role
      });

    if (profileError) {
      // If profile creation fails, we must delete the auth user to allow them to retry registration.
      throw new Error(`Database error creating profile: ${profileError.message}`);
    }

    // Step 3: If the plan is not free, create the payment record.
    if (planId !== 'free') {
      const { data: planData, error: planError } = await supabaseAdmin
        .from('plans')
        .select('id, price')
        .eq('id', planId)
        .single();

      if (planError || !planData) {
        throw new Error('Invalid plan selected during payment record creation.');
      }
      
      const priceString = String(planData.price || '0');
      const priceNumber = parseFloat(priceString.replace(/[^0-9.]/g, '')) || 0;

      const { error: paymentError } = await supabaseAdmin
        .from('subscription_payments')
        .insert({
          user_id: userId,
          plan_id: planData.id,
          amount: priceNumber,
          payment_method: paymentMethod || 'manual',
          transaction_id: transactionId || null,
          status: 'pending',
        });

      if (paymentError) {
        throw new Error(`Could not create payment record: ${paymentError.message}`);
      }
    }

    // If we get here, everything was successful.
    return NextResponse.json({ user: authData.user }, { status: 200 });

  } catch (err: any) {
    // Generic catch block. If something failed, and we have a userId,
    // we must delete the auth user to allow a clean retry.
    if (userId) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    }
    console.error("Full Registration Process Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
