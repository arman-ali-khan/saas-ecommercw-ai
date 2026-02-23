
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { ticketId, status } = await request.json();

    if (!ticketId || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: updatedTicket, error } = await supabaseAdmin
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
      .select('*, profiles(site_name)')
      .single();

    if (error) throw error;

    // Notify the store admin about status change
    await supabaseAdmin.from('notifications').insert({
        recipient_id: updatedTicket.site_id,
        recipient_type: 'admin',
        site_id: updatedTicket.site_id,
        message: `আপনার টিকেট "${updatedTicket.title}"-এর স্ট্যাটাস পরিবর্তন করে "${status}" করা হয়েছে।`,
        link: `/admin/support/${ticketId}`
    });

    return NextResponse.json({ success: true, ticket: updatedTicket }, { status: 200 });
  } catch (err: any) {
    console.error('Update Ticket Status API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
