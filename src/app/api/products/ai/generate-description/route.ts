import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateProductDescription } from '@/ai/flows/generate-product-description';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Increase timeout to 60 seconds

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 });

    const { siteId, name, description, categories, origin } = body;

    if (!siteId || !name) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
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
        return NextResponse.json({ success: false, error: 'এআই ডেসক্রিপশন জেনারেটর শুধুমাত্র পেইড প্ল্যানে উপলব্ধ।' }, { status: 403 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'AI server is not configured.' }, { status: 500 });
    }

    const result = await generateProductDescription({
      apiKey,
      name,
      description,
      categories,
      origin
    });

    return NextResponse.json(result, { status: result.success ? 200 : 500 });

  } catch (err: any) {
    console.error('AI Generate Description Error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
