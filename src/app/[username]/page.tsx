import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/product-card';
import { ArrowRight, SearchX } from 'lucide-react';
import HeroCarousel from '@/components/hero-carousel';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Section, Category, FlashDeal, StoreFeature, Product, ProductReview } from '@/types';
import FlashDealCarousel from '@/components/flash-deal-carousel';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getTranslations } from '@/lib/get-translations';
import CategoryCarousel from '@/components/category-carousel';
import FeaturesCarousel from '@/components/features-carousel';
import ReviewsCarousel from '@/components/reviews-carousel';

export const dynamic = 'force-dynamic';

const SectionSkeleton = () => (
    <div className="space-y-8">
        <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="aspect-[1/1] w-full" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            ))}
        </div>
    </div>
);

function FlashDeals({ deals, section, t }: { deals: FlashDeal[], section: Section, t: any }) {
  if (deals.length === 0) return null;
  return (
    <section>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-sm sm:text-md md:text-xl lg:text-3xl font-headline font-bold">{section.title}</h2>
        <Button asChild variant="ghost"><Link href={`/flash-deals`}>{t.homepage.viewAll} <ArrowRight className="ml-2" /></Link></Button>
      </div>
      <FlashDealCarousel deals={deals} />
    </section>
  );
}

function FeaturedProducts({ products, section }: { products: Product[], section: Section }) {
  if (products.length === 0) return null;
  return (
    <section>
      <h2 className="text-sm sm:text-md md:text-xl lg:text-3xl font-headline font-bold text-center mb-8">{section.title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}

function WhyUs({ features, section }: { features: StoreFeature[], section: Section }) {
    return (
        <section>
            <h2 className="text-sm sm:text-md md:text-xl lg:text-3xl font-headline font-bold text-center mb-8">{section.title}</h2>
            <FeaturesCarousel features={features} />
        </section>
    );
}

function CustomerReviews({ reviews, section }: { reviews: ProductReview[], section: Section }) {
    if (reviews.length === 0) return null;
    return (
        <section>
            <h2 className="text-sm sm:text-md md:text-xl lg:text-3xl font-headline font-bold text-center mb-8">{section.title}</h2>
            <ReviewsCarousel reviews={reviews} />
        </section>
    );
}

async function DynamicSectionProducts({ siteId, section, t }: { siteId: string, section: Section, t: any }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) { return cookieStore.get(name)?.value; },
    },
  });

  let query = supabase.from('products').select('*').eq('site_id', siteId);

  if (section.category) {
    query = query.overlaps('categories', [section.category]);
  }

  if (section.tags && section.tags.length > 0) {
      query = query.overlaps('categories', section.tags); 
  }

  if (section.minPrice !== undefined) {
      query = query.gte('price', section.minPrice);
  }
  
  if (section.maxPrice !== undefined) {
      query = query.lte('price', section.maxPrice);
  }

  const { data } = await query.limit(10);
  const products = (data as Product[]) || [];
  
  if (products.length === 0) return null;

  return (
    <section>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-sm sm:text-md md:text-xl lg:text-3xl font-headline font-bold">{section.title}</h2>
        <Button asChild variant="ghost">
            <Link href={`/products?${section.category ? `category=${encodeURIComponent(section.category)}` : ''}`}>
                {t.homepage.viewAll} <ArrowRight className="ml-2" />
            </Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}

export default async function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const t = await getTranslations(username);
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
      },
    }
  );

  const { data: profile } = await supabase.from('profiles').select('*').eq('domain', username).single();
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 min-h-[60vh]">
        <SearchX className="w-24 h-24 text-muted-foreground mb-6" />
        <h1 className="text-4xl font-headline font-bold">Store Not Found</h1>
        <p className="mt-4 max-w-md mx-auto text-lg text-muted-foreground">Could not load store profile for "{username}".</p>
        <Button asChild className="mt-8"><Link href="/">Go to Homepage</Link></Button>
      </div>
    );
  }

  const siteId = profile.id;
  const [
    settingsResult,
    slidesResult,
    categoriesResult,
    flashDealsResult,
    featuredProductsResult,
    storeFeaturesResult,
    reviewsResult
  ] = await Promise.all([
      supabase.from('store_settings').select('homepage_sections').eq('site_id', siteId).single(),
      supabase.from('carousel_slides').select('*').eq('site_id', siteId).eq('is_enabled', true).order('order', { ascending: true }),
      supabase.from('categories').select('*').eq('site_id', siteId).order('name', { ascending: true }),
      supabase.from('flash_deals').select('*, products!inner(*)').eq('site_id', siteId).eq('is_active', true).gt('end_date', new Date().toISOString()),
      supabase.from('products').select('*').eq('site_id', siteId).eq('is_featured', true).limit(5),
      supabase.from('store_features').select('*').eq('site_id', siteId).order('order', { ascending: true }),
      supabase.from('product_reviews').select('*').eq('site_id', siteId).eq('is_approved', true).limit(10).order('created_at', { ascending: false })
  ]);
  
  const sectionsToRender: Section[] = (() => {
    const dbSections = settingsResult.data?.homepage_sections;
    if (Array.isArray(dbSections)) return dbSections as Section[];
    const categories = (categoriesResult.data as Category[]) || [];
    const allCategories = [...new Set(categories.map(c => c.name))];
    return [
      { id: 'hero', title: 'Hero Carousel', enabled: true, isCategorySection: false },
      { id: 'flash_deals', title: 'Flash Deals', enabled: true, isCategorySection: false },
      { id: 'featured', title: 'Featured Products', enabled: true, isCategorySection: false },
      { id: 'why-us', title: t.homepage.whyUs, enabled: true, isCategorySection: false },
      ...allCategories.map((cat) => ({ id: `category-${cat.toLowerCase().replace(/\s+/g, '-')}`, title: cat, enabled: true, isCategorySection: true, category: cat })),
      { id: 'customer-reviews', title: t.homepage.customerReviews, enabled: true, isCategorySection: false },
    ];
  })();

  const heroSlides = (slidesResult.data || []).map(slide => ({
      id: slide.id,
      image: { imageUrl: slide.image_url, description: slide.title, imageHint: '' },
      title: slide.title,
      description: slide.description || '',
      link: slide.link || '',
      linkText: slide.link_text || 'Shop Now'
  }));

  const renderSection = (section: Section) => {
    if (!section.enabled) return null;
    switch (section.id) {
      case 'hero':
        return (
          <section key={section.id} className="space-y-16">
            <div className="w-full rounded-lg overflow-hidden">
              {heroSlides.length > 0 ? <HeroCarousel slides={heroSlides} /> : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center"><p className="text-muted-foreground">Welcome to the store!</p></div>
              )}
            </div>
            {categoriesResult.data && (categoriesResult.data.length > 0) && (
              <div>
                <h2 className="text-sm sm:text-md md:text-xl lg:text-3xl font-headline font-bold text-center mb-8">{t.homepage.shopByCategory}</h2>
                <CategoryCarousel categories={(categoriesResult.data as Category[])} />
              </div>
            )}
          </section>
        );
      case 'flash_deals':
        return <FlashDeals key={section.id} deals={(flashDealsResult.data as FlashDeal[]) || []} section={section} t={t} />;
      case 'featured':
        return <FeaturedProducts key={section.id} products={(featuredProductsResult.data as Product[]) || []} section={section} />;
      case 'why-us':
        return <WhyUs key={section.id} features={(storeFeaturesResult.data as StoreFeature[]) || []} section={section} />;
      case 'customer-reviews':
        return <CustomerReviews key={section.id} reviews={(reviewsResult.data as ProductReview[]) || []} section={section} />;
      default:
        return (
            <Suspense key={section.id} fallback={<SectionSkeleton />}>
                <DynamicSectionProducts siteId={siteId} section={section} t={t} />
            </Suspense>
        );
    }
  }

  return (
    <div className="space-y-16">
      {sectionsToRender.map(renderSection)}
    </div>
  );
}