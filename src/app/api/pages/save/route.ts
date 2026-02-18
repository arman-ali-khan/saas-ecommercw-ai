
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, site_id, title, slug, content, is_published } = body;

    if (!site_id || !title || !slug) {
      return NextResponse.json({ error: 'Missing required fields (site_id, title, slug)' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const payload = {
      site_id,
      title,
      slug,
      content: content || [],
      is_published: is_published ?? false,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (id) {
      // Update
      const { data, error } = await supabaseAdmin
        .from('pages')
        .update(payload)
        .match({ id, site_id })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'This slug is already in use by another page.' }, { status: 409 });
        }
        throw error;
      }
      result = data;
    } else {
      // Create
      const { data, error } = await supabaseAdmin
        .from('pages')
        .insert(payload)
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'This slug is already in use. Please choose another.' }, { status: 409 });
        }
        throw error;
      }
      result = data;
    }

    return NextResponse.json({ success: true, page: result }, { status: 200 });
  } catch (err: any) {
    console.error('Save Page API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
