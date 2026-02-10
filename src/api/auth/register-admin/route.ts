// src/api/auth/register-admin/route.ts

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
    // Step 1: Create the auth user. This also triggers the `on_auth_user_created`
    // function in Supabase, which creates a basic row in the `profiles` table.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm user as we are in a server environment
      user_metadata: {
        full_name: fullName,
        role: 'admin', 
        email: email,
      }
    });

    if (authError) {
      // This handles cases like a user with this email already existing.
      return NextResponse.json({ error: `Authentication error: ${authError.message}` }, { status: 400 });
    }

    userId = authData.user.id;

    // Step 2: Update the newly created profile row with the rest of the site info.
    // We use UPDATE instead of INSERT to avoid a race condition with the database trigger.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        username,
        full_name: fullName,
        email,
        domain,
        site_name: siteName,
        site_description: siteDescription,
        subscription_plan: planId,
        // Set status based on plan
        subscription_status: planId === 'free' ? 'active' : 'pending',
        role: 'admin'
      })
      .eq('id', userId); 

    if (profileError) {
      throw new Error(`Database error updating profile: ${profileError.message}`);
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

      // Use upsert to handle potential retries with the same transaction ID
      if (transactionId) {
        const { error: paymentError } = await supabaseAdmin
          .from('subscription_payments')
          .upsert({
            user_id: userId,
            plan_id: planData.id,
            amount: priceNumber,
            payment_method: paymentMethod || 'manual',
            transaction_id: transactionId,
            status: 'pending',
          }, {
            onConflict: 'transaction_id'
          });
        
        if (paymentError) {
          throw new Error(`Could not create or update payment record: ${paymentError.message}`);
        }
      } else {
        // Fallback to insert if no transaction ID is provided
        const { error: paymentError } = await supabaseAdmin
          .from('subscription_payments')
          .insert({
            user_id: userId,
            plan_id: planData.id,
            amount: priceNumber,
            payment_method: paymentMethod || 'manual',
            transaction_id: null,
            status: 'pending',
          });
        
        if (paymentError) {
          throw new Error(`Could not create payment record: ${paymentError.message}`);
        }
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
