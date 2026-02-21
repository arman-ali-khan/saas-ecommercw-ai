
'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useRef } from 'react';
import type { Product, Section } from '@/types';
import ProductCard from './product-card';
import { cn } from '@/lib/utils';

interface FeaturedCarouselProps {
  products: Product[];
  section: Section;
}

export default function FeaturedCarousel({ products, section }: FeaturedCarouselProps) {
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));
  const isList = section.mobileView === 'list';
  const isOneCol = section.mobileView === '1-col';

  // Chunk products into pairs for the mobile list view carousel
  const chunks = [];
  if (isList) {
    for (let i = 0; i < products.length; i += 2) {
      chunks.push(products.slice(i, i + 2));
    }
  }

  // Determine basis class for mobile
  const mobileBasis = isOneCol ? 'basis-full' : 'basis-1/2';
  const itemBasis = isList ? 'basis-[90%] md:basis-1/2 lg:basis-2/5' : `${mobileBasis} md:basis-1/4 lg:basis-1/5`;

  return (
    <Carousel
      opts={{ align: 'start', slidesToScroll: 1, loop: true }}
      className="w-full"
      plugins={[plugin.current]}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent className="-ml-4">
        {isList ? (
          chunks.map((chunk, idx) => (
            <CarouselItem key={idx} className={cn("pl-4", itemBasis)}>
              <div className="flex flex-col gap-3">
                {chunk.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isList={true}
                  />
                ))}
              </div>
            </CarouselItem>
          ))
        ) : (
          products.map((product) => (
            <CarouselItem key={product.id} className={cn("pl-4", itemBasis)}>
              <ProductCard
                product={product}
              />
            </CarouselItem>
          ))
        )}
      </CarouselContent>
      <div className="hidden md:block">
        <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" />
        <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2" />
      </div>
    </Carousel>
  );
}
