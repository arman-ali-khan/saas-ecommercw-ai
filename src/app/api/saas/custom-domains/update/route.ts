
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { id, siteId, status, dnsInfo } = await request.json();

    if (!id || !siteId || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: requestData, error: updateReqError } = await supabaseAdmin
      .from('custom_domain_requests')
      .update({ status, dns_info: dnsInfo, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateReqError) throw updateReqError;

    if (status === 'active') {
        await supabaseAdmin.from('profiles').update({ custom_domain: requestData.custom_domain }).eq('id', siteId);
    } else if (status === 'rejected') {
        await supabaseAdmin.from('profiles').update({ custom_domain: null }).eq('id', siteId);
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.headers.get('host')}`;

    // Create notification with Push for store admin
    await fetch(`${baseUrl}/api/notifications/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            recipientId: siteId,
            recipientType: 'admin',
            siteId: siteId,
            message: `আপনার ডোমেইন রিকোয়েস্ট (${requestData.custom_domain}) আপডেট করা হয়েছে: ${status}`,
            link: '/admin/settings/custom-domain'
        }),
    }).catch(e => console.error("Domain update push failed", e));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Update Domain API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
