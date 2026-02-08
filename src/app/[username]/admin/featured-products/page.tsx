'use client';

import { useState, useMemo, useEffect } from 'react';
import { getProductsBySiteId } from '@/lib/products';
import { useAuth } from '@/stores/auth';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FeaturedProductsPage() {
  const { user } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const fetchProducts = async () => {
        setIsLoading(true);
        const products = await getProductsBySiteId(user.id);
        setAllProducts(products);
        if (products.length > 0) {
          setFeaturedProductIds([products[0].id]);
        }
        setIsLoading(false);
      };
      fetchProducts();
    }
  }, [user]);

  const allCategories = useMemo(
    () => [...new Set(allProducts.map((p) => p.category))],
    [allProducts]
  );

  const handleFeaturedChange = (productId: string, checked: boolean) => {
    setFeaturedProductIds((prev) => {
      if (checked) {
        return [...prev, productId];
      } else {
        return prev.filter((id) => id !== productId);
      }
    });
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    setSelectedCategories((prev) =>
      checked ? [...prev, category] : prev.filter((c) => c !== category)
    );
  };

  const filteredProducts = useMemo(() => {
    let products = allProducts;

    if (searchQuery) {
      products = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategories.length > 0) {
      products = products.filter((p) =>
        selectedCategories.includes(p.category)
      );
    }

    return products;
  }, [allProducts, searchQuery, selectedCategories]);

  const handleSaveChanges = () => {
    console.log('Saving featured products:', featuredProductIds);
    toast({
      title: 'Success!',
      description: 'Featured products have been updated.',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Featured Products Manager</CardTitle>
        <CardDescription>
          Select which products to display on the homepage featured section.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-4 gap-8">
        <aside className="md:col-span-1 space-y-6">
          <div>
            <Label htmlFor="search-products" className="font-semibold">
              Search Products
            </Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-products"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Accordion
            type="single"
            collapsible
            defaultValue="categories"
            className="w-full"
          >
            <AccordionItem value="categories">
              <AccordionTrigger className="text-base font-semibold">
                Categories
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {allCategories.map((category) => (
                    <div
                      key={category}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`filter-category-${category}`}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={(checked) =>
                          handleCategoryChange(category, !!checked)
                        }
                      />
                      <Label
                        htmlFor={`filter-category-${category}`}
                        className="font-normal"
                      >
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </aside>

        <main className="md:col-span-3">
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-3">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center space-x-3 rounded-md border p-3 hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`featured-${product.id}`}
                      checked={featuredProductIds.includes(product.id)}
                      onCheckedChange={(checked) =>
                        handleFeaturedChange(product.id, !!checked)
                      }
                      className="h-5 w-5"
                    />
                    <Label
                      htmlFor={`featured-${product.id}`}
                      className="text-base flex-grow cursor-pointer"
                    >
                      {product.name}
                    </Label>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-center py-8">
                    No products match your criteria.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </main>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </CardFooter>
    </Card>
  );
}
