
'use client';

import { useState, useMemo, useEffect } from 'react';
import { getProductsByDomain } from '@/lib/products';
import type { Product } from '@/types';
import ProductCard from '@/components/product-card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Search, ListFilter, X, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';

const PRODUCTS_PER_PAGE = 10;

export default function ProductsPage() {
  const params = useParams();
  const username = params.username as string;
  const searchParams = useSearchParams();
  const t = useTranslation();
  const { productsPage: t_products } = t;

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    if (username) {
      const fetchProducts = async () => {
        setIsLoading(true);
        const products = await getProductsByDomain(username);
        setAllProducts(products);
        const maxProductPrice = Math.ceil(
          Math.max(0, ...products.map((p) => p.price))
        );
        setPriceRange([0, maxProductPrice]);
        setIsLoading(false);
      };
      fetchProducts();
    }
  }, [username]);

  useEffect(() => {
    const query = searchParams.get('search');
    const category = searchParams.get('category');
    if (query) {
        setSearchQuery(query);
    }
    if (category) {
        setSelectedCategories([category]);
    }
  }, [searchParams]);

  const allCategories = useMemo(
    () => [...new Set(allProducts.flatMap((p) => p.categories || []))],
    [allProducts]
  );
  const allOrigins = useMemo(
    () => [...new Set(allProducts.map((p) => p.origin).filter(Boolean))],
    [allProducts]
  );
  const maxPrice = useMemo(
    () => Math.ceil(Math.max(0, ...allProducts.map((p) => p.price))),
    [allProducts]
  );

  const handleCategoryChange = (category: string, checked: boolean) => {
    setSelectedCategories((prev) =>
      checked ? [...prev, category] : prev.filter((c) => c !== category)
    );
    setCurrentPage(1);
  };

  const handleOriginChange = (origin: string, checked: boolean) => {
    setSelectedOrigins((prev) =>
      checked ? [...prev, origin] : prev.filter((o) => o !== origin)
    );
    setCurrentPage(1);
  };

  const handlePriceChange = (value: number[]) => {
    setPriceRange(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortOrder(value);
    setCurrentPage(1);
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
        p.categories?.some((cat) => selectedCategories.includes(cat))
      );
    }

    if (selectedOrigins.length > 0) {
      products = products.filter(
        (p) => p.origin && selectedOrigins.includes(p.origin)
      );
    }

    products = products.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    products.sort((a, b) => {
      switch (sortOrder) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return a.name.localeCompare(b.name, 'bn');
        case 'name-desc':
          return b.name.localeCompare(a.name, 'bn');
        default:
          return 0;
      }
    });

    return products;
  }, [
    searchQuery,
    selectedCategories,
    selectedOrigins,
    priceRange,
    sortOrder,
    allProducts,
  ]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const clearFilters = () => {
    setSearchQuery('');
    setSortOrder('name-asc');
    setSelectedCategories([]);
    setSelectedOrigins([]);
    setPriceRange([0, maxPrice]);
    setCurrentPage(1);
  };

  const Filters = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">{t_products.category}</h3>
        <div className="space-y-2">
          {allCategories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`filter-category-${category}`}
                checked={selectedCategories.includes(category)}
                onCheckedChange={(checked) =>
                  handleCategoryChange(category, !!checked)
                }
              />
              <Label htmlFor={`filter-category-${category}`}>{category}</Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">{t_products.origin}</h3>
        <div className="space-y-2">
          {allOrigins.map((origin) => (
            <div key={origin} className="flex items-center space-x-2">
              <Checkbox
                id={`filter-origin-${origin}`}
                checked={selectedOrigins.includes(origin)}
                onCheckedChange={(checked) =>
                  handleOriginChange(origin, !!checked)
                }
              />
              <Label htmlFor={`filter-origin-${origin}`}>{origin}</Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">{t_products.priceRange}</h3>
        <Slider
          min={0}
          max={maxPrice}
          step={1}
          value={priceRange}
          onValueChange={handlePriceChange}
          minStepsBetweenThumbs={1}
          disabled={isLoading || maxPrice === 0}
        />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>
            {priceRange[0]} {paginatedProducts[0]?.currency}
          </span>
          <span>
            {priceRange[1]} {paginatedProducts[0]?.currency}
          </span>
        </div>
      </div>
      {(selectedCategories.length > 0 ||
        selectedOrigins.length > 0 ||
        priceRange[0] > 0 ||
        priceRange[1] < maxPrice) && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="mr-2 h-4 w-4" /> {t_products.clearFilters}
        </Button>
      )}
    </div>
  );

  const Pagination = () => (
    <div className="flex items-center justify-center space-x-2 mt-12">
      <Button
        variant="outline"
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
      >
        {t_products.previous}
      </Button>
      <span className="text-sm text-muted-foreground">
        {t_products.page} {currentPage} {t_products.of} {totalPages}
      </span>
      <Button
        variant="outline"
        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
      >
        {t_products.next}
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 space-y-8">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </aside>
        <main className="lg:col-span-3">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
            <Skeleton className="h-10 w-full sm:max-w-xs" />
            <Skeleton className="h-10 w-full sm:w-[180px]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-4 gap-8">
      <aside className="hidden lg:block lg:col-span-1">
        <div className="sticky top-24">
          <h2 className="text-2xl font-bold mb-4">{t_products.filters}</h2>
          <Filters />
        </div>
      </aside>

      <main className="lg:col-span-3">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t_products.searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Select value={sortOrder} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t_products.sortBy} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">{t_products.sort_nameAsc}</SelectItem>
                <SelectItem value="name-desc">{t_products.sort_nameDesc}</SelectItem>
                <SelectItem value="price-asc">{t_products.sort_priceAsc}</SelectItem>
                <SelectItem value="price-desc">{t_products.sort_priceDesc}</SelectItem>
              </SelectContent>
            </Select>
            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <ListFilter className="h-5 w-5" />
                  <span className="sr-only">{t_products.filters}</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{t_products.filters}</SheetTitle>
                </SheetHeader>
                <div className="mt-8">
                  <Filters />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {paginatedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
            {totalPages > 1 && <Pagination />}
          </>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-2xl font-semibold">{t_products.noProductsFound}</h3>
            <p className="text-muted-foreground mt-2">
              {t_products.noProductsDescription}
            </p>
            <Button onClick={clearFilters} className="mt-6">
              {t_products.clearFiltersBtn}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
