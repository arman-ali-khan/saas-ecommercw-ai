'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardFooter } from '@/components/ui/card';
import Autoplay from 'embla-carousel-autoplay';
import DynamicIcon from './dynamic-icon';
import type { Category } from '@/types';
import { cn } from '@/lib/utils';

export default function CategoryCarousel({ categories }: { categories: Category[] }) {
  const plugin = useRef(Autoplay({ delay: 3500, stopOnInteraction: true }));

  return (
    <Carousel
      opts={{ align: 'start', loop: true }}
      className="w-full relative px-0"
      plugins={[plugin.current]}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent className="-ml-4">
        {categories.map((cat) => (
          <CarouselItem key={cat.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
            <Link href={`/products?category=${encodeURIComponent(cat.name)}`}>
              <Card 
                className={cn(
                  "overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 border-2",
                  "dark:brightness-[0.8] dark:hover:brightness-100" // Added dimming for dark mode
                )} 
                style={{ backgroundColor: cat.card_color || 'hsl(var(--card))' }}
              >
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
                  <h3 className="font-bold w-full text-headline text-center text-sm truncate">{cat.name}</h3>
                </CardFooter>
              </Card>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full z-20 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all" />
      <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full z-20 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all" />
    </Carousel>
  );
}
