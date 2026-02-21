
'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useRef, useState, useEffect } from 'react';
import type { FlashDeal, Section } from '@/types';
import ProductCard from './product-card';
import { cn } from '@/lib/utils';

interface FlashDealCarouselProps {
  deals: FlashDeal[];
  section: Section;
}

export default function FlashDealCarousel({ deals, section }: FlashDealCarouselProps) {
  const plugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: true }));
  const [hasMounted, setHasMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!hasMounted) return null;

  const isListMode = section.mobileView === 'list' && isMobile;
  const isOneColMode = section.mobileView === '1-col' && isMobile;
  const isTwoColMode = (section.mobileView === '2-col' || !section.mobileView) && isMobile;

  // Chunk deals into pairs ONLY for mobile list view
  const chunks = [];
  if (isListMode) {
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
        {isListMode ? (
          // Mobile List View: 2 items stacked per slide
          chunks.map((chunk, idx) => (
            <CarouselItem key={idx} className="pl-4 basis-[90%]">
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
          // Standard View: respetcs 1-col/2-col on mobile, normal carousel on desktop
          deals.map((deal) => (
            <CarouselItem 
              key={deal.id} 
              className={cn(
                "pl-4",
                isOneColMode ? "basis-full" : 
                isTwoColMode ? "basis-1/2" : 
                "basis-1/2 md:basis-1/4 lg:basis-1/5" // Default Desktop Layout
              )}
            >
              <ProductCard
                product={deal.products}
                flashDeal={deal}
                isList={false}
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
