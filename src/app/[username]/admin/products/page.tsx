'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Loader2, AlertTriangle, ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import en from '@/locales/en.json';
import bn from '@/locales/bn.json';

const translations = { en, bn };
const ITEMS_PER_PAGE = 10;

export default function ProductsAdminPage() {
  const { user } = useAuth();
  const { products, setProducts, invalidateEntity } = useAdminStore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(() => {
    const currentStore = useAdminStore.getState();
    return currentStore.products.length === 0;
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const lang = user?.language || 'bn';
  const currentTranslations = translations[lang as keyof typeof translations]?.products || translations.bn.products;
  const commonTranslations = translations[lang as keyof typeof translations]?.common || translations.bn.common;

  const fetchProducts = useCallback(async (force = false) => {
    const siteId = user?.id;
    if (!siteId) return;

    const currentStore = useAdminStore.getState();
    const now = Date.now();
    const isFresh = now - currentStore.lastFetched.products < 300000;
    
    if (!force && currentStore.products.length > 0 && isFresh) {
        setIsLoading(false);
        return;
    }

    if (force || currentStore.products.length === 0) {
        setIsLoading(true);
    }

    try {
        const response = await fetch('/api/products/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId }),
        });
        const result = await response.json();
        if (response.ok) {
            setProducts(result.products || []);
        } else {
            throw new Error(result.error || 'Failed to fetch products');
        }
    } catch (error: any) {
        if (products.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Error loading products',
                description: error.message,
            });
        }
    } finally {
        setIsLoading(false);
    }
  }, [user?.id, setProducts, toast, products.length]);

  useEffect(() => {
    if (user?.id) {
      fetchProducts();
    }
  }, [user?.id, fetchProducts]);

  const handleDelete = async () => {
    if (!productToDelete || !user) return;
    
    setIsDeleting(true);
    try {
        const response = await fetch('/api/products/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: productToDelete.id,
                siteId: user.id,
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete product');
        }

      toast({ title: 'Product deleted' });
      invalidateEntity('dashboard'); 
      await fetchProducts(true);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete product',
        description: error.message,
      });
    } finally {
        setIsDeleting(false);
        setProductToDelete(null);
    }
  };

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    return products.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [products, currentPage]);

  const getPriceDisplay = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map(v => v.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      
      if (min === max) {
        return `${min.toFixed(2)} ${product.currency}`;
      }
      return (
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-normal uppercase tracking-tighter">Range</span>
          <span className="font-bold text-primary">{min.toFixed(2)} - {max.toFixed(2)} {product.currency}</span>
        </div>
      );
    }
    return `${product.price.toFixed(2)} ${product.currency}`;
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{currentTranslations.title}</h1>
          <p className="text-muted-foreground">{currentTranslations.description}</p>
        </div>
        <Button asChild>
          <Link href={`/admin/products/new`}><Plus className="mr-2 h-4 w-4" /> {currentTranslations.addProduct}</Link>
        </Button>
      </div>

      {products.length === 0 && !isLoading ? (
        <Card><CardContent className="text-center py-16"><p className="text-muted-foreground">{currentTranslations.noProducts}</p></CardContent></Card>
      ) : (
        <>
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">{currentTranslations.image}</TableHead>
                    <TableHead>{currentTranslations.name}</TableHead>
                    <TableHead>{currentTranslations.category}</TableHead>
                    <TableHead>{currentTranslations.price}</TableHead>
                    <TableHead className="text-right">{currentTranslations.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((productItem) => (
                    <TableRow key={productItem.id}>
                      <TableCell>
                        <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted">
                          <Image src={productItem.images[0]?.imageUrl || 'https://placehold.co/100x100'} alt={productItem.name} fill className="object-cover" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{productItem.name}</span>
                          {productItem.variants && productItem.variants.length > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Tag className="h-2 w-2" /> {productItem.variants.length} Variants
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><div className="flex flex-wrap gap-1">{productItem.categories?.map((categoryName) => <Badge key={categoryName} variant="outline" className="text-[10px]">{categoryName}</Badge>)}</div></TableCell>
                      <TableCell className="font-semibold">{getPriceDisplay(productItem)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{currentTranslations.actions}</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={`/products/${productItem.id}`} target="_blank" className="cursor-pointer"><Eye className="mr-2 h-4 w-4" /> {currentTranslations.view}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/admin/products/${productItem.id}`} className="cursor-pointer"><Edit className="mr-2 h-4 w-4" /> {currentTranslations.edit}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => setProductToDelete(productItem)}><Trash2 className="mr-2 h-4 w-4" />{currentTranslations.delete}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            {totalPages > 1 && (
                <CardFooter className="flex justify-center gap-4 py-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        আগেরটি
                    </Button>
                    <div className="text-sm font-medium">পৃষ্ঠা {currentPage} / {totalPages}</div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                        পরবর্তী
                    </Button>
                </CardFooter>
            )}
          </Card>

          <div className="grid gap-4 md:hidden">
            {paginatedProducts.map((productItem) => (
              <Card key={productItem.id}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start gap-4">
                    <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted">
                      <Image src={productItem.images[0]?.imageUrl || 'https://placehold.co/100x100'} alt={productItem.name} fill className="object-cover" />
                    </div>
                    <div className="flex-grow">
                      <CardTitle className="text-base line-clamp-1">{productItem.name}</CardTitle>
                      <div className="mt-2">
                        {getPriceDisplay(productItem)}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="-mt-2 -mr-2"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link href={`/admin/products/${productItem.id}`} className="cursor-pointer"><Edit className="mr-2 h-4 w-4" /> {currentTranslations.edit}</Link></DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => setProductToDelete(productItem)}><Trash2 className="mr-2 h-4 w-4" /> {currentTranslations.delete}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardFooter className="p-4 pt-0">
                   <div className="flex flex-wrap gap-1">
                      {productItem.categories?.slice(0, 2).map((cat) => <Badge key={cat} variant="secondary" className="text-[10px]">{cat}</Badge>)}
                      {productItem.variants && productItem.variants.length > 0 && <Badge variant="outline" className="text-[10px]">{productItem.variants.length} Variants</Badge>}
                   </div>
                </CardFooter>
              </Card>
            ))}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 py-4">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        আগেরটি
                    </Button>
                    <span className="text-xs font-medium">{currentPage} / {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                        পরবর্তী
                    </Button>
                </div>
            )}
          </div>
        </>
      )}

      {productToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isDeleting && setProductToDelete(null)} />
            <div className="relative w-full max-w-md bg-background rounded-xl shadow-2xl border p-6 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3 mb-4 text-destructive">
                    <div className="p-2 bg-destructive/10 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
                    <h3 className="text-xl font-bold text-foreground">{commonTranslations.confirmDelete}</h3>
                </div>
                <div className="mb-8"><p className="text-muted-foreground leading-relaxed">{commonTranslations.deleteWarning} <strong>"{productToDelete?.name}"</strong> মুছে ফেলা হবে।</p></div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                    <Button variant="outline" onClick={() => setProductToDelete(null)} disabled={isDeleting}>{commonTranslations.cancel}</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{commonTranslations.delete}</Button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
