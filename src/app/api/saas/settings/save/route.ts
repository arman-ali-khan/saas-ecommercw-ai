
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', session.user.id).single();
    if (profile?.role !== 'saas_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Map incoming data to DB column names
    const payload = {
        platform_name: data.platform_name || data.platformName,
        platform_description: data.platform_description || data.platformDescription,
        logo_url: data.logo_url,
        favicon_url: data.favicon_url,
        base_domain: data.base_domain,
        social_facebook: data.social_facebook,
        social_twitter: data.social_twitter,
        social_tiktok: data.social_tiktok,
        seo_title: data.seo_title || data.seoTitle,
        seo_description: data.seo_description || data.seoDescription,
        seo_keywords: data.seo_keywords || data.seoKeywords,
        mobile_banking_enabled: data.mobile_banking_enabled || data.mobileBankingEnabled,
        mobile_banking_number: data.mobile_banking_number || data.mobileBankingNumber,
        accepted_banking_methods: data.accepted_banking_methods || data.acceptedBankingMethods,
        // New Landing Page Fields
        hero_title: data.hero_title,
        hero_description: data.hero_description,
        hero_image_url: data.hero_image_url,
        cta_title: data.cta_title,
        cta_description: data.cta_description,
        cta_bg_color: data.cta_bg_color,
        global_ai_api_key: data.global_ai_api_key,
        // Advanced SEO Fields
        google_analytics_id: data.google_analytics_id || data.googleAnalyticsId,
        facebook_pixel_id: data.facebook_pixel_id || data.facebookPixelId,
        google_search_console_tag: data.google_search_console_tag || data.googleSearchConsoleTag,
        robots_txt_content: data.robots_txt_content || data.robotsTxtContent,
    };

    // Remove undefined values
    Object.keys(payload).forEach(key => (payload as any)[key] === undefined && delete (payload as any)[key]);

    const { error } = await supabaseAdmin
      .from('saas_settings')
      .upsert({ id: 1, ...payload }, { onConflict: 'id' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Save SaaS Settings API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
