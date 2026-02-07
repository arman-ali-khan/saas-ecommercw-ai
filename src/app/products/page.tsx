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
  const allOrigins = useMemo(
    () => [...new Set(allProducts.map((p) => p.origin))],
    [allProducts]
  );
  const maxPrice = useMemo(
    () => Math.ceil(Math.max(...allProducts.map((p) => p.price))),
    [allProducts]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, maxPrice]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

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
    
    if (selectedOrigins.length > 0) {
        products = products.filter((p) =>
          selectedOrigins.includes(p.origin)
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
  }, [searchQuery, selectedCategories, selectedOrigins, priceRange, sortOrder, allProducts]);

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
        <h3 className="text-lg font-semibold mb-3">বিভাগ</h3>
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
        <h3 className="text-lg font-semibold mb-3">উৎপত্তি</h3>
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
        <h3 className="text-lg font-semibold mb-3">মূল্য পরিসীমা</h3>
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
      {(selectedCategories.length > 0 || selectedOrigins.length > 0 || priceRange[0] > 0 || priceRange[1] < maxPrice) && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
            <X className="mr-2 h-4 w-4" /> সব ফিল্টার মুছুন
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
        পূর্ববর্তী
      </Button>
      <span className="text-sm text-muted-foreground">
        পৃষ্ঠা {totalPages} এর মধ্যে {currentPage}
      </span>
      <Button
        variant="outline"
        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
      >
        পরবর্তী
      </Button>
    </div>
  );

  return (
    <div className="grid lg:grid-cols-4 gap-8">
      <aside className="hidden lg:block lg:col-span-1">
        <div className="sticky top-24">
          <h2 className="text-2xl font-bold mb-4">ফিল্টার</h2>
          <Filters />
        </div>
      </aside>

      <main className="lg:col-span-3">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="পণ্য খুঁজুন..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Select value={sortOrder} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="সাজান" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">নাম: ক-ঁ</SelectItem>
                <SelectItem value="name-desc">নাম: ঁ-ক</SelectItem>
                <SelectItem value="price-asc">দাম: কম থেকে বেশি</SelectItem>
                <SelectItem value="price-desc">দাম: বেশি থেকে কম</SelectItem>
              </SelectContent>
            </Select>
            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <ListFilter className="h-5 w-5" />
                  <span className="sr-only">ফিল্টার</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>ফিল্টার</SheetTitle>
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
            <h3 className="text-2xl font-semibold">কোনো পণ্য পাওয়া যায়নি</h3>
            <p className="text-muted-foreground mt-2">
              আপনার ফিল্টার বা অনুসন্ধানের শব্দ পরিবর্তন করে চেষ্টা করুন।
            </p>
            <Button onClick={clearFilters} className="mt-6">
              ফিল্টার মুছুন
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
