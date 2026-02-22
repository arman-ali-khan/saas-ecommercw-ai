
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

    // 1. Update Request Record
    const { data: requestData, error: updateReqError } = await supabaseAdmin
      .from('custom_domain_requests')
      .update({ status, dns_info: dnsInfo, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateReqError) throw updateReqError;

    // 2. If status is 'active', update the profile's main custom_domain field
    if (status === 'active') {
        await supabaseAdmin
            .from('profiles')
            .update({ custom_domain: requestData.custom_domain })
            .eq('id', siteId);
    } else if (status === 'rejected') {
        await supabaseAdmin
            .from('profiles')
            .update({ custom_domain: null })
            .eq('id', siteId);
    }

    // 3. Notify Store Admin
    await supabaseAdmin.from('notifications').insert({
        recipient_id: siteId,
        recipient_type: 'admin',
        site_id: siteId,
        message: `Your custom domain request for ${requestData.custom_domain} has been marked as: ${status}`,
        link: '/admin/settings/custom-domain'
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Update Custom Domain API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
