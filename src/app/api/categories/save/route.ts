
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, siteId, name, description, icon, image_url, card_color, parent_id } = body;

    if (!siteId || !name) {
      return NextResponse.json({ error: 'Site ID and Name are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // SUBSCRIPTION STATUS CHECK
    const { data: profileStatus } = await supabaseAdmin
        .from('profiles')
        .select('subscription_status')
        .eq('id', siteId)
        .single();

    const blockedStatuses = ['inactive', 'canceled', 'pending', 'pending_verification', 'failed'];
    if (profileStatus && blockedStatuses.includes(profileStatus.subscription_status)) {
        return NextResponse.json({ 
            error: 'আপনার সাবস্ক্রিপশন সক্রিয় নয়। নতুন ক্যাটাগরি তৈরি বা আপডেট করতে দয়া করে পেমেন্ট নিশ্চিত করুন।' 
        }, { status: 403 });
    }

    const payload = {
      site_id: siteId,
      name,
      description: description || null,
      icon: icon || 'Package',
      image_url: image_url || null,
      card_color: card_color || null,
      parent_id: parent_id ? parseInt(parent_id) : null,
    };

    let result;
    if (id) {
      // Update
      const { data, error } = await supabaseAdmin
        .from('categories')
        .update(payload)
        .match({ id, site_id: siteId })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create
      const { data, error } = await supabaseAdmin
        .from('categories')
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, category: result }, { status: 200 });
  } catch (err: any) {
    console.error('Save Category API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
