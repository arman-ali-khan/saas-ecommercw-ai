import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { beautifyProductDetails } from '@/ai/flows/generate-product-description';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Increase timeout to 60 seconds

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { siteId, name, description, story, origin, categories } = body;

    if (!siteId || !name) {
      return NextResponse.json({ success: false, error: 'Site ID and Product Name are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('subscription_plan')
        .eq('id', siteId)
        .single();

    if (!profile || profile.subscription_plan === 'free') {
        return NextResponse.json({ 
            success: false,
            error: 'এই ফিচারটি শুধুমাত্র পেইড প্ল্যানে উপলব্ধ।' 
        }, { status: 403 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Server configuration missing (OpenRouter API Key).' }, { status: 500 });
    }

    const result = await beautifyProductDetails({
      apiKey,
      name,
      description,
      story,
      origin,
      categories
    });

    return NextResponse.json(result, { status: result.success ? 200 : 500 });

  } catch (err: any) {
    console.error("Beautify Details Route Error:", err);
    return NextResponse.json({ success: false, error: err.message || 'Server error occurred' }, { status: 500 });
  }
}
