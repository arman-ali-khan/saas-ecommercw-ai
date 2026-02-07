import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <Link href={`/products/${product.id}`} className="flex flex-col h-full">
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
        <CardFooter className="p-4 mt-auto flex justify-between items-center">
          <p className="text-lg font-bold text-primary">
            {product.price.toFixed(2)} {product.currency}
          </p>
          <Button variant="ghost" size="sm">
            View <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
}
