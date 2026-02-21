
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
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import DynamicIcon from '@/components/dynamic-icon';

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

const getGridClass = (view?: string) => {
    switch(view) {
        case '1-col': return 'grid-cols-1';
        case 'list': return 'grid-cols-1 gap-3';
        case '2-col': return 'grid-cols-2';
        default: return null;
    }
};

function FlashDeals({ deals, section, t }: { deals: FlashDeal[], section: Section, t: any }) {
  if (deals.length === 0) return null;
  
  return (
    <section>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-sm sm:text-md md:text-xl lg:text-3xl font-headline font-bold">{section.title}</h2>
        <Button asChild variant="ghost"><Link href={`/flash-deals`}>{t.homepage.viewAll} <ArrowRight className="ml-2" /></Link></Button>
      </div>
      <FlashDealCarousel deals={deals} section={section} />
    </section>
  );
}

function CategoriesSection({ categories, section, t }: { categories: Category[], section: Section, t: any }) {
    if (categories.length === 0) return null;

    if (section.mobileView === 'list') {
        return (
            <section>
                <h2 className="text-sm sm:text-md md:text-xl lg:text-3xl font-headline font-bold text-center mb-8">{section.title}</h2>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
                    {categories.map(cat => (
                        <Link key={cat.id} href={`/products?category=${encodeURIComponent(cat.name)}`}>
                            <Card className="overflow-hidden h-full flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 border-2" style={{ backgroundColor: cat.card_color || 'hsl(var(--card))' }}>
                                <div className="relative aspect-square w-full">
                                    {cat.image_url ? (
                                        <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-muted">
                                            <DynamicIcon name={cat.icon || 'Package'} className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 mt-auto">
                                    <h3 className="font-bold text-center text-[10px] sm:text-sm truncate leading-tight">{cat.name}</h3>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>
        );
    }

    // Standard 2-col or Carousel
    return (
        <section>
            <h2 className="text-sm sm:text-md md:text-xl lg:text-3xl font-headline font-bold text-center mb-8">{section.title}</h2>
            {section.mobileView === '2-col' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {categories.map(cat => (
                        <Link key={cat.id} href={`/products?category=${encodeURIComponent(cat.name)}`}>
                            <Card className="overflow-hidden h-full transition-all hover:shadow-lg hover:-translate-y-1 border-2" style={{ backgroundColor: cat.card_color || 'hsl(var(--card))' }}>
                                <div className="relative aspect-square w-full">
                                    {cat.image_url ? (
                                        <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-muted">
                                            <DynamicIcon name={cat.icon || 'Package'} className="h-10 w-10 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <h3 className="font-bold text-center text-xs sm:text-base truncate">{cat.name}</h3>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <CategoryCarousel categories={categories} />
            )}
        </section>
    );
}

function FeaturedProducts({ products, section, t }: { products: Product[], section: Section, t: any }) {
  if (products.length === 0) return null;
  
  const gridClass = getGridClass(section.mobileView) || "grid-cols-2";

  return (
    <section>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-sm sm:text-md md:text-xl lg:text-3xl font-headline font-bold">{section.title}</h2>
        <Button asChild variant="ghost"><Link href={`/products`}>{t.homepage.viewAll} <ArrowRight className="ml-2" /></Link></Button>
      </div>
      <div className={cn("grid md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4", gridClass)}>
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            isList={section.mobileView === 'list'} 
          />
        ))}
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

  const gridClass = getGridClass(section.mobileView) || "grid-cols-2";

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
      <div className={cn("grid md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4", gridClass)}>
        {products.map((product) => (
            <ProductCard 
                key={product.id} 
                product={product} 
                isList={section.mobileView === 'list'} 
            />
        ))}
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
      supabase.from('products').select('*').eq('site_id', siteId).eq('is_featured', true).limit(10),
      supabase.from('store_features').select('*').eq('site_id', siteId).order('order', { ascending: true }),
      supabase.from('product_reviews').select('*').eq('site_id', siteId).eq('is_approved', true).limit(10).order('created_at', { ascending: false })
  ]);
  
  const sectionsToRender: Section[] = (() => {
    const dbSections = settingsResult.data?.homepage_sections;
    if (Array.isArray(dbSections)) return dbSections as Section[];
    
    return [
      { id: 'hero', title: 'Hero Carousel', enabled: true, isCategorySection: false, mobileView: '2-col' },
      { id: 'categories', title: t.homepage.shopByCategory, enabled: true, isCategorySection: false, mobileView: 'list' },
      { id: 'flash_deals', title: 'Flash Deals', enabled: true, isCategorySection: false, mobileView: '2-col' },
      { id: 'featured', title: 'Featured Products', enabled: true, isCategorySection: false, mobileView: '2-col' },
      { id: 'why-us', title: t.homepage.whyUs, enabled: true, isCategorySection: false, mobileView: '2-col' },
      { id: 'customer-reviews', title: t.homepage.customerReviews, enabled: true, isCategorySection: false, mobileView: '2-col' },
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
          </section>
        );
      case 'categories':
        return <CategoriesSection key={section.id} categories={(categoriesResult.data as Category[]) || []} section={section} t={t} />;
      case 'flash_deals':
        return <FlashDeals key={section.id} deals={(flashDealsResult.data as FlashDeal[]) || []} section={section} t={t} />;
      case 'featured':
        return <FeaturedProducts key={section.id} products={(featuredProductsResult.data as Product[]) || []} section={section} t={t} />;
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
