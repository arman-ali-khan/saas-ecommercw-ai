
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  const id = searchParams.get('id'); // Order number or Transaction ID

  if (!domain || !id) return NextResponse.json({ error: 'Domain and ID required' }, { status: 400 });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('domain', domain).single();
    if (!profile) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('order_number, status, created_at, total, payment_method')
      .eq('site_id', profile.id)
      .or(`order_number.eq.${id},transaction_id.eq.${id}`)
      .maybeSingle();

    if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    return NextResponse.json({ order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
