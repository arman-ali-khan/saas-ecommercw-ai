
import { createClient } from '@supabase/supabase-js';
import SaasLandingClient from '@/components/saas-landing-client';
import { type Plan, type SaasFeature, type SaaSReview, type SaasShowcaseItem, type SaasSettings } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour (ISR)

export default async function SaasLandingPage() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all landing page data in parallel on the server
  const [
    plansRes,
    featuresRes,
    reviewsRes,
    showcaseRes,
    settingsRes
  ] = await Promise.all([
    supabaseAdmin.from('plans').select('*').order('price', { ascending: true }),
    supabaseAdmin.from('saas_features').select('*').order('name', { ascending: true }),
    supabaseAdmin.from('saas_reviews').select('*').eq('is_approved', true).order('created_at', { ascending: false }),
    supabaseAdmin.from('saas_showcase').select('*').eq('is_enabled', true).order('order', { ascending: true }),
    supabaseAdmin.from('saas_settings').select('*').eq('id', 1).single()
  ]);

  const settings = settingsRes.data as SaasSettings | null;
  const plans = (plansRes.data || []).map((plan: Plan) => ({
    name: plan.name,
    id: plan.id,
    price: plan.price === 0 ? 'Free' : `৳${plan.price}`,
    period: plan.period,
    description: plan.description,
    features: plan.features,
    cta:
      plan.id === 'enterprise'
        ? 'যোগাযোগ করুন'
        : plan.id === 'free'
          ? 'শুরু করুন'
          : 'প্রো বেছে নিন',
    isFeatured: plan.id === 'pro',
  }));

  const sections = settings?.homepage_sections && Array.isArray(settings.homepage_sections) 
    ? settings.homepage_sections 
    : [
        { id: 'hero', enabled: true },
        { id: 'features', enabled: true },
        { id: 'showcase', enabled: true },
        { id: 'stats', enabled: true },
        { id: 'pricing', enabled: true },
        { id: 'testimonial', enabled: true },
        { id: 'cta', enabled: true }
      ];

  return (
    <SaasLandingClient 
      plans={plans}
      features={(featuresRes.data || []) as SaasFeature[]}
      reviews={(reviewsRes.data || []) as SaaSReview[]}
      showcaseItems={(showcaseRes.data || []) as SaasShowcaseItem[]}
      settings={settings}
      sections={sections}
    />
  );
}
