import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Ensure these are set in your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  const body = await request.json();

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
  } = body;

  // --- 1. Create the authentication user ---
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Or false to require email verification
  });

  if (authError || !authData.user) {
    console.error('Error creating auth user:', authError);
    return NextResponse.json({ error: `Authentication error: ${authError?.message}` }, { status: 400 });
  }

  const userId = authData.user.id;

  // --- 2. Create the user's profile ---
  const subscription_status = plan === 'free' ? 'active' : 'pending_verification';

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
      subscription_plan: plan,
      subscription_status,
      role: 'admin',
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
    // Attempt to clean up the created auth user
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: `Database error creating profile: ${profileError.message}` }, { status: 500 });
  }

  // --- 3. Create a payment record if the plan is not free ---
  if (plan !== 'free') {
    const { data: planData, error: planError } = await supabaseAdmin.from('plans').select('price').eq('id', plan).single();

    if (planError || !planData) {
        console.error('Error fetching plan price:', planError);
        await supabaseAdmin.auth.admin.deleteUser(userId); // Cleanup
        // We might want to also delete the profile here, but it will cascade if FK is set up correctly
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
        await supabaseAdmin.auth.admin.deleteUser(userId); // Cleanup
        return NextResponse.json({ error: `Database error creating payment record: ${paymentError.message}` }, { status: 500 });
    }
  }

  // If all steps are successful
  return NextResponse.json({ user: authData.user }, { status: 200 });
}
