'use client';

import { useRef } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import { cn } from '@/lib/utils';
import type { ProductReview } from '@/types';

export default function ReviewsCarousel({ reviews }: { reviews: ProductReview[] }) {
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

  return (
    <Carousel
      opts={{ align: 'start', loop: true }}
      className="w-full relative px-0"
      plugins={[plugin.current]}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent className="-ml-6">
        {reviews.map((review) => (
          <CarouselItem key={review.id} className="pl-6 basis-full md:basis-1/2 lg:basis-1/3">
            <Card className="h-full flex flex-col border-2">
              <CardHeader className="flex-row items-center gap-4">
                <Avatar><AvatarFallback>{review.customer_name.charAt(0)}</AvatarFallback></Avatar>
                <div>
                  <CardTitle className="text-base">{review.customer_name}</CardTitle>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn("h-4 w-4", i < review.rating ? "text-primary fill-primary" : "text-muted-foreground/30")} />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="font-semibold">{review.title}</p>
                <p className="text-muted-foreground text-sm italic mt-2">"{review.review_text}"</p>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full z-20 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all" />
      <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full z-20 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all" />
    </Carousel>
  );
}
