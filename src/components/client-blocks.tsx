
'use client';

import { useState, useEffect } from 'react';
import { Carousel as ShadCarousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';

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
  title: string;
  subtitle?: string;
};
export function CarouselBlock({ slides }: { slides: CarouselSlide[] }) {
  if (!slides || slides.length === 0) return null;
  
  return (
    <ShadCarousel className="w-full" opts={{ loop: true }}>
      <CarouselContent>
        {slides.map((slide) => (
          <CarouselItem key={slide.id}>
            <div className="relative aspect-video">
              <Image src={slide.image} alt={slide.title} fill className="object-cover rounded-lg" />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-4">
                <h3 className="text-4xl font-bold text-white">{slide.title}</h3>
                {slide.subtitle && <p className="text-lg text-white/90 mt-2">{slide.subtitle}</p>}
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex" />
      <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex" />
    </ShadCarousel>
  );
}
