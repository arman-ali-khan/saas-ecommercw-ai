
'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { OptimizedImage as Image } from '@/components/ui/optimized-image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardFooter } from '@/components/ui/card';
import Autoplay from 'embla-carousel-autoplay';
import DynamicIcon from './dynamic-icon';
import { Button } from '@/components/ui/button';
import type { Category } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryCarouselProps {
    categories: Category[];
    variant?: string;
}

export default function CategoryCarousel({ categories, variant = 'v1' }: CategoryCarouselProps) {
  const plugin = useRef(Autoplay({ delay: 3500, stopOnInteraction: true }));

  // --- V3: MINIMAL TEXT-ONLY ---
  if (variant === 'v3') {
      return (
        <div className="flex flex-wrap justify-center gap-3">
            {categories.map(cat => (
                <Button key={cat.id} variant="outline" asChild className="rounded-full h-12 px-8 font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all">
                    <Link href={`/products?category=${encodeURIComponent(cat.name)}`}>{cat.name}</Link>
                </Button>
            ))}
        </div>
      )
  }

  // --- V4: BENTO GRIDS (Partial) ---
  if (variant === 'v4') {
      return (
        <Carousel
            opts={{ align: 'start', loop: true }}
            className="w-full relative px-0 group"
            plugins={[plugin.current]}
        >
            <CarouselContent className="-ml-4">
                {categories.map(cat => (
                    <CarouselItem key={cat.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                        <Link href={`/products?category=${encodeURIComponent(cat.name)}`}>
                            <div className="relative h-48 rounded-[2.5rem] bg-muted/30 border-2 border-primary/10 overflow-hidden group/bento p-8 flex flex-col justify-between">
                                <div className="p-3 bg-background rounded-2xl w-fit shadow-sm group-hover/bento:scale-110 transition-transform">
                                    <DynamicIcon name={cat.icon || 'Package'} className="h-6 w-6 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black font-headline">{cat.name}</h3>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Browse Collection</p>
                                </div>
                                <div className="absolute -bottom-4 -right-4 opacity-10 scale-150 rotate-12 group-hover/bento:scale-[2] transition-all">
                                    <DynamicIcon name={cat.icon || 'Package'} className="h-24 w-24" />
                                </div>
                            </div>
                        </Link>
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
      )
  }

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

