
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { siteId, title, description, image_url, priority } = await request.json();

    if (!siteId || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Create Ticket
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        site_id: siteId,
        title,
        description,
        image_url: image_url || null,
        priority: priority || 'normal',
        status: 'open'
      })
      .select('*, profiles(site_name)')
      .single();

    if (ticketError) throw ticketError;

    // 2. Notify SaaS Admins
    await supabaseAdmin.from('notifications').insert({
      recipient_type: 'admin', // System admins are recipients
      site_id: siteId, // Track source site
      message: `নতুন সাপোর্ট টিকেট: "${title}" (স্টোর: ${ticket.profiles?.site_name})`,
      link: `/dashboard/support/${ticket.id}`
    });

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (err: any) {
    console.error('Create Ticket API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
