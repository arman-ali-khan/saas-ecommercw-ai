
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import CheckoutClient from '@/components/checkout-client';
import type { ShippingZone, SaasSettings } from '@/types';

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Checkout',
    description: 'Complete your purchase safely.',
  };
}

export default async function CheckoutPage({ params }: Props) {
  const { username } = await params;
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

  // 1. Fetch site profile
  const { data: profile } = await supabase.from('profiles').select('id').eq('domain', username).maybeSingle();
  if (!profile) notFound();

  // 2. Fetch shipping zones and payment settings in parallel
  const [shippingRes, settingsRes] = await Promise.all([
    supabase.from('shipping_zones').select('*').eq('site_id', profile.id).eq('is_enabled', true).order('price', { ascending: true }),
    supabase.from('store_settings').select('*').eq('site_id', profile.id).maybeSingle()
  ]);

  const shippingZones = (shippingRes.data as ShippingZone[]) || [];
  const paymentSettings = (settingsRes.data as SaasSettings) || null;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <CheckoutClient 
        siteId={profile.id} 
        username={username} 
        shippingZones={shippingZones} 
        paymentSettings={paymentSettings} 
      />
    </div>
  );
}
