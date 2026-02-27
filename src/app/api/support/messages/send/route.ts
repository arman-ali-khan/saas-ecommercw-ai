
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { ticketId, siteId, message, image_url, role, saasAdminId } = await request.json();

    if (!ticketId || !message || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: ticket, error: tErr } = await supabaseAdmin
        .from('support_tickets')
        .select('site_id, title')
        .eq('id', ticketId)
        .single();
    
    if (tErr) throw tErr;

    const senderId = role === 'saas_admin' ? saasAdminId : ticket.site_id;
    const { data: newMsg, error: mErr } = await supabaseAdmin
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: senderId,
        sender_role: role,
        message,
        image_url: image_url || null
      })
      .select()
      .single();

    if (mErr) throw mErr;

    const updateData: any = { updated_at: new Date().toISOString() };
    if (role === 'saas_admin') {
        updateData.status = 'in_progress';
    }
    await supabaseAdmin.from('support_tickets').update(updateData).eq('id', ticketId);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.headers.get('host')}`;

    if (role === 'saas_admin') {
        // Notify Store Admin via push
        await fetch(`${baseUrl}/api/notifications/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipientId: ticket.site_id,
                recipientType: 'admin',
                siteId: ticket.site_id,
                message: `সাপোর্ট টিকেট "${ticket.title}"-এ নতুন রিপ্লাই এসেছে।`,
                link: `/admin/support/${ticketId}`
            }),
        }).catch(e => console.error("Support response push failed", e));
    } else {
        // Notify SaaS Admins via push
        await fetch(`${baseUrl}/api/notifications/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipientType: 'admin',
                siteId: ticket.site_id,
                message: `স্টোর অ্যাডমিন রিপ্লাই দিয়েছে: "${ticket.title}"`,
                link: `/dashboard/support/${ticketId}`
            }),
        }).catch(e => console.error("Support admin alert push failed", e));
    }

    return NextResponse.json({ success: true, message: newMsg }, { status: 201 });
  } catch (err: any) {
    console.error('Send Message API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
