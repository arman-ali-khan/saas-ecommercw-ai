import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getProducts } from '@/lib/products';
import ProductCard from '@/components/product-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, Leaf } from 'lucide-react';
import HeroCarousel from '@/components/hero-carousel';

export default function Home() {
  const featuredProducts = getProducts().slice(0, 3);
  const aboutImage = PlaceHolderImages.find(
    (img) => img.id === 'about-traceability'
  );

  const heroSlides = [
    {
      id: 'slide-1',
      image: PlaceHolderImages.find((img) => img.id === 'home-hero'),
      title: 'প্রকৃতির আসল স্বাদ',
      description:
        'বাংলাদেশের হৃদয় থেকে আসা সেরা প্রাকৃতিক পণ্য আবিষ্কার করুন। বিশুদ্ধ, খাঁটি, এবং আপনার দোরগোড়ায় পৌঁছে দেওয়া হয়।',
      link: '/products',
      linkText: 'সব পণ্য দেখুন',
    },
    {
      id: 'slide-2',
      image: PlaceHolderImages.find((img) => img.id === 'honey-2'),
      title: 'বন্য, অপরিশোধিত সুন্দরবনের মধু',
      description:
        "বিশ্বের বৃহত্তম ম্যানগ্রোভ বন থেকে মধুর এক অনন্য অভিজ্ঞতা অর্জন করুন।",
      link: '/products/sundarban-honey',
      linkText: 'মধু আবিষ্কার করুন',
    },
    {
      id: 'slide-3',
      image: PlaceHolderImages.find((img) => img.id === 'dates-1'),
      title: 'প্রিমিয়াম মরিয়ম খেজুর',
      description:
        'সমৃদ্ধ, চিবানো এবং ক্যারামেলের মতো। যেকোনো অনুষ্ঠানের জন্য একটি স্বাস্থ্যকর এবং সুস্বাদু ট্রিট।',
      link: '/products/dates-mariam',
      linkText: 'খেজুর অন্বেষণ করুন',
    },
  ];

  return (
    <div className="space-y-16">
      <section className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
        <HeroCarousel slides={heroSlides} />
      </section>

      <section>
        <h2 className="text-3xl font-headline font-bold text-center mb-8">
          বিশেষ পণ্য
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section>
        <Card className="overflow-hidden md:grid md:grid-cols-2 md:gap-8 items-center">
          <div className="p-8 md:p-12">
            <CardHeader>
              <Leaf className="w-12 h-12 text-accent" />
              <CardTitle className="font-headline text-3xl mt-4">
                আমাদের ভূমি থেকে, আপনার ঘরে
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                আমরা আপনাকে এমন পণ্য সরবরাহ করতে প্রতিশ্রুতিবদ্ধ যা তাদের উৎপত্তিস্থলের মতোই প্রাকৃতিক। আমাদের গল্প, প্রক্রিয়া এবং গুণমান ও স্বচ্ছতার প্রতিশ্রুতি সম্পর্কে জানুন।
              </p>
              <Button asChild variant="secondary">
                <Link href="/about">
                  আমাদের গল্প এবং ট্রেসেবিলিটি{' '}
                  <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </CardContent>
          </div>
          <div className="h-64 md:h-full w-full relative">
            {aboutImage && (
              <Image
                src={aboutImage.imageUrl}
                alt={aboutImage.description}
                data-ai-hint={aboutImage.imageHint}
                fill
                className="object-cover"
              />
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
