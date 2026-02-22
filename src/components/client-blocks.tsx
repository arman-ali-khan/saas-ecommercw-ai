
'use client';

import { useState, useEffect, useRef } from 'react';
import { Carousel as ShadCarousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';
import Autoplay from 'embla-carousel-autoplay';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, User, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils';

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


// Carousel (Image Slides)
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

// Reviews Carousel Block
type ReviewItem = {
    id: string;
    reviewer_name: string;
    reviewer_image?: string;
    rating: number;
    social_platform: string;
    message: string;
};

export function ReviewsCarouselBlock({ reviews }: { reviews: ReviewItem[] }) {
    const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

    if (!reviews || reviews.length === 0) return null;

    const SocialIcon = ({ platform }: { platform: string }) => {
        const icons = {
            facebook: Facebook,
            twitter: Twitter,
            instagram: Instagram,
            linkedin: Linkedin,
            youtube: Youtube,
            none: () => null
        };
        const IconComp = icons[platform as keyof typeof icons] || icons.none;
        return <IconComp className="h-4 w-4" />;
    };

    return (
        <ShadCarousel 
            className="w-full relative px-0" 
            opts={{ loop: true, align: 'start' }}
            plugins={[plugin.current]}
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
        >
            <CarouselContent className="-ml-6">
                {reviews.map((review) => (
                    <CarouselItem key={review.id} className="pl-6 basis-full sm:basis-1/2 lg:basis-1/3">
                        <Card className="h-full border-2 shadow-md rounded-2xl overflow-hidden transition-all hover:border-primary/20">
                            <CardContent className="p-6 flex flex-col h-full">
                                <div className="flex items-center gap-4 mb-4">
                                    <Avatar className="h-14 w-14 border-2 border-primary/10 shadow-sm">
                                        {review.reviewer_image ? (
                                            <Image src={review.reviewer_image} alt={review.reviewer_name} width={56} height={56} className="object-cover" />
                                        ) : (
                                            <AvatarFallback><User className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="font-bold text-lg truncate">{review.reviewer_name}</h4>
                                            {review.social_platform !== 'none' && (
                                                <div className="text-primary bg-primary/10 p-1.5 rounded-full shrink-0">
                                                    <SocialIcon platform={review.social_platform} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-0.5 mt-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={cn("h-4 w-4", i < (review.rating || 5) ? "text-primary fill-primary" : "text-muted-foreground/30")} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="relative flex-grow">
                                    <span className="absolute -top-4 -left-2 text-6xl text-primary/10 font-serif leading-none">"</span>
                                    <p className="text-muted-foreground italic text-sm leading-relaxed relative z-10 pt-2">
                                        {review.message}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full z-20 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full z-20 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all" />
        </ShadCarousel>
    );
}
