
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { ticketId, siteId } = await request.json();

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch Ticket
    let ticketQuery = supabaseAdmin
      .from('support_tickets')
      .select('*, profiles(site_name, full_name, email)')
      .eq('id', ticketId);
    
    if (siteId) {
        ticketQuery = ticketQuery.eq('site_id', siteId);
    }

    const { data: ticket, error: ticketError } = await ticketQuery.single();

    if (ticketError) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // 2. Fetch Messages
    const { data: messages, error: msgsError } = await supabaseAdmin
      .from('support_messages')
      .select('*, profiles(full_name)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (msgsError) throw msgsError;

    return NextResponse.json({ ticket, messages }, { status: 200 });
  } catch (err: any) {
    console.error('Get Ticket API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
