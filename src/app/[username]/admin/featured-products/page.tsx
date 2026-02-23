'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
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
import { Search, Loader2, ChevronLeft, ChevronRight, FilterX } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 10;

export default function FeaturedProductsPage() {
  const { user } = useAuth();
  const { products: allProducts, setProducts, lastFetched } = useAdminStore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(() => {
    return allProducts.length === 0;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchProducts = useCallback(async (force = false) => {
    if (!user) return;
    
    const isFresh = Date.now() - lastFetched.products < 300000;
    if (!force && allProducts.length > 0 && isFresh) {
        setIsLoading(false);
        return;
    }

    if (allProducts.length === 0 || force) {
        setIsLoading(true);
    }

    try {
        const response = await fetch('/api/products/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: user.id }),
        });
        const result = await response.json();
        if (response.ok) {
            const fetched = (result.products as Product[]) || [];
            setProducts(fetched);
        } else {
            throw new Error(result.error || 'Failed to fetch products');
        }
    } catch (error: any) {
        if (allProducts.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    } finally {
        setIsLoading(false);
    }
  }, [user, allProducts.length, lastFetched.products, setProducts, toast]);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user, fetchProducts]);

  // Initialize featuredProductIds once products are loaded
  useEffect(() => {
    if (allProducts.length > 0 && featuredProductIds.length === 0) {
        const currentlyFeatured = allProducts.filter(p => p.is_featured).map(p => p.id);
        setFeaturedProductIds(currentlyFeatured);
    }
  }, [allProducts, featuredProductIds.length]);

  const allCategories = useMemo(
    () => [...new Set(allProducts.flatMap((p) => p.categories || []))],
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
    setCurrentPage(1);
  };

  const filteredProducts = useMemo(() => {
    let prods = allProducts;

    if (searchQuery) {
      prods = prods.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategories.length > 0) {
      prods = prods.filter((p) =>
        p.categories?.some((cat) => selectedCategories.includes(cat))
      );
    }

    return prods;
  }, [allProducts, searchQuery, selectedCategories]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
  
    // Determine which products to feature and un-feature based on selection vs database state
    const productsToFeature = featuredProductIds.filter(id => !allProducts.find(p => p.id === id)?.is_featured);
    const productsToUnfeature = allProducts
      .filter(p => p.is_featured && !featuredProductIds.includes(p.id))
      .map(p => p.id);
  
    try {
        const response = await fetch('/api/products/featured/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                siteId: user.id,
                featuredIds: productsToFeature,
                unfeaturedIds: productsToUnfeature
            })
        });

        if (response.ok) {
            toast({
                title: 'Success!',
                description: 'Featured products have been updated.',
            });
            await fetchProducts(true); // Refresh global store
        } else {
            const result = await response.json();
            throw new Error(result.error || 'Failed to update featured products');
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  const clearFilters = () => {
      setSearchQuery('');
      setSelectedCategories([]);
      setCurrentPage(1);
  };

  if (isLoading && allProducts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32 rounded-md" />
        </div>
        <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader><Skeleton className="h-5 w-20" /></CardHeader>
                    <CardContent className="space-y-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-3">
                <Card>
                    <CardContent className="p-0">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="p-4 flex items-center gap-4 border-b last:border-0">
                                <Skeleton className="h-5 w-5 rounded" />
                                <div className="flex-grow space-y-2">
                                    <Skeleton className="h-5 w-1/2" />
                                    <Skeleton className="h-3 w-1/4" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
        <div>
            <h1 className="text-2xl font-bold">Featured Products Manager</h1>
            <p className="text-sm text-muted-foreground">Select which products to display on the homepage featured section.</p>
        </div>
        <Button onClick={handleSaveChanges} disabled={isSaving} className="shadow-lg shadow-primary/20">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        <aside className="md:col-span-1 space-y-6">
          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="search-products" className="text-xs font-semibold">
                    Search Products
                    </Label>
                    <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="search-products"
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10 h-10"
                    />
                    </div>
                </div>

                <Accordion type="single" collapsible defaultValue="categories" className="w-full">
                    <AccordionItem value="categories" className="border-none">
                    <AccordionTrigger className="text-xs font-semibold py-2 hover:no-underline data-[state=open]:text-primary transition-colors">
                        Categories
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {allCategories.map((category) => (
                            <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                                id={`filter-category-${category}`}
                                checked={selectedCategories.includes(category)}
                                onCheckedChange={(checked) =>
                                handleCategoryChange(category, !!checked)
                                }
                            />
                            <Label
                                htmlFor={`filter-category-${category}`}
                                className="text-sm font-normal cursor-pointer leading-none"
                            >
                                {category}
                            </Label>
                            </div>
                        ))}
                        </div>
                    </AccordionContent>
                    </AccordionItem>
                </Accordion>

                {(searchQuery || selectedCategories.length > 0) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-xs h-8">
                        <FilterX className="h-3 w-3 mr-2" /> Clear All Filters
                    </Button>
                )}
            </CardContent>
          </Card>
        </aside>

        <main className="md:col-span-3 space-y-4">
          <Card className="border-2 shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {paginatedProducts.length > 0 ? (
                  paginatedProducts.map((product) => (
                    <div
                      key={product.id}
                      className={cn(
                          "flex items-center space-x-4 p-4 transition-colors",
                          featuredProductIds.includes(product.id) ? "bg-primary/5" : "hover:bg-muted/30"
                      )}
                    >
                      <Checkbox
                        id={`featured-${product.id}`}
                        checked={featuredProductIds.includes(product.id)}
                        onCheckedChange={(checked) =>
                          handleFeaturedChange(product.id, !!checked)
                        }
                        className="h-5 w-5 rounded-md"
                      />
                      <div className="flex-grow min-w-0">
                        <Label
                            htmlFor={`featured-${product.id}`}
                            className="text-base font-semibold cursor-pointer block truncate"
                        >
                            {product.name}
                        </Label>
                        <div className="flex gap-2 mt-1">
                            {product.categories?.slice(0, 2).map(cat => (
                                <Badge key={cat} variant="outline" className="text-[10px] py-0">{cat}</Badge>
                            ))}
                            <span className="text-[10px] text-muted-foreground ml-auto">{product.price.toFixed(2)} BDT</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-2">
                    <FilterX className="h-10 w-10 opacity-20" />
                    <p>No products match your criteria.</p>
                  </div>
                )}
              </div>
            </CardContent>
            
            {totalPages > 1 && (
                <CardFooter className="flex items-center justify-between border-t p-4 bg-muted/10">
                    <div className="text-xs text-muted-foreground">
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-xs font-bold px-2">
                            {currentPage} / {totalPages}
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardFooter>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}
