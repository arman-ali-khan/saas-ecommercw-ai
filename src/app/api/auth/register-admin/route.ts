
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { encrypt } from '@/lib/encryption';

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

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        username: encrypt(username),
        full_name: encrypt(fullName),
        email: encrypt(email),
        domain,
        site_name: siteName,
        site_description: siteDescription,
        subscription_plan: planId,
        subscription_status: planId === 'free' ? 'active' : 'pending_verification',
        role: 'admin',
        last_subscription_from: 'get-started'
      })
      .eq('id', userId); 

    if (profileError) {
      throw new Error(`প্রোফাইল আপডেট করতে সমস্যা হয়েছে: ${profileError.message}`);
    }

    if (planId !== 'free') {
      const { data: planData, error: planError } = await supabaseAdmin
        .from('plans')
        .select('id, price')
        .eq('id', planId)
        .single();

      if (planError || !planData) {
        throw new Error('পেমেন্ট রেকর্ড তৈরির সময় অবৈধ প্ল্যান পাওয়া গেছে।');
      }
      
      const priceString = String(planData.price || '0');
      const priceNumber = parseFloat(priceString.replace(/[^0-9.]/g, '')) || 0;
      const finalTransactionId = (transactionId && transactionId.trim()) ? transactionId.trim() : uuidv4();

      const { error: paymentError } = await supabaseAdmin
        .from('subscription_payments')
        .insert({
          user_id: userId,
          plan_id: planData.id,
          amount: priceNumber,
          payment_method: paymentMethod || 'manual',
          transaction_id: finalTransactionId,
          status: 'pending_verification',
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
