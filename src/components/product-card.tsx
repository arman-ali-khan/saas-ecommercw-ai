'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product, FlashDeal } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { ShoppingBag, Star } from 'lucide-react';
import { useCart } from '@/stores/cart';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import Countdown from './countdown';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface ProductCardProps {
  product: Product;
  flashDeal?: FlashDeal;
}

export default function ProductCard({ product, flashDeal }: ProductCardProps) {
  const addToCart = useCart((state) => state.addToCart);
  const { toast } = useToast();
  const t = useTranslation();
  const { productCard: t_card } = t;

  const handleAddToCart = () => {
    // If product has variants, redirect to details page instead of direct add
    if (product.variants && product.variants.length > 0) {
        window.location.href = `/products/${product.id}`;
        return;
    }

    const productWithDealPrice = flashDeal
      ? { ...product, price: flashDeal.discount_price }
      : product;
    addToCart(productWithDealPrice, 1);
    toast({
      title: 'ব্যাগে যোগ করা হয়েছে',
      description: `1 x ${product.name} আপনার ব্যাগে যোগ করা হয়েছে।`,
    });
  };

  const productUrl = `/products/${product.id}`;

  // Logic to determine display price or range
  const priceDisplay = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map(v => v.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      if (minPrice === maxPrice) {
        return `${minPrice.toFixed(2)} ${product.currency}`;
      }
      return `${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)} ${product.currency}`;
    }
    
    const basePrice = flashDeal ? flashDeal.discount_price : product.price;
    return `${basePrice.toFixed(2)} ${product.currency}`;
  }, [product, flashDeal]);

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <Link href={productUrl} className="block relative">
        <CardHeader className="p-0">
          <div className="relative w-full aspect-[6/5]">
            <Image
              src={product.images[0]?.imageUrl || 'https://placehold.co/400x300'}
              alt={product.name}
              data-ai-hint={product.images[0]?.imageHint || 'product image'}
              fill
              className="object-cover"
            />
          </div>
          {flashDeal && <Badge className="absolute top-2 left-2" variant="destructive">Sale</Badge>}
        </CardHeader>
        <CardContent className="p-1 sm:p-4 flex-grow">
          <h3 className="text-sm sm:text-lg font-headline font-semibold line-clamp-1">{product.name}</h3>
           {product.review_count && product.review_count > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      product.avg_rating && i < Math.round(product.avg_rating)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">({product.review_count})</span>
            </div>
          )}
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm line-clamp-2">{product.description}</p>
          {flashDeal && (
            <div className="mt-2">
              <Countdown endDate={flashDeal.end_date} />
            </div> 
          )}
        </CardContent>
      </Link>
      <CardFooter className="p-1 block sm:p-4 !pt-1 sm:mt-auto items-center">
        <div className="flex flex-col w-full mb-3">
            {flashDeal && !product.variants?.length && (
                <p className="text-xs font-bold text-muted-foreground line-through">
                    {product.price.toFixed(2)} {product.currency}
                </p>
            )}
            <p className="text-sm sm:text-lg font-bold text-primary">
                {priceDisplay}
            </p>
        </div>
        <Button 
            onClick={handleAddToCart} 
            className="w-full h-9 sm:h-10 text-xs sm:text-sm"
            variant={product.variants && product.variants.length > 0 ? "outline" : "default"}
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          {product.variants && product.variants.length > 0 ? "অপশন দেখুন" : t_card.addToBag}
        </Button>
      </CardFooter>
    </Card>
  );
}