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
    // 1. Create the user, but tell the trigger it's a 'free' plan to bypass faulty logic.
    // The trigger is unreliable, so we will manually update the profile with the correct data immediately after.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm user
      user_metadata: {
        // We pass this data so the trigger can create the basic profile row.
        // We will immediately overwrite/update it with a manual call to ensure correctness.
        username,
        full_name: fullName,
        domain,
        site_name: siteName,
        site_description: siteDescription,
        subscription_plan: 'free', // Lie to the trigger. We'll fix this next.
        role: 'admin',
      }
    });

    if (authError) {
      console.error('Authentication error:', authError.message);
      // The error from Supabase is what the user is seeing.
      return NextResponse.json({ error: `Authentication error: ${authError.message}` }, { status: 400 });
    }

    userId = authData.user.id;

    // 2. If the plan is NOT free, we must manually update the profile and create payment records.
    if (planId !== 'free') {
      // 2a. Fetch the plan details to get the price.
      const { data: planData, error: planError } = await supabaseAdmin
        .from('plans')
        .select('id, price')
        .eq('id', planId)
        .single();

      if (planError || !planData) {
        throw new Error('Invalid plan selected.');
      }
      
      const priceString = String(planData.price || '0');
      const priceNumber = parseFloat(priceString.replace(/[^0-9.]/g, '')) || 0;

      // 2b. Manually update the user's profile with the correct plan and set their status to 'pending'.
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_plan: planData.id,
          subscription_status: 'pending', // Use 'pending' instead of 'pending_verification'
          site_description: siteDescription, // Explicitly update the site description
        })
        .eq('id', userId);

      if (profileUpdateError) {
        throw new Error(`Could not update user profile: ${profileUpdateError.message}`);
      }
      
      // 2c. Manually insert the payment record.
      const { error: paymentError } = await supabaseAdmin
        .from('subscription_payments')
        .insert({
          user_id: userId,
          plan_id: planData.id,
          amount: priceNumber,
          payment_method: paymentMethod || 'manual',
          transaction_id: transactionId || null,
          status: 'pending', // Use 'pending' for consistency
        });

      if (paymentError) {
        throw new Error(`Could not create payment record: ${paymentError.message}`);
      }
    } else {
      // For FREE plans, we still should ensure the site_description is saved.
      const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        site_description: siteDescription,
        subscription_status: 'active' // Free plans are active immediately
      })
      .eq('id', userId);
      
      if (profileUpdateError) {
        throw new Error(`Could not update free user profile: ${profileUpdateError.message}`);
      }
    }

    // If we get here, everything was successful.
    return NextResponse.json({ user: authData.user }, { status: 200 });

  } catch (err: any) {
    // If anything fails after user creation, we must delete the user to allow them to try again.
    if (userId) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    }
    console.error("Registration Process Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
