
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateProductDescription } from '@/ai/flows/generate-product-description';

export async function POST(request: Request) {
  try {
    const { siteId, name, description, categories, origin } = await request.json();

    if (!siteId || !name) {
      return NextResponse.json({ error: 'Site ID and Product Name are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Plan Restriction Check
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('subscription_plan')
        .eq('id', siteId)
        .single();

    if (!profile || profile.subscription_plan === 'free') {
        return NextResponse.json({ 
            error: 'এআই ফিচারটি শুধুমাত্র প্রিমিয়াম ইউজারদের জন্য। দয়া করে আপনার প্ল্যান আপগ্রেড করুন।' 
        }, { status: 403 });
    }

    // 2. Fetch AI Settings
    const { data: settings } = await supabaseAdmin
      .from('store_settings')
      .select('gemini_api_key')
      .eq('site_id', siteId)
      .single();

    const apiKey = settings?.gemini_api_key || process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'AI capabilities are not configured for this store. Please contact support.' }, { status: 400 });
    }

    const result = await generateProductDescription({
      apiKey,
      name,
      description,
      categories,
      origin
    });

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

  } catch (err: any) {
    console.error('AI Generate Description API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
