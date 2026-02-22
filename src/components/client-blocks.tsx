'use client';

import { useState, useEffect, useRef } from 'react';
import { Carousel as ShadCarousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';
import Autoplay from 'embla-carousel-autoplay';

// Countdown
export function CountdownBlock({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };
    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, [endDate]);

  const isOver = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div className="flex justify-center gap-4 text-center">
      {isOver ? (
        <div className="text-2xl font-bold">Time's up!</div>
      ) : (
        <>
          <div><div className="text-4xl font-bold">{timeLeft.days}</div><div className="text-sm text-muted-foreground">Days</div></div>
          <div><div className="text-4xl font-bold">{timeLeft.hours}</div><div className="text-sm text-muted-foreground">Hours</div></div>
          <div><div className="text-4xl font-bold">{timeLeft.minutes}</div><div className="text-sm text-muted-foreground">Minutes</div></div>
          <div><div className="text-4xl font-bold">{timeLeft.seconds}</div><div className="text-sm text-muted-foreground">Seconds</div></div>
        </>
      )}
    </div>
  );
}


// Carousel
type CarouselSlide = {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
};

export function CarouselBlock({ slides }: { slides: CarouselSlide[] }) {
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));

  if (!slides || slides.length === 0) return null;
  
  return (
    <ShadCarousel 
      className="w-full relative px-0" 
      opts={{ loop: true, align: 'start' }}
      plugins={[plugin.current]}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent className="-ml-4">
        {slides.map((slide) => {
          const hasText = !!(slide.title?.trim() || slide.subtitle?.trim());
          return (
            <CarouselItem key={slide.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              <div className="relative aspect-video group overflow-hidden rounded-2xl border-2 border-primary/10 shadow-lg">
                <Image src={slide.image} alt={slide.title || 'Slide Image'} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                {hasText && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col items-center justify-end text-center p-6 sm:p-8">
                    {slide.title && <h3 className="text-lg sm:text-2xl font-black text-white drop-shadow-md leading-tight">{slide.title}</h3>}
                    {slide.subtitle && <p className="text-xs sm:text-sm text-white/90 mt-2 font-medium">{slide.subtitle}</p>}
                  </div>
                )}
              </div>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full z-20 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all" />
      <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full z-20 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all" />
    </ShadCarousel>
  );
}
