import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Ensure these are set in your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  const {
    username,
    fullName,
    email,
    password,
    domain,
    siteName,
    plan,
    siteDescription,
    paymentMethod,
    transactionId,
  } = await request.json();

  // --- 1. Create the base authentication user WITHOUT metadata ---
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Auto-confirm user for simplicity
  });

  if (authError) {
    // This error might happen if the email is already in use
    console.error('Error creating auth user:', authError);
    return NextResponse.json({ error: `Authentication error: ${authError.message}` }, { status: 400 });
  }

  if (!authData.user) {
    return NextResponse.json({ error: 'Failed to create user, please try again.' }, { status: 500 });
  }

  const userId = authData.user.id;
  const subscription_status = plan === 'free' ? 'active' : 'pending_verification';

  // --- 2. Manually create the user's profile in the 'profiles' table ---
  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: userId,
    username: username,
    full_name: fullName,
    email: email, // email is included for completeness
    domain: domain,
    site_name: siteName,
    site_description: siteDescription,
    subscription_plan: plan,
    subscription_status: subscription_status,
    role: 'admin',
  });

  if (profileError) {
    console.error('Error creating profile:', profileError);
    // CRITICAL: Clean up the created auth user if profile creation fails
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: `Database error creating profile: ${profileError.message}` }, { status: 500 });
  }


  // --- 3. Create a payment record if the plan is not free ---
  if (plan !== 'free') {
    const { data: planData, error: planError } = await supabaseAdmin.from('plans').select('price').eq('id', plan).single();

    if (planError || !planData) {
        console.error('Error fetching plan price:', planError);
        // Clean up the created auth user and profile
        await supabaseAdmin.auth.admin.deleteUser(userId);
        // The profile will be deleted automatically due to the foreign key constraint with "on delete cascade"
        return NextResponse.json({ error: `Could not find plan details for plan: ${plan}` }, { status: 500 });
    }

    const { error: paymentError } = await supabaseAdmin.from('subscription_payments').insert({
      user_id: userId,
      plan_id: plan,
      amount: planData.price,
      payment_method: paymentMethod,
      transaction_id: transactionId,
      status: 'pending_verification',
    });

    if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        // Clean up
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json({ error: `Database error creating payment record: ${paymentError.message}` }, { status: 500 });
    }
  }

  // --- 4. Success ---
  return NextResponse.json({ user: authData.user }, { status: 200 });
}
