
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProductCard from '@/components/product-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
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
import type { Section } from '@/types';

// Force dynamic rendering to ensure the latest section settings are always used.
export const dynamic = 'force-dynamic';

export default async function UserPage({
  params,
}: {
  params: { username: string };
}) {
  const domainExists = await checkDomainExists(params.username);

  if (!domainExists) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 min-h-[60vh]">
        <SearchX className="w-24 h-24 text-muted-foreground mb-6" />
        <h1 className="text-4xl font-headline font-bold">Store Not Found</h1>
        <p className="mt-4 max-w-md mx-auto text-lg text-muted-foreground">
          The store at "{params.username}" does not exist.
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
    .eq('domain', params.username)
    .single();
    
  // This should not happen if domainExists is true, but it's a good safeguard.
  if (!profile) {
     return (
      <div className="flex flex-col items-center justify-center text-center py-20 min-h-[60vh]">
        <SearchX className="w-24 h-24 text-muted-foreground mb-6" />
        <h1 className="text-4xl font-headline font-bold">Store Not Found</h1>
        <p className="mt-4 max-w-md mx-auto text-lg text-muted-foreground">
          Could not load store profile for "{params.username}".
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  const { data: settingsData } = await supabase
    .from('store_settings')
    .select('homepage_sections')
    .eq('site_id', profile.id)
    .single();

  const allProducts = await getProductsByDomain(params.username);
  const featuredProducts = allProducts.filter((p) => p.is_featured);
  const allCategories = [
    ...new Set(allProducts.flatMap((p) => p.categories || [])),
  ];

  const defaultSections: Section[] = [
    {
      id: 'hero',
      title: 'Hero Carousel',
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

  // Use sections from DB if they exist, otherwise fall back to the default generated sections.
  const homepageSections = settingsData?.homepage_sections;
  const sectionsToRender: Section[] = Array.isArray(homepageSections)
    ? homepageSections
    : defaultSections;

  const aboutImage = PlaceHolderImages.find(
    (img) => img.id === 'about-traceability'
  );
  const storyImage = PlaceHolderImages.find((img) => img.id === 'about-story');
  const qualityImage = PlaceHolderImages.find(
    (img) => img.id === 'quality-promise'
  );

  const heroSlides = [
    {
      id: 'slide-1',
      image: PlaceHolderImages.find((img) => img.id === 'home-hero'),
      title: 'প্রকৃতির আসল স্বাদ',
      description:
        'বাংলাদেশের হৃদয় থেকে আসা সেরা প্রাকৃতিক পণ্য আবিষ্কার করুন। বিশুদ্ধ, খাঁটি, এবং আপনার দোরগোড়ায় পৌঁছে দেওয়া হয়।',
      link: `/${params.username}/products`,
      linkText: 'সব পণ্য দেখুন',
    },
    {
      id: 'slide-2',
      image: PlaceHolderImages.find((img) => img.id === 'honey-2'),
      title: 'বন্য, অপরিশোধিত সুন্দরবনের মধু',
      description:
        'বিশ্বের বৃহত্তম ম্যানগ্রোভ বন থেকে মধুর এক অনন্য অভিজ্ঞতা অর্জন করুন।',
      link: `/${params.username}/products/sundarban-honey`,
      linkText: 'মধু আবিষ্কার করুন',
    },
    {
      id: 'slide-3',
      image: PlaceHolderImages.find((img) => img.id === 'dates-1'),
      title: 'প্রিমিয়াম মরিয়ম খেজুর',
      description:
        'সমৃদ্ধ, চিবানো এবং ক্যারামেলের মতো। যেকোনো অনুষ্ঠানের জন্য একটি স্বাস্থ্যকর এবং সুস্বাদু ট্রিট।',
      link: `/${params.username}/products/dates-mariam`,
      linkText: 'খেজুর অন্বেষণ করুন',
    },
  ];

  const welcomeTitle =
    profile?.site_name || `Welcome to ${params.username}'s Store`;
  const welcomeDescription =
    profile?.site_description ||
    'The best natural products from Bangladesh.';

  return (
    <div className="space-y-16">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold">
          {welcomeTitle}
        </h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
          {welcomeDescription}
        </p>
      </div>

      {sectionsToRender.map((section) => {
        if (!section.enabled) return null;

        switch (section.id) {
          case 'hero':
            return (
              <section key={section.id} className="-mx-4 sm:-mx-6 lg:-mx-8">
                <HeroCarousel slides={heroSlides} />
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
                      username={params.username}
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
                      {aboutImage && (
                        <Image src={aboutImage.imageUrl} alt={aboutImage.description} data-ai-hint={aboutImage.imageHint} fill className="object-cover" />
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <CardHeader className="p-0">
                        <Leaf className="w-10 h-10 text-accent mb-4" />
                        <CardTitle className="font-headline text-2xl">আমাদের ভূমি থেকে, আপনার ঘরে</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 mt-4 flex-grow">
                        <p className="text-muted-foreground">আমরা আপনাকে এমন পণ্য সরবরাহ করতে প্রতিশ্রুতিবদ্ধ যা তাদের উৎপত্তিস্থলের মতোই প্রাকৃতিক।</p>
                      </CardContent>
                      <Button asChild variant="secondary" className="mt-6 w-fit">
                        <Link href={`/${params.username}/about`}>আরও জানুন <ArrowRight className="ml-2" /></Link>
                      </Button>
                    </div>
                  </Card>
                  <Card className="overflow-hidden flex flex-col">
                    <div className="relative h-64 w-full">
                      {storyImage && (
                         <Image src={storyImage.imageUrl} alt={storyImage.description} data-ai-hint={storyImage.imageHint} fill className="object-cover" />
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <CardHeader className="p-0">
                        <Users className="w-10 h-10 text-accent mb-4" />
                        <CardTitle className="font-headline text-2xl">কৃষক সম্প্রদায়ের সাথে অংশীদারিত্ব</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 mt-4 flex-grow">
                        <p className="text-muted-foreground">আমরা স্থানীয় কৃষকদের সাথে সরাসরি কাজ করি, ন্যায্য মূল্য নিশ্চিত করি এবং টেকসই কৃষি অনুশীলনে সহায়তা করি।</p>
                      </CardContent>
                      <Button asChild variant="secondary" className="mt-6 w-fit">
                        <Link href={`/${params.username}/about`}>আরও জানুন <ArrowRight className="ml-2" /></Link>
                      </Button>
                    </div>
                  </Card>
                  <Card className="overflow-hidden flex flex-col">
                    <div className="relative h-64 w-full">
                      {qualityImage && (
                        <Image src={qualityImage.imageUrl} alt={qualityImage.description} data-ai-hint={qualityImage.imageHint} fill className="object-cover"/>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <CardHeader className="p-0">
                        <Heart className="w-10 h-10 text-accent mb-4" />
                        <CardTitle className="font-headline text-2xl">বিশুদ্ধতা এবং গুণমানের প্রতিশ্রুতি</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 mt-4 flex-grow">
                        <p className="text-muted-foreground">প্রতিটি পণ্য কঠোর মান পরীক্ষার মধ্য দিয়ে যায়। আপনি কেবল সেরা এবং সবচেয়ে বিশুদ্ধ পণ্য পাবেন।</p>
                      </CardContent>
                      <Button asChild variant="secondary" className="mt-6 w-fit">
                        <Link href={`/${params.username}/about`}>আরও জানুন <ArrowRight className="ml-2" /></Link>
                      </Button>
                    </div>
                  </Card>
                </div>

                <div className="lg:hidden">
                  <Carousel opts={{ align: 'start', loop: true }} className="w-full">
                    <CarouselContent>
                      <CarouselItem>
                        <Card className="overflow-hidden">
                          <div className="relative h-64 w-full">
                            {aboutImage && (<Image src={aboutImage.imageUrl} alt={aboutImage.description} data-ai-hint={aboutImage.imageHint} fill className="object-cover" />)}
                          </div>
                          <div className="p-6">
                            <CardHeader className="p-0"><Leaf className="w-10 h-10 text-accent mb-4" /><CardTitle className="font-headline text-2xl">আমাদের ভূমি থেকে, আপনার ঘরে</CardTitle></CardHeader>
                            <CardContent className="p-0 mt-4"><p className="text-muted-foreground">আমরা আপনাকে এমন পণ্য সরবরাহ করতে প্রতিশ্রুতিবদ্ধ যা তাদের উৎপত্তিস্থলের মতোই প্রাকৃতিক।</p></CardContent>
                            <Button asChild variant="secondary" className="mt-6 w-fit"><Link href={`/${params.username}/about`}>আরও জানুন <ArrowRight className="ml-2" /></Link></Button>
                          </div>
                        </Card>
                      </CarouselItem>
                      <CarouselItem>
                        <Card className="overflow-hidden">
                          <div className="relative h-64 w-full">
                            {storyImage && (<Image src={storyImage.imageUrl} alt={storyImage.description} data-ai-hint={storyImage.imageHint} fill className="object-cover" />)}
                          </div>
                          <div className="p-6">
                            <CardHeader className="p-0"><Users className="w-10 h-10 text-accent mb-4" /><CardTitle className="font-headline text-2xl">কৃষক সম্প্রদায়ের সাথে অংশীদারিত্ব</CardTitle></CardHeader>
                            <CardContent className="p-0 mt-4"><p className="text-muted-foreground">আমরা স্থানীয় কৃষকদের সাথে সরাসরি কাজ করি, ন্যায্য মূল্য নিশ্চিত করি এবং টেকসই কৃষি অনুশীলনে সহায়তা করি।</p></CardContent>
                             <Button asChild variant="secondary" className="mt-6 w-fit"><Link href={`/${params.username}/about`}>আরও জানুন <ArrowRight className="ml-2" /></Link></Button>
                          </div>
                        </Card>
                      </CarouselItem>
                      <CarouselItem>
                         <Card className="overflow-hidden">
                          <div className="relative h-64 w-full">
                            {qualityImage && (<Image src={qualityImage.imageUrl} alt={qualityImage.description} data-ai-hint={qualityImage.imageHint} fill className="object-cover" />)}
                          </div>
                          <div className="p-6">
                            <CardHeader className="p-0"><Heart className="w-10 h-10 text-accent mb-4" /><CardTitle className="font-headline text-2xl">বিশুদ্ধতা এবং গুণমানের প্রতিশ্রুতি</CardTitle></CardHeader>
                            <CardContent className="p-0 mt-4"><p className="text-muted-foreground">প্রতিটি পণ্য কঠোর মান পরীক্ষার মধ্য দিয়ে যায়। আপনি কেবল সেরা এবং সবচেয়ে বিশুদ্ধ পণ্য পাবেন।</p></CardContent>
                             <Button asChild variant="secondary" className="mt-6 w-fit"><Link href={`/${params.username}/about`}>আরও জানুন <ArrowRight className="ml-2" /></Link></Button>
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
                      <Link href={`/${params.username}/products`}>
                        সব দেখুন <ArrowRight className="ml-2" />
                      </Link>
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categoryProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        username={params.username}
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
