
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

    // 1. Check ticket existence and current status
    const { data: ticket, error: tErr } = await supabaseAdmin
        .from('support_tickets')
        .select('site_id, title')
        .eq('id', ticketId)
        .single();
    
    if (tErr) throw tErr;

    // 2. Save Message
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

    // 3. Update ticket timestamp and status if SaaS admin replies
    const updateData: any = { updated_at: new Date().toISOString() };
    if (role === 'saas_admin') {
        updateData.status = 'in_progress';
    }
    await supabaseAdmin.from('support_tickets').update(updateData).eq('id', ticketId);

    // 4. Send Notification to recipient
    if (role === 'saas_admin') {
        // Notify Store Admin
        await supabaseAdmin.from('notifications').insert({
            recipient_id: ticket.site_id,
            recipient_type: 'admin',
            site_id: ticket.site_id,
            message: `আপনার সাপোর্ট টিকেটে নতুন রিপ্লাই এসেছে: "${ticket.title}"`,
            link: `/admin/support/${ticketId}`
        });
    } else {
        // Notify SaaS Admin (Platform-wide)
        await supabaseAdmin.from('notifications').insert({
            recipient_type: 'admin', // Marked as global admin type notification
            site_id: ticket.site_id,
            message: `স্টোর অ্যাডমিন রিপ্লাই দিয়েছে: "${ticket.title}"`,
            link: `/dashboard/support/${ticketId}`
        });
    }

    return NextResponse.json({ success: true, message: newMsg }, { status: 201 });
  } catch (err: any) {
    console.error('Send Message API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
