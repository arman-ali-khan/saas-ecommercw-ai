


import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import ProductCard from '@/components/product-card';
import { ArrowRight, Leaf, Users, Heart, SearchX, Star } from 'lucide-react';
import HeroCarousel from '@/components/hero-carousel';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Section, Category, FlashDeal, StoreFeature, Product, ProductReview } from '@/types';
import DynamicIcon from '@/components/dynamic-icon';
import { cn } from '@/lib/utils';
import FlashDealCarousel from '@/components/flash-deal-carousel';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getTranslations } from '@/lib/get-translations';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const dynamic = 'force-dynamic';

// --- Skeletons for Suspense ---
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

const WhyUsSkeleton = () => (
     <div className="space-y-8">
        <Skeleton className="h-8 w-1/2 mx-auto" />
        <div className="w-full overflow-hidden">
            <div className="flex -ml-6">
                 {[...Array(5)].map((_, i) => (
                    <div key={i} className="pl-6 basis-1/2 md:basis-1/4 lg:basis-1/5">
                        <Skeleton className="h-64 w-full" />
                    </div>
                ))}
            </div>
        </div>
    </div>
)

// --- Synchronous Presentation Components ---
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
    if (features.length === 0) {
         const fallbackFeatures = [
            { image: PlaceHolderImages.find(img => img.imageHint === 'farm landscape') || PlaceHolderImages[10], icon: Leaf, title: 'আমাদের ভূমি থেকে, আপনার ঘরে', description: 'আমরা আপনাকে এমন পণ্য সরবরাহ করতে প্রতিশ্রুতিবদ্ধ যা তাদের উৎপত্তিস্থলের মতোই প্রাকৃতিক।' },
            { image: PlaceHolderImages.find(img => img.imageHint === 'farmer smiling') || PlaceHolderImages[10], icon: Users, title: 'কৃষক সম্প্রদায়ের সাথে অংশীদারিত্ব', description: 'আমরা স্থানীয় কৃষকদের সাথে সরাসরি কাজ করি, ন্যায্য মূল্য নিশ্চিত করি এবং টেকসই কৃষি অনুশীলনে সহায়তা করি।' },
            { image: PlaceHolderImages.find(img => img.imageHint === 'quality inspection') || PlaceHolderImages[12], icon: Heart, title: 'বিশুদ্ধতা এবং গুণমানের প্রতিশ্রুতি', description: 'প্রতিটি পণ্য কঠোর মান পরীক্ষার মধ্য দিয়ে যায়। আপনি কেবল সেরা এবং সবচেয়ে বিশুদ্ধ পণ্য পাবেন।' }
        ];

        return (
             <section>
                <h2 className="text-sm sm:text-md md:text-xl lg:text-3xl font-headline font-bold text-center mb-8">{section.title}</h2>
                 <Carousel opts={{ align: 'start' }} className="w-full">
                    <CarouselContent className="-ml-6">
                        {fallbackFeatures.map((feature, index) => (
                            <CarouselItem key={index} className="pl-6 basis-1/2 md:basis-1/4 lg:basis-1/5">
                                <Card className="overflow-hidden flex flex-col h-full">
                                    <div className="relative h-64 w-full">
                                        <Image src={feature.image.imageUrl} alt={feature.title} data-ai-hint={feature.image.imageHint} fill className="object-cover" />
                                    </div>
                                    <div className="p-6 flex flex-col flex-grow">
                                        <CardHeader className="p-0">
                                            <feature.icon className="w-10 h-10 text-accent mb-4" />
                                            <CardTitle className="font-headline text-base sm:text-lg">{feature.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0 mt-4 flex-grow">
                                            <p className="text-muted-foreground text-xs">{feature.description}</p>
                                        </CardContent>
                                        <Button asChild variant="secondary" className="mt-6 w-fit"><Link href={`/about`}>আরও জানুন <ArrowRight className="ml-2" /></Link></Button>
                                    </div>
                                </Card>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </section>
        );
    }
    
    return (
        <section>
            <h2 className="text-sm sm:text-md md:text-xl lg:text-3xl font-headline font-bold text-center mb-8">{section.title}</h2>
            <Carousel opts={{ align: 'start' }} className="w-full">
            <CarouselContent className="-ml-6">
                {features.map((feature) => (
                <CarouselItem key={feature.id} className="pl-6 basis-1/2 md:basis-1/4 lg:basis-1/5">
                    <Card className="overflow-hidden flex flex-col text-center h-full">
                    <CardHeader className="p-0">
                        <div className="relative h-28 sm:h-[200px] w-full bg-muted flex items-center justify-center">
                        {feature.image_url ? (
                            <Image src={feature.image_url} alt={feature.title} fill className="object-cover" />
                        ) : (
                            <div className="bg-primary/10 p-4 rounded-full">
                            <DynamicIcon name={feature.icon} className="w-10 h-10 text-primary" />
                            </div>
                        )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 flex flex-col flex-grow items-center">
                        <CardTitle className="font-headline text-base sm:text-lg">{feature.title}</CardTitle>
                        <p className="text-muted-foreground text-xs mt-2 flex-grow">{feature.description}</p>
                    </CardContent>
                    </Card>
                </CarouselItem>
                ))}
            </CarouselContent>
            </Carousel>
        </section>
    );
}

function CustomerReviews({ reviews, section }: { reviews: ProductReview[], section: Section }) {
    if (reviews.length === 0) return null;
    
    return (
        <section>
            <h2 className="text-sm sm:text-md md:text-xl lg:text-3xl font-headline font-bold text-center mb-8">{section.title}</h2>
            <Carousel opts={{ align: 'start', loop: reviews.length > 3 }} className="w-full">
            <CarouselContent className="-ml-6">
                {reviews.map((review) => (
                <CarouselItem key={review.id} className="pl-6 basis-full md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full flex flex-col">
                    <CardHeader className="flex-row items-center gap-4">
                        <Avatar><AvatarFallback>{review.customer_name.charAt(0)}</AvatarFallback></Avatar>
                        <div>
                        <CardTitle className="text-base">{review.customer_name}</CardTitle>
                        <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={cn("h-4 w-4", i < review.rating ? "text-primary fill-primary" : "text-muted-foreground/30")} />
                            ))}
                        </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="font-semibold">{review.title}</p>
                        <p className="text-muted-foreground text-sm italic">"{review.review_text}"</p>
                    </CardContent>
                    </Card>
                </CarouselItem>
                ))}
            </CarouselContent>
            </Carousel>
        </section>
    );
}

// --- Async Components that remain for scalability ---
async function CategoryProducts({ siteId, section, t }: { siteId: string, section: Section, t: any }) {
  if (!section.category) return null;
  const cookieStore = cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) { return cookieStore.get(name)?.value; },
      set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch (error) {} },
      remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch (error) {} },
    },
  });
  const { data } = await supabase.from('products').select('*').eq('site_id', siteId).overlaps('categories', [section.category]).limit(5);
  const products = (data as Product[]) || [];

  if (products.length > 0) {
    const productIds = products.map(p => p.id);
    const { data: reviewsData } = await supabase
        .from('product_reviews')
        .select('product_id, rating')
        .in('product_id', productIds)
        .eq('is_approved', true);

    if (reviewsData) {
        const reviewStats = reviewsData.reduce((acc, review) => {
            if (!acc[review.product_id]) {
                acc[review.product_id] = { totalRating: 0, count: 0 };
            }
            acc[review.product_id].totalRating += review.rating;
            acc[review.product_id].count += 1;
            return acc;
        }, {} as Record<string, { totalRating: number; count: number }>);

        products.forEach(product => {
            const stats = reviewStats[product.id];
            if (stats) {
                product.avg_rating = stats.totalRating / stats.count;
                product.review_count = stats.count;
            }
        });
    }
  }
  
  if (products.length === 0) return null;

  return (
    <section>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-sm sm:text-md md:text-xl lg:text-3xl font-headline font-bold">{section.title}</h2>
        <Button asChild variant="ghost"><Link href={`/products?category=${encodeURIComponent(section.category)}`}>{t.homepage.viewAll} <ArrowRight className="ml-2" /></Link></Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}

// --- Main Page Component ---
export default async function UserPage({ params }: { params: { username: string } }) {
  const { username } = params;
  const cookieStore = cookies();
  const t = await getTranslations(username);
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch (error) {} },
        remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch (error) {} },
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
  
  const settingsData = settingsResult.data;
  const slidesData = slidesResult.data;
  const categories = (categoriesResult.data as Category[]) || [];
  const featuredProducts = (featuredProductsResult.data as Product[]) || [];
  const storeFeatures = (storeFeaturesResult.data as StoreFeature[]) || [];
  const approvedReviews = (reviewsResult.data as ProductReview[]) || [];

  const allProductIdsOnPage = [
    ...featuredProducts.map(p => p.id),
    ...((flashDealsResult.data as FlashDeal[]) || []).map(d => d.product_id)
  ];

  const { data: allReviewsData } = await supabase
    .from('product_reviews')
    .select('product_id, rating')
    .in('product_id', allProductIdsOnPage)
    .eq('is_approved', true);

  const reviewStatsMap = new Map<string, { totalRating: number, count: number }>();

  if (allReviewsData) {
      for (const review of allReviewsData) {
          if (!reviewStatsMap.has(review.product_id)) {
              reviewStatsMap.set(review.product_id, { totalRating: 0, count: 0 });
          }
          const stats = reviewStatsMap.get(review.product_id)!;
          stats.totalRating += review.rating;
          stats.count += 1;
      }
  }

  const addReviewStats = (product: Product) => {
      const stats = reviewStatsMap.get(product.id);
      if (stats) {
          product.avg_rating = stats.totalRating / stats.count;
          product.review_count = stats.count;
      }
      return product;
  }

  featuredProducts.forEach(addReviewStats);
  const flashDeals = ((flashDealsResult.data as FlashDeal[]) || []).map(deal => {
    addReviewStats(deal.products);
    return deal;
  });

  const sectionsToRender: Section[] = (() => {
    const dbSections = settingsData?.homepage_sections;
    if (Array.isArray(dbSections)) {
        if (!dbSections.some(s => s.id === 'customer-reviews')) {
            dbSections.push({ id: 'customer-reviews', title: 'What Our Customers Say', enabled: true, isCategorySection: false });
        }
        return dbSections as Section[];
    }
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

  const heroSlides = (slidesData || []).map(slide => ({
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
        if (heroSlides.length === 0 && categories.length === 0) return null;
        return (
          <section key={section.id} className="space-y-16">
            <div className="w-full rounded-lg overflow-hidden">
              {heroSlides.length > 0 ? <HeroCarousel slides={heroSlides} /> : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center"><p className="text-muted-foreground">Welcome to the store!</p></div>
              )}
            </div>

            {categories.length > 0 && (
              <div>
                <h2 className="text-sm sm:text-md md:text-xl lg:text-3xl font-headline font-bold text-center mb-8">{t.homepage.shopByCategory}</h2>
                <Carousel opts={{ align: 'start' }} className="w-full">
                    <CarouselContent className="-ml-4">
                        {categories.map((cat) => (
                            <CarouselItem key={cat.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                                <Link href={`/products?category=${encodeURIComponent(cat.name)}`}>
                                    <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1" style={{ backgroundColor: cat.card_color || 'hsl(var(--card))' }}>
                                        <div className="relative aspect-square w-full">
                                            {cat.image_url ? (
                                                <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-muted">
                                                    <DynamicIcon name={cat.icon || 'Package'} className="h-12 w-12 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <CardFooter className="p-3">
                                            <h3 className="font-semibold w-full text-center text-sm">{cat.name}</h3>
                                        </CardFooter>
                                    </Card>
                                </Link>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 hidden md:flex" />
                    <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 hidden md:flex" />
                </Carousel>
              </div>
            )}
          </section>
        );
      case 'flash_deals':
        return <FlashDeals key={section.id} deals={flashDeals} section={section} t={t} />;
      case 'featured':
        return <FeaturedProducts key={section.id} products={featuredProducts} section={section} />;
      case 'why-us':
        return <WhyUs key={section.id} features={storeFeatures} section={section} />;
      case 'customer-reviews':
        return <CustomerReviews key={section.id} reviews={approvedReviews} section={section} />;
      default:
        if (section.isCategorySection && section.category) {
          return <Suspense key={section.id} fallback={<SectionSkeleton />}><CategoryProducts siteId={siteId} section={section} t={t} /></Suspense>;
        }
        return null;
    }
  }

  return (
    <div className="space-y-16">
      {sectionsToRender.map(renderSection)}
    </div>
  );
}
