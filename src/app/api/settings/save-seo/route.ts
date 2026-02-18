
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { siteId, ...seoData } = await request.json();

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from('store_settings')
      .upsert({ 
        site_id: siteId,
        seo_title: seoData.seoTitle,
        seo_description: seoData.seoDescription,
        seo_keywords: seoData.seoKeywords
      }, { onConflict: 'site_id' });

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Save SEO API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
