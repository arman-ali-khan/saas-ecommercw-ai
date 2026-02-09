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

  const subscription_status = plan === 'free' ? 'active' : 'pending_verification';

  // --- 1. Create the authentication user WITH metadata for the trigger ---
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // You can set this to false if you want to skip email verification
    user_metadata: {
      username: username,
      full_name: fullName,
      domain: domain,
      site_name: siteName,
      site_description: siteDescription,
      subscription_plan: plan,
      subscription_status: subscription_status,
      role: 'admin',
    }
  });

  if (authError || !authData.user) {
    console.error('Error creating auth user:', authError);
    return NextResponse.json({ error: `Authentication error: ${authError?.message}` }, { status: 400 });
  }

  const userId = authData.user.id;

  // --- 2. Create a payment record if the plan is not free ---
  // The user's profile is now created by the database trigger, so we only need to handle the payment.
  if (plan !== 'free') {
    const { data: planData, error: planError } = await supabaseAdmin.from('plans').select('price').eq('id', plan).single();

    if (planError || !planData) {
        console.error('Error fetching plan price:', planError);
        // If this fails, we should clean up the user that was just created
        await supabaseAdmin.auth.admin.deleteUser(userId);
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
        // If this fails, we should clean up the user that was just created
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json({ error: `Database error creating payment record: ${paymentError.message}` }, { status: 500 });
    }
  }

  // If all steps are successful
  return NextResponse.json({ user: authData.user }, { status: 200 });
}
