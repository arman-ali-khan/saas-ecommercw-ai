
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

  const isListMode = section.mobileView === 'list';
  const isOneColMode = section.mobileView === '1-col' && isMobile;

  // Chunk deals into pairs for mobile list view
  const chunks = [];
  if (isListMode && isMobile) {
    for (let i = 0; i < deals.length; i += 2) {
      chunks.push(deals.slice(i, i + 2));
    }
  }

  return (
    <Carousel
      opts={{ align: 'start', slidesToScroll: 1, loop: true }}
      className="w-full relative px-0"
      plugins={[plugin.current]}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent className="-ml-4">
        {isMobile && isListMode ? (
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
          // Standard View
          deals.map((deal) => (
            <CarouselItem 
              key={deal.id} 
              className={cn(
                "pl-4",
                isOneColMode ? "basis-full" : 
                isMobile ? "basis-1/2" : 
                "basis-1/2 md:basis-1/4 lg:basis-1/5 flash-deal"
              )}
            >
              <ProductCard
                product={deal.products}
                flashDeal={deal}
                isList={isListMode}
              />
            </CarouselItem>
          ))
        )}
      </CarouselContent>
      <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full z-20 sm:bg-background/80 backdrop-blur-sm border-primary/20 sm:hover:bg-primary sm:hover:text-primary-foreground transition-all" />
      <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full z-20 sm:bg-background/80 backdrop-blur-sm border-primary/20 sm:hover:bg-primary sm:hover:text-primary-foreground transition-all" />
    </Carousel>
  );
}
