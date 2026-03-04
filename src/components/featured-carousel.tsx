
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
import type { Product, Section } from '@/types';
import ProductCard from './product-card';
import { cn } from '@/lib/utils';

interface FeaturedCarouselProps {
  products: Product[];
  section: Section;
}

export default function FeaturedCarousel({ products, section }: FeaturedCarouselProps) {
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

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

  // For mobile list view, we want 2 items per slide (stacked)
  const chunks = [];
  if (isListMode && isMobile) {
    for (let i = 0; i < products.length; i += 2) {
      chunks.push(products.slice(i, i + 2));
    }
  }

  return (
    <Carousel
      opts={{ align: 'start', slidesToScroll: 1, loop: true }}
      className="w-full relative group"
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
          // Standard View: grid on desktop, responsive columns on mobile
          products.map((product) => (
            <CarouselItem 
              key={product.id} 
              className={cn(
                "pl-4",
                isOneColMode ? "basis-full" : 
                isMobile ? "basis-1/2" : 
                "basis-1/2 md:basis-1/4 lg:basis-1/5"
              )}
            >
              <ProductCard
                product={product}
                isList={isListMode} // ProductCard handles md:hidden internally
              />
            </CarouselItem>
          ))
        )}
      </CarouselContent>
      <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full z-20 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground opacity-0 group-hover:opacity-100 transition-all" />
      <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full z-20 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground opacity-0 group-hover:opacity-100 transition-all" />
    </Carousel>
  );
}
