'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Leaf, Users, Heart } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import DynamicIcon from './dynamic-icon';
import type { StoreFeature } from '@/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function FeaturesCarousel({ features }: { features: StoreFeature[] }) {
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));

  if (features.length === 0) {
    const fallbackFeatures = [
      { image: PlaceHolderImages.find(img => img.imageHint === 'farm landscape') || PlaceHolderImages[10], icon: Leaf, title: 'আমাদের ভূমি থেকে, আপনার ঘরে', description: 'আমরা আপনাকে এমন পণ্য সরবরাহ করতে প্রতিশ্রুতিবদ্ধ যা তাদের উৎপত্তিস্থলের মতোই প্রাকৃতিক।' },
      { image: PlaceHolderImages.find(img => img.imageHint === 'farmer smiling') || PlaceHolderImages[10], icon: Users, title: 'কৃষক সম্প্রদায়ের সাথে অংশীদারিত্ব', description: 'আমরা স্থানীয় কৃষকদের সাথে সরাসরি কাজ করি, ন্যায্য মূল্য নিশ্চিত করি এবং টেকসই কৃষি অনুশীলনে সহায়তা করি।' },
      { image: PlaceHolderImages.find(img => img.imageHint === 'quality inspection') || PlaceHolderImages[12], icon: Heart, title: 'বিশুদ্ধতা এবং গুণমানের প্রতিশ্রুতি', description: 'প্রতিটি পণ্য কঠোর মান পরীক্ষার মধ্য দিয়ে যায়। আপনি কেবল সেরা এবং সবচেয়ে বিশুদ্ধ পণ্য পাবেন।' }
    ];

    return (
      <Carousel
        opts={{ align: 'start', loop: true }}
        className="w-full"
        plugins={[plugin.current]}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent className="-ml-6">
          {fallbackFeatures.map((feature, index) => (
            <CarouselItem key={index} className="pl-6 basis-1/2 md:basis-1/4 lg:basis-1/5">
              <Card className="overflow-hidden flex flex-col h-full">
                <div className="relative h-64 w-full">
                  <Image src={feature.image.imageUrl} alt={feature.title} fill className="object-cover" />
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
    );
  }

  return (
    <Carousel
      opts={{ align: 'start', loop: true }}
      className="w-full"
      plugins={[plugin.current]}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
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
  );
}