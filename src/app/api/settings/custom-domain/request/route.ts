
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

    // 2. Upsert Request (Allow changing even if one exists)
    const { error } = await supabaseAdmin
      .from('custom_domain_requests')
      .upsert({ 
          site_id: siteId, 
          custom_domain: domain, 
          status: 'pending',
          updated_at: new Date().toISOString()
      }, { onConflict: 'site_id' });

    if (error) {
        if (error.code === '23505') return NextResponse.json({ error: 'This domain is already requested by another store.' }, { status: 409 });
        throw error;
    }

    // 3. Clear from profile if it was active (resetting to pending)
    await supabaseAdmin.from('profiles').update({ custom_domain: null }).eq('id', siteId);

    // 4. Notify SaaS Admins
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.headers.get('host')}`;
    await fetch(`${baseUrl}/api/notifications/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            recipientType: 'admin',
            siteId: siteId,
            message: `New/Updated custom domain request for: ${domain}`,
            link: '/dashboard/custom-domains'
        }),
    }).catch(e => console.error("Domain notification failed", e));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Custom Domain Request API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
