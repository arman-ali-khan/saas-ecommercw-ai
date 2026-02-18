
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { siteId } = await request.json();

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch Profile data
    const profilePromise = supabaseAdmin
      .from('profiles')
      .select('site_name, site_description, subscription_plan, subscription_status')
      .eq('id', siteId)
      .single();

    // Fetch Store Settings
    const settingsPromise = supabaseAdmin
      .from('store_settings')
      .select('*')
      .eq('site_id', siteId)
      .single();

    // Fetch All Plans
    const plansPromise = supabaseAdmin
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    const [profileRes, settingsRes, plansRes] = await Promise.all([profilePromise, settingsPromise, plansPromise]);

    return NextResponse.json({
      profile: profileRes.data || {},
      settings: settingsRes.data || {},
      plans: plansRes.data || []
    }, { status: 200 });

  } catch (err: any) {
    console.error('Get Settings API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
