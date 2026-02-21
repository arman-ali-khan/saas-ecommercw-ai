
'use client';

import { useState } from 'react';
import type { Product, Section } from '@/types';
import ProductCard from './product-card';
import { Button } from './ui/button';
import { Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeaturedProductsListProps {
  initialProducts: Product[];
  siteId: string;
  section: Section;
  t: any;
}

const getGridClass = (view?: string) => {
    switch(view) {
        case '1-col': return 'grid-cols-1';
        case 'list': return 'grid-cols-1 gap-3';
        case '2-col': return 'grid-cols-2';
        default: return 'grid-cols-2';
    }
};

export default function FeaturedProductsList({ initialProducts, siteId, section, t }: FeaturedProductsListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length >= (section.productLimit || 10));
  const [offset, setOffset] = useState(initialProducts.length);

  const loadMore = async () => {
    setIsLoading(true);
    try {
        const limit = section.productLimit || 10;
        const response = await fetch('/api/products/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                siteId, 
                isFeatured: true,
                limit: limit,
                offset: offset
            }),
        });
        const result = await response.json();
        
        if (response.ok && result.products) {
            const newProducts = result.products;
            setProducts(prev => [...prev, ...newProducts]);
            setOffset(prev => prev + newProducts.length);
            if (newProducts.length < limit) {
                setHasMore(false);
            }
        } else {
            setHasMore(false);
        }
    } catch (error) {
        console.error("Failed to load more featured products:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const gridClass = getGridClass(section.mobileView);

  return (
    <div className="space-y-10">
      <div className={cn("grid md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4", gridClass)}>
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            isList={section.mobileView === 'list'} 
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button 
            onClick={loadMore} 
            disabled={isLoading}
            variant="outline"
            size="lg"
            className="rounded-full px-10 shadow-sm border-2 font-bold group"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> লোড হচ্ছে...</>
            ) : (
              <><Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" /> আরও দেখুন</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
