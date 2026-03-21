
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
import { ArrowRight, Sparkles } from 'lucide-react';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import Autoplay from 'embla-carousel-autoplay';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

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
  variant?: 'v1' | 'v2';
}

export default function HeroCarousel({ slides, variant = 'v1' }: HeroCarouselProps) {
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

  if (variant === 'v2') {
    return (
        <Carousel className="w-full group" opts={{ loop: true }} plugins={[plugin.current]}>
            <CarouselContent>
                {slides.map((slide, index) => (
                    <CarouselItem key={slide.id}>
                        <div className="relative w-full min-h-[500px] md:min-h-[600px] flex items-center overflow-hidden bg-muted/20">
                            <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
                                <div className="space-y-6 text-left animate-in slide-in-from-left duration-700">
                                    <Badge variant="secondary" className="px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px] bg-primary/10 text-primary border-primary/20">
                                        <Sparkles className="w-3 h-3 mr-2" /> New Arrivals
                                    </Badge>
                                    <h1 className="text-4xl md:text-7xl font-black font-headline leading-none text-foreground drop-shadow-sm">
                                        {slide.title}
                                    </h1>
                                    <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                                        {slide.description}
                                    </p>
                                    <div className="flex gap-4 pt-4">
                                        <Button asChild size="lg" className="h-14 px-10 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">
                                            <Link href={slide.link}>{slide.linkText} <ArrowRight className="ml-2" /></Link>
                                        </Button>
                                    </div>
                                </div>
                                <div className="relative aspect-square w-full max-w-[500px] mx-auto animate-in zoom-in duration-1000">
                                    <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-110" />
                                    {slide.image && (
                                        <Image 
                                            src={slide.image.imageUrl} 
                                            alt={slide.title} 
                                            fill 
                                            className="object-contain relative z-10 drop-shadow-2xl" 
                                            priority={index === 0}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/2" />
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Carousel>
    );
  }

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
                <h1 className="text-2xl md:text-6xl font-headline font-bold drop-shadow-lg">
                    {slide.title}
                </h1>
                <p className="mt-2 md:mt-4 max-w-2xl text-sm md:text-xl drop-shadow-md">
                  {slide.description}
                </p>
                <Button asChild className="mt-4 md:mt-8 h-10 md:h-12 px-8 rounded-full font-bold shadow-lg" size="lg">
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

import { Badge } from './ui/badge';
