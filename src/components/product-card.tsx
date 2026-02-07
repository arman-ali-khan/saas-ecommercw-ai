'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/cart-context';

interface ProductCardProps {
  product: Product;
  username?: string;
}

export default function ProductCard({ product, username }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product, 1);
  };

  const productUrl = username
    ? `/${username}/products/${product.id}`
    : `/products/${product.id}`;

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <Link href={productUrl} className="block">
        <CardHeader className="p-0">
          <div className="relative w-full h-56">
            <Image
              src={product.images[0].imageUrl}
              alt={product.name}
              data-ai-hint={product.images[0].imageHint}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <h3 className="text-xl font-headline font-semibold">{product.name}</h3>
          <p className="text-muted-foreground mt-1">{product.description}</p>
        </CardContent>
      </Link>
      <CardFooter className="p-4 mt-auto flex justify-between items-center">
        <p className="text-lg font-bold text-primary">
          {product.price.toFixed(2)} {product.currency}
        </p>
        <Button onClick={handleAddToCart}>
          <ShoppingBag className="w-4 h-4 mr-2" />
          ব্যাগে যোগ করুন
        </Button>
      </CardFooter>
    </Card>
  );
}
