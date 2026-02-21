'use client';

import { useRef } from 'react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
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
      className="w-full"
      plugins={[plugin.current]}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent className="-ml-6">
        {reviews.map((review) => (
          <CarouselItem key={review.id} className="pl-6 basis-full md:basis-1/2 lg:basis-1/3">
            <Card className="h-full flex flex-col">
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
                <p className="text-muted-foreground text-sm italic">"{review.review_text}"</p>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}