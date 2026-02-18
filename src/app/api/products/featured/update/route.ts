
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { siteId, featuredIds, unfeaturedIds } = await request.json();

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updates = [];

    // Products to mark as featured
    if (featuredIds && featuredIds.length > 0) {
      updates.push(
        supabaseAdmin
          .from('products')
          .update({ is_featured: true })
          .in('id', featuredIds)
          .eq('site_id', siteId)
      );
    }

    // Products to unmark from featured
    if (unfeaturedIds && unfeaturedIds.length > 0) {
      updates.push(
        supabaseAdmin
          .from('products')
          .update({ is_featured: false })
          .in('id', unfeaturedIds)
          .eq('site_id', siteId)
      );
    }

    if (updates.length > 0) {
        const results = await Promise.all(updates);
        const hasError = results.some(res => res.error);
        if (hasError) {
            const firstError = results.find(res => res.error)?.error;
            throw new Error(firstError?.message || 'Failed to update featured status');
        }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Update Featured API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
