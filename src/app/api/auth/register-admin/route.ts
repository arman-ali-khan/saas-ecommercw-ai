import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { encrypt } from '@/lib/encryption';
import { stripe } from '@/lib/stripe';
import { addMonths, addYears } from 'date-fns';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Server Error: Supabase environment variables are not configured.");
    return NextResponse.json({ error: "সার্ভার কনফিগারেশনে সমস্যা রয়েছে। দয়া করে সাপোর্টে যোগাযোগ করুন।" }, { status: 500 });
  }
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  const body = await request.json();
  
  const {
    username, fullName, email, password,
    domain, siteName, plan: planId, siteDescription,
    paymentMethod, transactionId,
  } = body;

  let userId: string | undefined;

  try {
    // Step 1: Normalize Plan ID and handle "null" string cases
    let finalPlanId = (planId && typeof planId === 'string' && planId !== 'null') ? planId.toLowerCase().trim() : 'free';

    // Verify if the plan exists in the database to prevent FK violation
    const { data: planData, error: planFetchError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', finalPlanId)
      .maybeSingle();

    if (!planData && finalPlanId !== 'free') {
        // Fallback to free if plan not found
        finalPlanId = 'free';
    }

    // Step 2: Auto-activation Logic for Stripe
    let finalSubscriptionStatus = finalPlanId === 'free' ? 'active' : 'pending_verification';
    let finalPaymentStatus = 'pending_verification';
    let subscriptionEndDate = null;

    if (paymentMethod === 'credit_card' && transactionId && transactionId.startsWith('cs_')) {
      try {
        const session = await stripe.checkout.sessions.retrieve(transactionId);
        if (session.payment_status === 'paid') {
          finalSubscriptionStatus = 'active';
          finalPaymentStatus = 'completed';
          
          // Calculate end date if plan data is available
          if (planData?.duration_value && planData?.duration_unit) {
            const now = new Date();
            subscriptionEndDate = planData.duration_unit === 'month' 
              ? addMonths(now, planData.duration_value) 
              : addYears(now, planData.duration_value);
          }
        }
      } catch (stripeErr) {
        console.error("Stripe session verification failed during registration:", stripeErr);
        // Fallback to pending if verification fails
      }
    }

    // Step 3: Create the auth user.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'admin', 
        email: email,
      }
    });

    if (authError) {
      return NextResponse.json({ error: `অথেনটিকেশন এরর: ${authError.message}` }, { status: 400 });
    }

    userId = authData.user.id;

    // Step 4: Update the profile row with encrypted sensitive data
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        username: encrypt(username),
        full_name: encrypt(fullName),
        email: encrypt(email),
        domain,
        site_name: siteName,
        site_description: siteDescription,
        subscription_plan: finalPlanId,
        subscription_status: finalSubscriptionStatus,
        subscription_end_date: subscriptionEndDate ? subscriptionEndDate.toISOString() : null,
        role: 'admin',
        last_subscription_from: 'get-started'
      })
      .eq('id', userId); 

    if (profileError) {
      throw new Error(`প্রোফাইল আপডেট করতে সমস্যা হয়েছে: ${profileError.message}`);
    }

    // Step 5: If the plan is not free, create the payment record.
    if (finalPlanId !== 'free') {
      const priceString = String(planData?.price || '0');
      const priceNumber = parseFloat(priceString.replace(/[^0-9.]/g, '')) || 0;
      const finalTransactionId = (transactionId && transactionId.trim()) ? transactionId.trim() : uuidv4();

      const { error: paymentError } = await supabaseAdmin
        .from('subscription_payments')
        .insert({
          user_id: userId,
          plan_id: finalPlanId,
          amount: priceNumber,
          payment_method: paymentMethod || 'manual',
          transaction_id: finalTransactionId,
          status: finalPaymentStatus,
          subscription_from: 'get-started',
        });
      
      if (paymentError) {
        if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
        if (paymentError.code === '23505' || paymentError.message.includes('subscription_payments_transaction_id_key')) {
            return NextResponse.json({ error: 'এই ট্রানজেকশন আইডিটি ইতিমধ্যে ব্যবহৃত হয়েছে।' }, { status: 409 });
        }
        return NextResponse.json({ error: `পেমেন্ট রেকর্ড তৈরি করা যায়নি: ${paymentError.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ user: authData.user }, { status: 200 });

  } catch (err: any) {
    if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
    console.error("Full Registration Process Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
