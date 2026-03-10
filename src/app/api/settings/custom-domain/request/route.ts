
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API to request a custom domain for a store.
 * Uses a safe check-then-update approach to avoid ON CONFLICT constraint errors.
 */
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

    // 2. Domain availability check (across all sites)
    const { data: domainInUse } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('custom_domain', domain)
        .neq('id', siteId)
        .maybeSingle();
    
    if (domainInUse) {
        return NextResponse.json({ error: 'This domain is already connected to another store.' }, { status: 409 });
    }

    // 3. Manual check for existing request instead of upsert to avoid constraint errors
    const { data: existingRequest } = await supabaseAdmin
        .from('custom_domain_requests')
        .select('id')
        .eq('site_id', siteId)
        .maybeSingle();

    const requestPayload = { 
        site_id: siteId, 
        custom_domain: domain, 
        status: 'pending',
        updated_at: new Date().toISOString()
    };

    let dbError;
    if (existingRequest) {
        // Update existing request
        const { error } = await supabaseAdmin
            .from('custom_domain_requests')
            .update(requestPayload)
            .eq('id', existingRequest.id);
        dbError = error;
    } else {
        // Insert new request
        const { error } = await supabaseAdmin
            .from('custom_domain_requests')
            .insert(requestPayload);
        dbError = error;
    }

    if (dbError) {
        if (dbError.code === '23505') return NextResponse.json({ error: 'This domain has already been requested.' }, { status: 409 });
        throw dbError;
    }

    // 4. Clear from profile if it was active (resetting to pending)
    await supabaseAdmin.from('profiles').update({ custom_domain: null }).eq('id', siteId);

    // 5. Notify SaaS Admins
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.headers.get('host')}`;
    await fetch(`${baseUrl}/api/notifications/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            recipientType: 'admin',
            siteId: siteId,
            message: `নতুন কাস্টম ডোমেইন রিকোয়েস্ট: ${domain}`,
            link: '/dashboard/custom-domains'
        }),
    }).catch(e => console.error("Domain notification failed", e));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Custom Domain Request API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
