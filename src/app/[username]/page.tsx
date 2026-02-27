
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/product-card';
import { ArrowRight, SearchX, List, ChevronRight } from 'lucide-react';
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
import CategoriesGrid from '@/components/categories-grid';
import FeaturedProductsList from '@/components/featured-products-list';
import FeaturedCarousel from '@/components/featured-carousel';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        default: return 'grid-cols-2';
    }
};

function SectionTitle({ title, isFirst, isHeroPresent }: { title: string, isFirst: boolean, isHeroPresent: boolean }) {
    if (isFirst && !isHeroPresent) {
        return <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-headline font-bold">{title}</h1>;
    }
    return <h2 className="text-sm sm:text-md md:text-xl lg:text-3xl font-headline font-bold">{title}</h2>;
}

function FlashDeals({ deals, section, t, isFirst, isHeroPresent }: { deals: FlashDeal[], section: Section, t: any, isFirst: boolean, isHeroPresent: boolean }) {
  if (deals.length === 0) return null;
  
  return (
    <section>
      <div className="flex justify-between items-center mb-8">
        <SectionTitle title={section.title} isFirst={isFirst} isHeroPresent={isHeroPresent} />
        <Button asChild variant="ghost"><Link href={`/flash-deals`}>{t.homepage.viewAll} <ArrowRight className="ml-2" /></Link></Button>
      </div>
      <FlashDealCarousel deals={deals} section={section} />
    </section>
  );
}

function CategoriesSection({ categories, section, t, isFirst, isHeroPresent }: { categories: Category[], section: Section, t: any, isFirst: boolean, isHeroPresent: boolean }) {
    const selectedNames = section.selectedCategories || [];
    const filteredCategories = selectedNames.length > 0 
        ? categories.filter(c => selectedNames.includes(c.name))
        : categories;

    if (filteredCategories.length === 0) return null;

    const isCarousel = section.isCarousel !== false;
    const isListView = section.mobileView === 'list';

    return (
        <section>
            <div className="text-center mb-8">
                <SectionTitle title={section.title} isFirst={isFirst} isHeroPresent={isHeroPresent} />
            </div>
            {isCarousel ? (
                <CategoryCarousel categories={filteredCategories} />
            ) : isListView ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCategories.map(cat => (
                        <Link key={cat.id} href={`/products?category=${encodeURIComponent(cat.name)}`}>
                            <Card className="p-3 border-2 hover:border-primary/20 hover:shadow-md transition-all group flex items-center gap-4 overflow-hidden rounded-2xl">
                                <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-muted border group-hover:scale-105 transition-transform duration-500">
                                    {cat.image_url ? (
                                        <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <DynamicIcon name={cat.icon || 'Package'} className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors">{cat.name}</h3>
                                    {cat.description && <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{cat.description}</p>}
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <CategoriesGrid categories={filteredCategories} section={section} />
            )}
        </section>
    );
}

function FeaturedProducts({ products, section, siteId, t, isFirst, isHeroPresent }: { products: Product[], section: Section, siteId: string, t: any, isFirst: boolean, isHeroPresent: boolean }) {
  if (products.length === 0) return null;
  
  return (
    <section>
      <div className="flex justify-between items-center mb-8">
        <SectionTitle title={section.title} isFirst={isFirst} isHeroPresent={isHeroPresent} />
        <Button asChild variant="ghost"><Link href={`/products`}>{t.homepage.viewAll} <ArrowRight className="ml-2" /></Link></Button>
      </div>
      {section.isCarousel ? (
          <FeaturedCarousel products={products} section={section} />
      ) : (
          <FeaturedProductsList initialProducts={products} siteId={siteId} section={section} t={t} />
      )}
    </section>
  );
}

async function TopSellingSection({ siteId, section, t, isFirst, isHeroPresent }: { siteId: string, section: Section, t: any, isFirst: boolean, isHeroPresent: boolean }) {
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

  const { data: orders } = await supabase
    .from('orders')
    .select('cart_items')
    .eq('site_id', siteId)
    .eq('status', 'delivered');

  if (!orders || orders.length === 0) return null;

  const salesMap: Record<string, number> = {};
  orders.forEach(o => {
    (o.cart_items as any[]).forEach(item => {
      salesMap[item.id] = (salesMap[item.id] || 0) + item.quantity;
    });
  });

  const topIds = Object.entries(salesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, section.productLimit || 10)
    .map(entry => entry[0]);

  if (topIds.length === 0) return null;

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .in('id', topIds);

  if (!products || products.length === 0) return null;

  const sortedProducts = topIds
    .map(id => products.find(p => p.id === id))
    .filter(Boolean) as Product[];

  const gridClass = getGridClass(section.mobileView);

  return (
    <section>
      <div className="flex justify-between items-center mb-8">
        <SectionTitle title={section.title} isFirst={isFirst} isHeroPresent={isHeroPresent} />
        <Button asChild variant="ghost"><Link href={`/products`}>{t.homepage.viewAll} <ArrowRight className="ml-2" /></Link></Button>
      </div>
      {section.isCarousel ? (
          <FeaturedCarousel products={sortedProducts} section={section} />
      ) : (
          <div className={cn("grid md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4", gridClass)}>
            {sortedProducts.map((product) => (
                <ProductCard 
                    key={product.id} 
                    product={product} 
                    isList={section.mobileView === 'list'} 
                />
            ))}
          </div>
      )}
    </section>
  );
}

function WhyUs({ features, section, isFirst, isHeroPresent }: { features: StoreFeature[], section: Section, isFirst: boolean, isHeroPresent: boolean }) {
    return (
        <section>
            <div className="text-center mb-8">
                <SectionTitle title={section.title} isFirst={isFirst} isHeroPresent={isHeroPresent} />
            </div>
            <FeaturesCarousel features={features} />
        </section>
    );
}

function CustomerReviews({ reviews, section, isFirst, isHeroPresent }: { reviews: ProductReview[], section: Section, isFirst: boolean, isHeroPresent: boolean }) {
    if (reviews.length === 0) return null;
    return (
        <section>
            <div className="text-center mb-8">
                <SectionTitle title={section.title} isFirst={isFirst} isHeroPresent={isHeroPresent} />
            </div>
            <ReviewsCarousel reviews={reviews} />
        </section>
    );
}

async function DynamicSectionProducts({ siteId, section, t, isFirst, isHeroPresent }: { siteId: string, section: Section, t: any, isFirst: boolean, isHeroPresent: boolean }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) { return cookieStore.get(name)?.value; },
    },
  });

  let query = supabase.from('products').select('*').eq('site_id', siteId);

  if (section.category) query = query.overlaps('categories', [section.category]);
  if (section.tags && section.tags.length > 0) query = query.overlaps('categories', section.tags); 
  if (section.brand) query = query.overlaps('brand', [section.brand]);
  if (section.origin) query = query.eq('origin', section.origin);
  if (section.color) query = query.overlaps('color', [section.color]);
  if (section.minPrice !== undefined) query = query.gte('price', section.minPrice);
  if (section.maxPrice !== undefined) query = query.lte('price', section.maxPrice);

  const { data } = await query.limit(section.productLimit || 10);
  const products = (data as Product[]) || [];
  
  if (products.length === 0) return null;

  const gridClass = getGridClass(section.mobileView);

  return (
    <section>
      <div className="flex justify-between items-center mb-8">
        <SectionTitle title={section.title} isFirst={isFirst} isHeroPresent={isHeroPresent} />
        <Button asChild variant="ghost">
            <Link href={`/products?${section.category ? `category=${encodeURIComponent(section.category)}` : ''}`}>
                {t.homepage.viewAll} <ArrowRight className="ml-2" />
            </Link>
        </Button>
      </div>
      {section.isCarousel ? (
          <FeaturedCarousel products={products} section={section} />
      ) : (
          <div className={cn("grid md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4", gridClass)}>
            {products.map((product) => (
                <ProductCard 
                    key={product.id} 
                    product={product} 
                    isList={section.mobileView === 'list'} 
                />
            ))}
          </div>
      )}
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

  const { data: profile } = await supabase.from('profiles').select('*').eq('domain', username).maybeSingle();
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
      supabase.from('store_settings').select('homepage_sections').eq('site_id', siteId).maybeSingle(),
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
      { id: 'hero', title: 'Hero Carousel', enabled: true, isCategorySection: false, mobileView: '2-col', showSideCategories: false },
      { id: 'categories', title: t.homepage.shopByCategory, enabled: true, isCategorySection: false, mobileView: 'carousel', isCarousel: true },
      { id: 'flash_deals', title: 'Flash Deals', enabled: true, isCategorySection: false, mobileView: '2-col', isCarousel: true },
      { id: 'top_selling', title: 'সেরা বিক্রিত পণ্য', enabled: true, isCategorySection: false, mobileView: '2-col', isCarousel: true, productLimit: 10 },
      { id: 'featured', title: 'Featured Products', enabled: true, isCategorySection: false, mobileView: '2-col', productLimit: 10 },
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

  const isHeroPresent = sectionsToRender.some(s => s.id === 'hero' && s.enabled && heroSlides.length > 0);
  const visibleEnabledSections = sectionsToRender.filter(s => s.enabled);

  const renderSection = (section: Section, index: number) => {
    if (!section.enabled) return null;
    
    // Check if this is the first visible non-hero section
    const firstVisibleIdx = visibleEnabledSections.findIndex(s => s.id !== 'hero');
    const isFirstNonHero = section.id !== 'hero' && visibleEnabledSections[firstVisibleIdx]?.id === section.id;

    switch (section.id) {
      case 'hero':
        const allCategories = (categoriesResult.data as Category[]) || [];
        return (
          <section key={section.id} className="space-y-16">
            <div className={cn(
                "w-full rounded-lg overflow-hidden",
                section.showSideCategories && "md:grid md:grid-cols-[280px_1fr] md:gap-4 md:bg-transparent"
            )}>
              {section.showSideCategories && (
                  <div className="hidden md:flex flex-col bg-card border-2 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-primary/10 p-4 border-b">
                          <h3 className="font-bold flex items-center gap-2"><List className="h-4 w-4" /> সকল ক্যাটাগরি</h3>
                      </div>
                      <ScrollArea className="flex-1 max-h-[400px]">
                          <div className="p-2 space-y-1">
                              {allCategories.slice(0, 10).map(cat => (
                                  <Link key={cat.id} href={`/products?category=${encodeURIComponent(cat.name)}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors group">
                                      <div className="relative h-8 w-8 rounded-md overflow-hidden bg-muted shrink-0 border">
                                          {cat.image_url ? (
                                              <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
                                          ) : (
                                              <div className="flex h-full w-full items-center justify-center">
                                                  <DynamicIcon name={cat.icon || 'Package'} className="h-4 w-4 text-muted-foreground" />
                                              </div>
                                          )}
                                      </div>
                                      <span className="text-sm font-medium group-hover:text-primary truncate">{cat.name}</span>
                                      <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </Link>
                              ))}
                              {allCategories.length > 10 && (
                                  <Link href="/products" className="block text-center p-2 text-xs font-bold text-primary hover:underline">সবগুলো দেখুন</Link>
                              )}
                          </div>
                      </ScrollArea>
                  </div>
              )}
              <div className="w-full">
                {heroSlides.length > 0 ? <HeroCarousel slides={heroSlides} /> : (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center"><p className="text-muted-foreground">Welcome to the store!</p></div>
                )}
              </div>
            </div>
          </section>
        );
      case 'categories':
        return <CategoriesSection key={section.id} categories={(categoriesResult.data as Category[]) || []} section={section} t={t} isFirst={isFirstNonHero} isHeroPresent={isHeroPresent} />;
      case 'flash_deals':
        return <FlashDeals key={section.id} deals={(flashDealsResult.data as FlashDeal[]) || []} section={section} t={t} isFirst={isFirstNonHero} isHeroPresent={isHeroPresent} />;
      case 'top_selling':
        return (
            <Suspense key={section.id} fallback={<SectionSkeleton />}>
                <TopSellingSection siteId={siteId} section={section} t={t} isFirst={isFirstNonHero} isHeroPresent={isHeroPresent} />
            </Suspense>
        );
      case 'featured':
        const initialFeatured = (featuredProductsResult.data as Product[]) || [];
        const limitedFeatured = initialFeatured.slice(0, section.productLimit || 10);
        return <FeaturedProducts key={section.id} products={limitedFeatured} section={section} siteId={siteId} t={t} isFirst={isFirstNonHero} isHeroPresent={isHeroPresent} />;
      case 'why-us':
        return <WhyUs key={section.id} features={(storeFeaturesResult.data as StoreFeature[]) || []} section={section} isFirst={isFirstNonHero} isHeroPresent={isHeroPresent} />;
      case 'customer-reviews':
        return <CustomerReviews key={section.id} reviews={(reviewsResult.data as ProductReview[]) || []} section={section} isFirst={isFirstNonHero} isHeroPresent={isHeroPresent} />;
      default:
        return (
            <Suspense key={section.id} fallback={<SectionSkeleton />}>
                <DynamicSectionProducts siteId={siteId} section={section} t={t} isFirst={isFirstNonHero} isHeroPresent={isHeroPresent} />
            </Suspense>
        );
    }
  }

  return (
    <div className="space-y-16">
      {sectionsToRender.map((section, index) => renderSection(section, index))}
    </div>
  );
}
