

'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product, FlashDeal } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/stores/cart';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import Countdown from './countdown';
import { useTranslation } from '@/hooks/use-translation';

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
  const displayPrice = flashDeal ? flashDeal.discount_price : product.price;

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <Link href={productUrl} className="block relative">
        <CardHeader className="p-0">
          <div className="relative w-full aspect-[6/5]">
            <Image
              src={product.images[0].imageUrl}
              alt={product.name}
              data-ai-hint={product.images[0].imageHint}
              fill
              className="object-cover"
            />
          </div>
          {flashDeal && <Badge className="absolute top-2 left-2" variant="destructive">Sale</Badge>}
        </CardHeader>
        <CardContent className="p-1 sm:p-4 flex-grow">
          <h3 className="text-sm sm:text-lg font-headline font-semibold">{product.name}</h3>
          <p className="text-muted-foreground mt-1 text-sm truncate">{product.description}</p>
          {flashDeal && (
            <div className="mt-2">
              <Countdown endDate={flashDeal.end_date} />
            </div> 
          )}
        </CardContent>
      </Link>
      <CardFooter className="p-1 block sm:p-4 !pt-1 sm:mt-auto items-center">
        <div className="flex flex-col w-full justify-start sm:justify-center">
            {flashDeal && (
                <p className="text-sm font-bold text-muted-foreground line-through">
                    {product.price.toFixed(2)} {product.currency}
                </p>
            )}
            <p className="text-sm sm:text-lg font-bold text-primary">
                {displayPrice.toFixed(2)} {product.currency}
            </p>
        </div>
        <Button onClick={handleAddToCart}>
          <ShoppingBag className="w-4 h-4 mr-2" />
          {t_card.addToBag}
        </Button>
      </CardFooter>
    </Card>
  );
}
