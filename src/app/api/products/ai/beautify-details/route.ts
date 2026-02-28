import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { beautifyProductDetails } from '@/ai/flows/generate-product-description';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { siteId, name, description, story, origin, categories } = body;

    if (!siteId || !name) {
      return NextResponse.json({ error: 'Site ID and Product Name are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Subscription Check (Paid feature)
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('subscription_plan')
        .eq('id', siteId)
        .single();

    if (!profile || profile.subscription_plan === 'free') {
        return NextResponse.json({ 
            error: 'এই ফিচারটি শুধুমাত্র প্রো এবং এন্টারপ্রাইজ ইউজারদের জন্য। দয়া করে আপনার প্ল্যান আপগ্রেড করুন।' 
        }, { status: 403 });
    }

    // 2. Load OpenRouter API Key from .env
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("Critical: OPENROUTER_API_KEY is missing in server environment");
      return NextResponse.json({ error: 'AI server configuration is missing. Please contact support.' }, { status: 500 });
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
    console.error('AI API Route Crash:', err);
    return NextResponse.json({ error: 'A server-side error occurred while processing AI request.' }, { status: 500 });
  }
}
