import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password, siteId } = await request.json();
    console.log(email,password,siteId,'hello')

    // এনভায়রনমেন্ট ভেরিয়েবল চেক
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'সার্ভার কনফিগারেশন ত্রুটি' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // ১. কাস্টমার খুঁজে বের করা
    const { data: user, error } = await supabaseAdmin
      .from('customer_profiles')
      .select('*')
      .eq('email', email)
      .eq('site_id', siteId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'ইমেল বা পাসওয়ার্ড সঠিক নয়' }, { status: 401 });
    }

    // ২. পাসওয়ার্ড ম্যাচ করা
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json({ error: 'ইমেল বা পাসওয়ার্ড সঠিক নয়' }, { status: 401 });
    }

    // ৩. সেনসিটিভ ডাটা বাদ দিয়ে ইউজার রিটার্ন করা
    const { password_hash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser }, { status: 200 });

  } catch (err: any) {
    console.error("Login API Error:", err);
    return NextResponse.json({ error: 'সার্ভারে সমস্যা হয়েছে' }, { status: 500 });
  }
}