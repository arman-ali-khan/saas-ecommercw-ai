
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

interface CategoryCarouselProps {
    categories: Category[];
    variant?: 'v1' | 'v2';
}

export default function CategoryCarousel({ categories, variant = 'v1' }: CategoryCarouselProps) {
  const plugin = useRef(Autoplay({ delay: 3500, stopOnInteraction: true }));

  return (
    <Carousel
      opts={{ align: 'start', loop: true }}
      className="w-full relative px-0 group"
      plugins={[plugin.current]}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent className="-ml-4">
        {categories.map((cat) => (
          <CarouselItem key={cat.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
            <Link href={`/products?category=${encodeURIComponent(cat.name)}`}>
              {variant === 'v2' ? (
                  <div className="flex flex-col items-center gap-4 group/cat p-4">
                      <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full overflow-hidden border-2 border-primary/10 shadow-xl bg-card transition-all duration-500 group-hover/cat:scale-110 group-hover/cat:border-primary group-hover/cat:rotate-6">
                        {cat.image_url ? (
                            <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                                <DynamicIcon name={cat.icon || 'Package'} className="h-10 w-10 text-muted-foreground" />
                            </div>
                        )}
                      </div>
                      <h3 className="font-black text-xs sm:text-sm uppercase tracking-widest text-center transition-colors group-hover/cat:text-primary">{cat.name}</h3>
                  </div>
              ) : (
                <Card 
                    className={cn(
                    "overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 border-2",
                    "dark:brightness-[0.8] dark:hover:brightness-100" 
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
                    <h3 className="font-bold w-full text-center text-sm truncate">{cat.name}</h3>
                    </CardFooter>
                </Card>
              )}
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full z-20 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground opacity-0 group-hover:opacity-100 transition-all" />
      <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full z-20 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground opacity-0 group-hover:opacity-100 transition-all" />
    </Carousel>
  );
}
