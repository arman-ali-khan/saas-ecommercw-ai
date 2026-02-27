
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, siteId, ...reviewData } = body;

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.headers.get('host')}`;
    let result;

    if (id) {
      const { data, error } = await supabaseAdmin
        .from('product_reviews')
        .update(reviewData)
        .match({ id, site_id: siteId })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('product_reviews')
        .insert({ ...reviewData, site_id: siteId })
        .select()
        .single();
      
      if (error) throw error;
      result = data;

      // Notify admin about new review
      await fetch(`${baseUrl}/api/notifications/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              recipientId: siteId,
              recipientType: 'admin',
              siteId: siteId,
              message: `আপনার স্টোরে একটি নতুন রিভিউ জমা পড়েছে।`,
              link: '/admin/reviews',
          }),
      }).catch(e => console.error("Review push failed", e));
    }

    return NextResponse.json({ success: true, review: result }, { status: 200 });
  } catch (err: any) {
    console.error('Save Review API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
