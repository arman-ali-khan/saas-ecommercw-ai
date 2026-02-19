
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { beautifyProductDetails } from '@/ai/flows/generate-product-description';

export async function POST(request: Request) {
  try {
    const { siteId, name, description, story, origin, categories } = await request.json();

    if (!siteId || !name) {
      return NextResponse.json({ error: 'Site ID and Product Name are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch AI Settings
    const { data: settings } = await supabaseAdmin
      .from('store_settings')
      .select('gemini_api_key')
      .eq('site_id', siteId)
      .single();

    const apiKey = settings?.gemini_api_key || process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key is not configured. Please set it in AI Settings.' }, { status: 400 });
    }

    const result = await beautifyProductDetails({
      apiKey,
      name,
      description,
      story,
      origin,
      categories
    });

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

  } catch (err: any) {
    console.error('AI Beautify API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
