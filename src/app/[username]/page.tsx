

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProductCard from '@/components/product-card';
import { ArrowRight, Leaf, Users, Heart, SearchX } from 'lucide-react';
import HeroCarousel from '@/components/hero-carousel';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { getProductsByDomain, checkDomainExists } from '@/lib/products';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Section, Category, FlashDeal } from '@/types';
import DynamicIcon from '@/components/dynamic-icon';
import { cn } from '@/lib/utils';

// Force dynamic rendering to ensure the latest section settings are always used.
export const dynamic = 'force-dynamic';

export default async function UserPage({
  params,
}: {
  params: { username: string };
}) {
  const { username } = params;
  const domainExists = await checkDomainExists(username);

  if (!domainExists) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 min-h-[60vh]">
        <SearchX className="w-24 h-24 text-muted-foreground mb-6" />
        <h1 className="text-4xl font-headline font-bold">Store Not Found</h1>
        <p className="mt-4 max-w-md mx-auto text-lg text-muted-foreground">
          The store at "{username}" does not exist.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  const cookieStore = cookies();
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('domain', username)
    .single();

  // This should not happen if domainExists is true, but it's a good safeguard.
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 min-h-[60vh]">
        <SearchX className="w-24 h-24 text-muted-foreground mb-6" />
        <h1 className="text-4xl font-headline font-bold">Store Not Found</h1>
        <p className="mt-4 max-w-md mx-auto text-lg text-muted-foreground">
          Could not load store profile for "{username}".
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }
  
  const allProducts = await getProductsByDomain(username);

  const { data: settingsData } = await supabase
    .from('store_settings')
    .select('homepage_sections')
    .eq('site_id', profile.id)
    .single();
    
  const { data: slidesData } = await supabase
    .from('carousel_slides')
    .select('*')
    .eq('site_id', profile.id)
    .eq('is_enabled', true)
    .order('order', { ascending: true });
    
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*')
    .eq('site_id', profile.id)
    .order('name', { ascending: true });

  const { data: flashDealsData } = await supabase
    .from('flash_deals')
    .select('*, products!inner(*, images(imageUrl))')
    .eq('site_id', profile.id)
    .eq('is_active', true)
    .gt('end_date', new Date().toISOString());

  const categories = (categoriesData as Category[]) || [];
  const featuredProducts = allProducts.filter((p) => p.is_featured);
  const flashDeals = (flashDealsData as FlashDeal[]) || [];
  
  // Determine which sections to render based on database settings.
  const sectionsToRender: Section[] = (() => {
    const dbSections = settingsData?.homepage_sections;

    // If sections are defined in the database (even as an empty array), use them as the source of truth.
    if (Array.isArray(dbSections)) {
      return dbSections as Section[];
    }

    // If no settings are found in the DB, generate a default layout for the first time.
    const allCategories = [
      ...new Set(allProducts.flatMap((p) => p.categories || [])),
    ];
    return [
      {
        id: 'hero',
        title: 'Hero Carousel',
        enabled: true,
        isCategorySection: false,
      },
      {
        id: 'flash_deals',
        title: 'Flash Deals',
        enabled: true,
        isCategorySection: false,
      },
      {
        id: 'featured',
        title: 'Featured Products',
        enabled: true,
        isCategorySection: false,
      },
      {
        id: 'why-us',
        title: 'Why We Are Different',
        enabled: true,
        isCategorySection: false,
      },
      ...allCategories.map((cat) => ({
        id: `category-${cat.toLowerCase().replace(/\s+/g, '-')}`,
        title: cat,
        enabled: true,
        isCategorySection: true,
        category: cat,
      })),
    ];
  })();

  const heroSlides = (slidesData || []).map(slide => ({
      id: slide.id,
      image: {
          imageUrl: slide.image_url,
          description: slide.title, // Use title for alt text
          imageHint: '' // Not available from DB
      },
      title: slide.title,
      description: slide.description || '',
      link: slide.link || '',
      linkText: slide.link_text || 'Shop Now'
  }));

  const aboutImage = { imageUrl: 'https://picsum.photos/seed/about1/800/600', description: 'Traceability', imageHint: 'farmer field' };
  const storyImage = { imageUrl: 'https://picsum.photos/seed/about2/800/600', description: 'Community', imageHint: 'community farmers' };
  const qualityImage = { imageUrl: 'https://picsum.photos/seed/about3/800/600', description: 'Quality', imageHint: 'quality product' };

  return (
    <div className="space-y-16">
      {sectionsToRender.map((section) => {
        if (!section.enabled) return null;

        switch (section.id) {
          case 'hero':
            if (heroSlides.length === 0 && categories.length === 0) return null;
            return (
              <section key={section.id} className="grid sm:grid-cols-[260px_1fr] gap-8 items-start">
                  {categories.length > 0 && (
                      <div className="hidden sm:block sticky top-24">
                          <Card>
                              <CardHeader>
                                  <CardTitle>Categories</CardTitle>
                              </CardHeader>
                              <CardContent>
                                  <nav className="flex flex-col gap-1">
                                      {categories.map((cat) => (
                                          <Link key={cat.id} href={`/products?category=${encodeURIComponent(cat.name)}`} passHref>
                                              <Button variant="ghost" className="w-full justify-start gap-3">
                                                  <DynamicIcon name={cat.icon || 'Package'} className="h-5 w-5 text-muted-foreground" />
                                                  <span className="truncate">{cat.name}</span>
                                              </Button>
                                          </Link>
                                      ))}
                                  </nav>
                              </CardContent>
                          </Card>
                      </div>
                  )}
                  <div className={cn(
                      "w-full rounded-lg overflow-hidden",
                      categories.length === 0 && "lg:col-span-2"
                  )}>
                      {heroSlides.length > 0 ? (
                          <HeroCarousel slides={heroSlides} />
                      ) : (
                          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                              <p className="text-muted-foreground">Welcome to the store!</p>
                          </div>
                      )}
                  </div>
              </section>
            );

          case 'flash_deals':
            if (flashDeals.length === 0) return null;
            return (
              <section key={section.id}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-headline font-bold">
                        {section.title}
                    </h2>
                    <Button asChild variant="ghost">
                      <Link href={`/flash-deals`}>
                        সব দেখুন <ArrowRight className="ml-2" />
                      </Link>
                    </Button>
                  </div>
                <Carousel
                    opts={{ align: 'start', slidesToScroll: 1, containScroll: 'trimSnaps' }}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-4">
                      {flashDeals.map((deal) => (
                        <CarouselItem key={deal.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                          <ProductCard
                            product={deal.products}
                            flashDeal={deal}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:flex" />
                    <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex" />
                  </Carousel>
              </section>
            );

          case 'featured':
            if (featuredProducts.length === 0) return null;
            return (
              <section key={section.id}>
                <h2 className="text-3xl font-headline font-bold text-center mb-8">
                  {section.title}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}
                </div>
              </section>
            );

          case 'why-us':
            return (
              <section key={section.id}>
                <h2 className="text-3xl font-headline font-bold text-center mb-8">
                  {section.title}
                </h2>
                <div className="hidden lg:grid grid-cols-3 gap-6">
                  <Card className="overflow-hidden flex flex-col">
                    <div className="relative h-64 w-full">
                      <Image
                        src={aboutImage.imageUrl}
                        alt={aboutImage.description}
                        data-ai-hint={aboutImage.imageHint}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <CardHeader className="p-0">
                        <Leaf className="w-10 h-10 text-accent mb-4" />
                        <CardTitle className="font-headline text-2xl">
                          আমাদের ভূমি থেকে, আপনার ঘরে
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 mt-4 flex-grow">
                        <p className="text-muted-foreground">
                          আমরা আপনাকে এমন পণ্য সরবরাহ করতে প্রতিশ্রুতিবদ্ধ যা তাদের
                          উৎপত্তিস্থলের মতোই প্রাকৃতিক।
                        </p>
                      </CardContent>
                      <Button
                        asChild
                        variant="secondary"
                        className="mt-6 w-fit"
                      >
                        <Link href={`/about`}>
                          আরও জানুন <ArrowRight className="ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                  <Card className="overflow-hidden flex flex-col">
                    <div className="relative h-64 w-full">
                      <Image
                        src={storyImage.imageUrl}
                        alt={storyImage.description}
                        data-ai-hint={storyImage.imageHint}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <CardHeader className="p-0">
                        <Users className="w-10 h-10 text-accent mb-4" />
                        <CardTitle className="font-headline text-2xl">
                          কৃষক সম্প্রদায়ের সাথে অংশীদারিত্ব
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 mt-4 flex-grow">
                        <p className="text-muted-foreground">
                          আমরা স্থানীয় কৃষকদের সাথে সরাসরি কাজ করি, ন্যায্য মূল্য
                          নিশ্চিত করি এবং টেকসই কৃষি অনুশীলনে সহায়তা
                          করি।
                        </p>
                      </CardContent>
                      <Button
                        asChild
                        variant="secondary"
                        className="mt-6 w-fit"
                      >
                        <Link href={`/about`}>
                          আরও জানুন <ArrowRight className="ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                  <Card className="overflow-hidden flex flex-col">
                    <div className="relative h-64 w-full">
                      <Image
                        src={qualityImage.imageUrl}
                        alt={qualityImage.description}
                        data-ai-hint={qualityImage.imageHint}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <CardHeader className="p-0">
                        <Heart className="w-10 h-10 text-accent mb-4" />
                        <CardTitle className="font-headline text-2xl">
                          বিশুদ্ধতা এবং গুণমানের প্রতিশ্রুতি
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 mt-4 flex-grow">
                        <p className="text-muted-foreground">
                          প্রতিটি পণ্য কঠোর মান পরীক্ষার মধ্য দিয়ে যায়।
                          আপনি কেবল সেরা এবং সবচেয়ে বিশুদ্ধ পণ্য পাবেন।
                        </p>
                      </CardContent>
                      <Button
                        asChild
                        variant="secondary"
                        className="mt-6 w-fit"
                      >
                        <Link href={`/about`}>
                          আরও জানুন <ArrowRight className="ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                </div>

                <div className="lg:hidden">
                  <Carousel
                    opts={{ align: 'start', loop: true }}
                    className="w-full"
                  >
                    <CarouselContent>
                      <CarouselItem>
                        <Card className="overflow-hidden">
                          <div className="relative h-64 w-full">
                            <Image
                              src={aboutImage.imageUrl}
                              alt={aboutImage.description}
                              data-ai-hint={aboutImage.imageHint}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-6">
                            <CardHeader className="p-0">
                              <Leaf className="w-10 h-10 text-accent mb-4" />
                              <CardTitle className="font-headline text-2xl">
                                আমাদের ভূমি থেকে, আপনার ঘরে
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 mt-4">
                              <p className="text-muted-foreground">
                                আমরা আপনাকে এমন পণ্য সরবরাহ করতে প্রতিশ্রুতিবদ্ধ যা
                                তাদের উৎপত্তিস্থলের মতোই প্রাকৃতিক।
                              </p>
                            </CardContent>
                            <Button
                              asChild
                              variant="secondary"
                              className="mt-6 w-fit"
                            >
                              <Link href={`/about`}>
                                আরও জানুন <ArrowRight className="ml-2" />
                              </Link>
                            </Button>
                          </div>
                        </Card>
                      </CarouselItem>
                      <CarouselItem>
                        <Card className="overflow-hidden">
                          <div className="relative h-64 w-full">
                            <Image
                              src={storyImage.imageUrl}
                              alt={storyImage.description}
                              data-ai-hint={storyImage.imageHint}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-6">
                            <CardHeader className="p-0">
                              <Users className="w-10 h-10 text-accent mb-4" />
                              <CardTitle className="font-headline text-2xl">
                                কৃষক সম্প্রদায়ের সাথে অংশীদারিত্ব
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 mt-4">
                              <p className="text-muted-foreground">
                                আমরা স্থানীয় কৃষকদের সাথে সরাসরি কাজ করি, ন্যায্য
                                মূল্য নিশ্চিত করি এবং টেকসই কৃষি অনুশীলনে সহায়তা
                                করি।
                              </p>
                            </CardContent>
                            <Button
                              asChild
                              variant="secondary"
                              className="mt-6 w-fit"
                            >
                              <Link href={`/about`}>
                                আরও জানুন <ArrowRight className="ml-2" />
                              </Link>
                            </Button>
                          </div>
                        </Card>
                      </CarouselItem>
                      <CarouselItem>
                        <Card className="overflow-hidden">
                          <div className="relative h-64 w-full">
                            <Image
                              src={qualityImage.imageUrl}
                              alt={qualityImage.description}
                              data-ai-hint={qualityImage.imageHint}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-6">
                            <CardHeader className="p-0">
                              <Heart className="w-10 h-10 text-accent mb-4" />
                              <CardTitle className="font-headline text-2xl">
                                বিশুদ্ধতা এবং গুণমানের প্রতিশ্রুতি
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 mt-4">
                              <p className="text-muted-foreground">
                                প্রতিটি পণ্য কঠোর মান পরীক্ষার মধ্য দিয়ে যায়।
                                আপনি কেবল সেরা এবং সবচেয়ে বিশুদ্ধ পণ্য পাবেন।
                              </p>
                            </CardContent>
                            <Button
                              asChild
                              variant="secondary"
                              className="mt-6 w-fit"
                            >
                              <Link href={`/about`}>
                                আরও জানুন <ArrowRight className="ml-2" />
                              </Link>
                            </Button>
                          </div>
                        </Card>
                      </CarouselItem>
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                    <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
                  </Carousel>
                </div>
              </section>
            );

          default:
            if (section.isCategorySection && section.category) {
              const categoryProducts = allProducts
                .filter((p) => p.categories?.includes(section.category!))
                .slice(0, 3);
              if (categoryProducts.length === 0) return null;

              return (
                <section key={section.id}>
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-headline font-bold">
                      {section.title}
                    </h2>
                    <Button asChild variant="ghost">
                      <Link href={`/products?category=${encodeURIComponent(section.category)}`}>
                        সব দেখুন <ArrowRight className="ml-2" />
                      </Link>
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categoryProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                      />
                    ))}
                  </div>
                </section>
              );
            }
            return null;
        }
      })}
    </div>
  );
}
