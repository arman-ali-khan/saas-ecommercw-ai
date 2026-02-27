
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
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.headers.get('host')}`;

    if (id) {
      const { data, error } = await supabaseAdmin
        .from('product_qna')
        .update(qnaData)
        .match({ id, site_id: siteId })
        .select('*, products(name)')
        .single();
      
      if (error) throw error;
      result = data;

      if (result && result.customer_id && qnaData.answer) {
          // Send push via internal notification API
          await fetch(`${baseUrl}/api/notifications/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  recipientId: result.customer_id,
                  recipientType: 'customer',
                  siteId: siteId,
                  message: `"${result.products?.name || 'পণ্যের'}" বিষয়ে আপনার প্রশ্নের উত্তর দেওয়া হয়েছে।`,
                  link: `/products/${result.product_id}`,
              }),
          }).catch(e => console.error("QNA Answer push failed", e));
      }
    } else {
      const { data, error } = await supabaseAdmin
        .from('product_qna')
        .insert({ ...qnaData, site_id: siteId })
        .select('*, products(name)')
        .single();
      
      if (error) throw error;
      result = data;

      // Notify admin about new question
      await fetch(`${baseUrl}/api/notifications/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              recipientId: siteId,
              recipientType: 'admin',
              siteId: siteId,
              message: `আপনার পণ্যে নতুন একটি প্রশ্ন এসেছে: "${result.products?.name}"`,
              link: '/admin/qna',
          }),
      }).catch(e => console.error("QNA New Question push failed", e));
    }

    return NextResponse.json({ success: true, qna: result }, { status: 200 });
  } catch (err: any) {
    console.error('Save QnA API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
