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
    // 1. Create the user, telling the trigger it's a 'free' plan user to bypass the faulty logic.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm user
      user_metadata: {
        username,
        full_name: fullName,
        domain,
        site_name: siteName,
        site_description: siteDescription,
        subscription_plan: 'free', // Lie to the trigger to get the user created
        role: 'admin',
      }
    });

    if (authError) {
      console.error('Authentication error:', authError.message);
      // The error from Supabase is what the user is seeing.
      return NextResponse.json({ error: `Authentication error: ${authError.message}` }, { status: 400 });
    }

    userId = authData.user.id;

    // 2. If the plan is NOT free, now we manually update the profile and create payment records.
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

      // 2b. Manually update the user's profile with the correct plan and set their status.
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_plan: planData.id,
          subscription_status: 'pending_verification',
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
          status: 'pending_verification',
        });

      if (paymentError) {
        throw new Error(`Could not create payment record: ${paymentError.message}`);
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
