
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, siteId, ...qnaData } = body;

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let result;
    if (id) {
      // Update existing Q&A (usually answering)
      const { data, error } = await supabaseAdmin
        .from('product_qna')
        .update(qnaData)
        .match({ id, site_id: siteId })
        .select('*, products(name)')
        .single();
      
      if (error) throw error;
      result = data;

      // If an answer is provided, notify the customer
      if (result && result.customer_id && qnaData.answer) {
          const notificationMessage = `Your question about "${result.products?.name || 'a product'}" has been answered.`;
          await supabaseAdmin.from('notifications').insert({
              recipient_id: result.customer_id,
              recipient_type: 'customer',
              site_id: siteId,
              message: notificationMessage,
              link: `/products/${result.product_id}`,
          });
      }
    } else {
      // Create new Q&A (manually by admin if needed)
      const { data, error } = await supabaseAdmin
        .from('product_qna')
        .insert({ ...qnaData, site_id: siteId })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, qna: result }, { status: 200 });
  } catch (err: any) {
    console.error('Save QnA API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
