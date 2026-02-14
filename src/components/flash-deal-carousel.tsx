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
import type { FlashDeal } from '@/types';
import ProductCard from './product-card';

interface FlashDealCarouselProps {
  deals: FlashDeal[];
}

export default function FlashDealCarousel({ deals }: FlashDealCarouselProps) {
  const plugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: true }));

  return (
    <Carousel
      opts={{ align: 'start', slidesToScroll: 1, containScroll: 'trimSnaps' }}
      className="w-full"
      plugins={[plugin.current]}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent className="-ml-4">
        {deals.map((deal) => (
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
  );
}
