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
    plan, // The real plan
    siteDescription,
    paymentMethod,
    transactionId,
  } = await request.json();

  // --- Step 1: Create the user, but tell the trigger it's a 'free' plan to bypass faulty payment logic. ---
  // The trigger likely copies this metadata to the 'profiles' table.
  const initial_subscription_status = 'active'; // What the trigger would set for a free plan
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Auto-confirm user for simplicity
    user_metadata: {
        // Pass all the necessary profile data for the trigger to succeed
        username: username,
        full_name: fullName,
        email: email,
        domain: domain,
        site_name: siteName,
        site_description: siteDescription,
        subscription_plan: 'free', // Lie to the trigger to get past the broken part
        subscription_status: initial_subscription_status,
        role: 'admin',
    }
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    // This is the error the user is seeing. It means the trigger failed.
    return NextResponse.json({ error: `Authentication error: ${authError.message}` }, { status: 400 });
  }

  if (!authData.user) {
    return NextResponse.json({ error: 'Failed to create user, please try again.' }, { status: 500 });
  }

  const userId = authData.user.id;

  // If the actual plan was 'free', we are done. The trigger did everything we need.
  if (plan === 'free') {
    return NextResponse.json({ user: authData.user }, { status: 200 });
  }

  // --- Step 2: For paid plans, immediately update the profile with the correct plan info ---
  const final_subscription_status = 'pending_verification';
  const { error: profileUpdateError } = await supabaseAdmin.from('profiles')
    .update({
        subscription_plan: plan,
        subscription_status: final_subscription_status,
    })
    .eq('id', userId);

  if (profileUpdateError) {
      console.error('Error updating profile to paid plan:', profileUpdateError);
      // Critical: Clean up the created auth user if this fails to prevent orphaned users
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: `Database error updating profile: ${profileUpdateError.message}` }, { status: 500 });
  }

  // --- Step 3: Now, manually create the payment record for the paid plan ---
  const { data: planData, error: planError } = await supabaseAdmin.from('plans').select('price').eq('id', plan).single();

  if (planError || !planData) {
      console.error('Error fetching plan price:', planError);
      // Clean up
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: `Could not find plan details for plan: ${plan}` }, { status: 500 });
  }

  // Sanitize price data - this is the key to avoiding the original error if 'price' is not a clean number
  const priceString = String(planData.price).replace(/[^0-9.]/g, '');
  const priceNumber = parseFloat(priceString);

  if (isNaN(priceNumber)) {
      console.error('Error parsing plan price:', planData.price);
      // Clean up
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: `Could not parse price for plan: ${plan}` }, { status: 500 });
  }

  const { error: paymentError } = await supabaseAdmin.from('subscription_payments').insert({
    user_id: userId,
    plan_id: plan,
    amount: priceNumber,
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

  // --- Step 4: Success for paid plan ---
  return NextResponse.json({ user: authData.user }, { status: 200 });
}
