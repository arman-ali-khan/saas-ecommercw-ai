
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API to cancel a custom domain request or remove an active custom domain.
 */
export async function POST(request: Request) {
  try {
    const { siteId } = await request.json();

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Delete from custom_domain_requests
    const { error: deleteError } = await supabaseAdmin
      .from('custom_domain_requests')
      .delete()
      .eq('site_id', siteId);

    if (deleteError) throw deleteError;

    // 2. Remove from profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ custom_domain: null })
      .eq('id', siteId);

    if (profileError) throw profileError;

    return NextResponse.json({ success: true, message: 'Custom domain removed successfully.' }, { status: 200 });
  } catch (err: any) {
    console.error('Cancel Custom Domain API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
