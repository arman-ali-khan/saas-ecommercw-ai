
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { userId, userType, token } = await request.json();

    if (!userId || !userType || !token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const table = userType === 'admin' ? 'profiles' : 'customer_profiles';

    // Fetch existing tokens
    const { data: profile } = await supabaseAdmin
      .from(table)
      .select('fcm_tokens')
      .eq('id', userId)
      .single();

    const existingTokens = profile?.fcm_tokens || [];
    
    if (!existingTokens.includes(token)) {
      const updatedTokens = [...existingTokens, token].slice(-5); // Keep last 5 devices
      const { error } = await supabaseAdmin
        .from(table)
        .update({ fcm_tokens: updatedTokens })
        .eq('id', userId);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Register FCM Token API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
