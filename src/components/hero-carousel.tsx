
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
            <div className="relative h-[50vh] md:h-[60vh]">
              {slide.image && (
                <Image
                  src={slide.image.imageUrl}
                  alt={slide.image.description}
                  data-ai-hint={slide.image.imageHint}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="100vw"
                />
              )}
              <div className="absolute inset-0 bg-black/50" />
              <div className="relative h-full flex flex-col items-center justify-center text-center text-white p-4">
                <h1 className="text-4xl md:text-6xl font-headline font-bold drop-shadow-lg">
                  {slide.title}
                </h1>
                <p className="mt-4 max-w-2xl text-lg md:text-xl drop-shadow-md">
                  {slide.description}
                </p>
                <Button asChild className="mt-8" size="lg">
                  <Link href={slide.link}>
                    {slide.linkText} <ArrowRight className="ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 hidden md:flex" />
      <CarouselNext className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 hidden md:flex" />
    </Carousel>
  );
}
