'use client';

import { useState, useMemo } from 'react';
import { getProducts } from '@/lib/products';
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
import { Search, ListFilter, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const PRODUCTS_PER_PAGE = 8;

export default function ProductsPage() {
  const allProducts = useMemo(() => getProducts(), []);
  const allCategories = useMemo(
    () => [...new Set(allProducts.map((p) => p.category))],
    [allProducts]
  );
  const maxPrice = useMemo(
    () => Math.ceil(Math.max(...allProducts.map((p) => p.price))),
    [allProducts]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, maxPrice]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const handleCategoryChange = (category: string, checked: boolean) => {
    setSelectedCategories((prev) =>
      checked ? [...prev, category] : prev.filter((c) => c !== category)
    );
    setCurrentPage(1);
  };
  
  const handlePriceChange = (value: number[]) => {
      setPriceRange(value);
      setCurrentPage(1);
  }
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      setCurrentPage(1);
  }
  
  const handleSortChange = (value: string) => {
      setSortOrder(value);
      setCurrentPage(1);
  }

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
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return products;
  }, [searchQuery, selectedCategories, priceRange, sortOrder, allProducts]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const clearFilters = () => {
    setSearchQuery('');
    setSortOrder('name-asc');
    setSelectedCategories([]);
    setPriceRange([0, maxPrice]);
    setCurrentPage(1);
  };

  const Filters = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Categories</h3>
        <div className="space-y-2">
          {allCategories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`filter-${category}`}
                checked={selectedCategories.includes(category)}
                onCheckedChange={(checked) =>
                  handleCategoryChange(category, !!checked)
                }
              />
              <Label htmlFor={`filter-${category}`}>{category}</Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Price Range</h3>
        <Slider
          min={0}
          max={maxPrice}
          step={1}
          value={priceRange}
          onValueChange={handlePriceChange}
          minStepsBetweenThumbs={1}
        />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>{priceRange[0]} {paginatedProducts[0]?.currency}</span>
          <span>{priceRange[1]} {paginatedProducts[0]?.currency}</span>
        </div>
      </div>
      {(selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < maxPrice) && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
            <X className="mr-2 h-4 w-4" /> Clear All Filters
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
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );

  return (
    <div className="grid lg:grid-cols-4 gap-8">
      <aside className="hidden lg:block lg:col-span-1">
        <div className="sticky top-24">
          <h2 className="text-2xl font-bold mb-4">Filters</h2>
          <Filters />
        </div>
      </aside>

      <main className="lg:col-span-3">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Select value={sortOrder} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name: A-Z</SelectItem>
                <SelectItem value="name-desc">Name: Z-A</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <ListFilter className="h-5 w-5" />
                  <span className="sr-only">Filters</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {totalPages > 1 && <Pagination />}
          </>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-2xl font-semibold">No Products Found</h3>
            <p className="text-muted-foreground mt-2">
              Try adjusting your filters or search terms.
            </p>
            <Button onClick={clearFilters} className="mt-6">
              Clear Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
