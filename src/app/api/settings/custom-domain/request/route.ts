
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { siteId, domain } = await request.json();

    if (!siteId || !domain) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Plan Check
    const { data: profile } = await supabaseAdmin.from('profiles').select('subscription_plan').eq('id', siteId).single();
    if (!profile || profile.subscription_plan === 'free') {
        return NextResponse.json({ error: 'Custom domain is only available for Pro and Enterprise plans.' }, { status: 403 });
    }

    // 2. Check if already exists
    const { data: existing } = await supabaseAdmin.from('custom_domain_requests').select('id').eq('site_id', siteId).maybeSingle();
    
    if (existing) {
        return NextResponse.json({ error: 'You already have an active request.' }, { status: 409 });
    }

    // 3. Insert Request
    const { error } = await supabaseAdmin
      .from('custom_domain_requests')
      .insert({ site_id: siteId, custom_domain: domain, status: 'pending' });

    if (error) {
        if (error.code === '23505') return NextResponse.json({ error: 'This domain is already requested by another store.' }, { status: 409 });
        throw error;
    }

    // 4. Notify SaaS Admins
    await supabaseAdmin.from('notifications').insert({
        recipient_type: 'admin', // System admins track all notifications
        message: `New custom domain request for: ${domain}`,
        link: '/dashboard/custom-domains'
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Custom Domain Request API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
