
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ProductCard from '@/components/product-card';
import type { FlashDeal } from '@/types';

type Props = {
  params: { username: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Flash Deals',
    description: 'Check out our limited-time flash deals!',
  };
}

export default async function AllFlashDealsPage({ params }: Props) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: site } = await supabase.from('profiles').select('id').eq('domain', params.username).single();
  if (!site) {
    notFound();
  }

  const { data: flashDeals, error } = await supabase
    .from('flash_deals')
    .select('*, products!inner(*)')
    .eq('site_id', site.id)
    .eq('is_active', true)
    .gt('end_date', new Date().toISOString())
    .order('end_date', { ascending: true });
    
  if (error) {
    console.error("Error fetching flash deals:", error);
  }

  const deals = (flashDeals as FlashDeal[]) || [];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold">Flash Deals</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Hurry! These limited-time offers won't last long.
        </p>
      </div>
      
      {deals.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
          {deals.map((deal) => (
            <ProductCard
              key={deal.id}
              product={deal.products}
              flashDeal={deal}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">There are no active flash deals at the moment. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
