
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ArrowRight } from 'lucide-react';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import Autoplay from 'embla-carousel-autoplay';
import { useRef } from 'react';

type HeroSlide = {
  id: string;
  image: ImagePlaceholder | undefined;
  title: string;
  description: string;
  link: string;
  linkText: string;
};

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

  return (
    <Carousel
      className="w-full"
      opts={{
        loop: true,
      }}
      plugins={[plugin.current]}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {slides.map((slide, index) => (
          <CarouselItem key={slide.id}>
            <div className="relative aspect-[16/9] sm:aspect-video rounded-lg overflow-hidden">
              {slide.image && (
                <Image
                  src={slide.image.imageUrl}
                  alt={slide.image.description}
                  data-ai-hint={slide.image.imageHint}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  fetchPriority={index === 0 ? "high" : "low"}
                  sizes="100vw"
                />
              )}
              <div className="absolute inset-0 bg-black/50" />
              <div className="relative h-full flex flex-col items-center justify-center text-center text-white p-4">
                {index === 0 ? (
                  <h1 className="text-2xl md:text-6xl font-headline font-bold drop-shadow-lg">
                    {slide.title}
                  </h1>
                ) : (
                  <div className="text-2xl md:text-6xl font-headline font-bold drop-shadow-lg" role="heading" aria-level={2}>
                    {slide.title}
                  </div>
                )}
                <p className="mt-2 md:mt-4 max-w-2xl text-sm md:text-xl drop-shadow-md">
                  {slide.description}
                </p>
                <Button asChild className="mt-4 md:mt-8" size="sm" md-size="lg">
                  <Link href={slide.link}>
                    {slide.linkText} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 flex h-8 w-8 sm:h-10 sm:w-10" />
      <CarouselNext className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10" />
    </Carousel>
  );
}
