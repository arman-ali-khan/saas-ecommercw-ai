
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
import type { FlashDeal, Section } from '@/types';
import ProductCard from './product-card';

interface FlashDealCarouselProps {
  deals: FlashDeal[];
  section: Section;
}

export default function FlashDealCarousel({ deals, section }: FlashDealCarouselProps) {
  const plugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: true }));
  const isList = section.mobileView === 'list';

  // Chunk deals into pairs for the mobile list view carousel
  const chunks = [];
  if (isList) {
    for (let i = 0; i < deals.length; i += 2) {
      chunks.push(deals.slice(i, i + 2));
    }
  }

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
          // List View: 2 items stacked per slide on mobile, 4 items per view on desktop
          chunks.map((chunk, idx) => (
            <CarouselItem key={idx} className="pl-4 basis-[90%] md:basis-1/2 lg:basis-2/5">
              <div className="flex flex-col gap-3">
                {chunk.map((deal) => (
                  <ProductCard
                    key={deal.id}
                    product={deal.products}
                    flashDeal={deal}
                    isList={true}
                  />
                ))}
              </div>
            </CarouselItem>
          ))
        ) : (
          // Standard Grid View: 2 items per view on mobile
          deals.map((deal) => (
            <CarouselItem key={deal.id} className="pl-4 basis-1/2 md:basis-1/4 lg:basis-1/5">
              <ProductCard
                product={deal.products}
                flashDeal={deal}
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
