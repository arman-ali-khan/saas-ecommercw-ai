import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { identifier, domain } = await request.json();

    if (!identifier || !domain) {
      return NextResponse.json({ error: 'শনাক্তকারী এবং ডোমেইন প্রয়োজন।' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get site_id from domain
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('domain', domain)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json({ error: 'সাইট খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    // 2. Fetch order using order_number OR transaction_id
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('order_number, status, created_at') // Only select non-sensitive data
      .eq('site_id', profileData.id)
      .or(`order_number.eq.${identifier},transaction_id.eq.${identifier}`)
      .maybeSingle();

    if (orderError || !orderData) {
      return NextResponse.json({ error: 'আপনার প্রদান করা আইডি দিয়ে কোনো অর্ডার খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    return NextResponse.json({ order: orderData }, { status: 200 });
  } catch (err: any) {
    console.error('Track Order API Error:', err);
    return NextResponse.json({ error: 'সার্ভারে একটি সমস্যা হয়েছে।' }, { status: 500 });
  }
}
