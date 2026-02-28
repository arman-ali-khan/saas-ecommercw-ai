
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
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Loader2, AlertTriangle, ChevronLeft, ChevronRight, Tag, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import { useEffect, useState, useCallback } from 'react';
import type { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import en from '@/locales/en.json';
import bn from '@/locales/bn.json';
import { cn } from '@/lib/utils';

const translations = { en, bn };
const ITEMS_PER_PAGE = 10;

export default function ProductsAdminPage() {
  const { user } = useAuth();
  const { products, setProducts, totals, setTotal, invalidateEntity } = useAdminStore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);

  const lang = user?.language || 'bn';
  const currentTranslations = translations[lang as keyof typeof translations]?.products || translations.bn.products;
  const commonTranslations = translations[lang as keyof typeof translations]?.common || translations.bn.common;

  const fetchProducts = useCallback(async (page: number) => {
    const siteIdValue = user?.id;
    if (!siteIdValue) return;

    setIsLoading(true);
    try {
        const response = await fetch('/api/products/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                siteId: siteIdValue,
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE
            }),
        });
        const result = await response.json();
        if (response.ok) {
            setProducts(result.products || []);
            setTotal('products', result.total || 0);
        } else {
            throw new Error(result.error || 'Failed to fetch products');
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error loading products',
            description: error.message,
        });
    } finally {
        setIsLoading(false);
    }
  }, [user?.id, setProducts, setTotal, toast]);

  useEffect(() => {
    if (user?.id) {
      fetchProducts(currentPage);
    }
  }, [user?.id, fetchProducts, currentPage]);

  const handleDelete = async (ids: string[]) => {
    if (!user || ids.length === 0) return;
    
    setIsDeleting(true);
    try {
        const response = await fetch('/api/products/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productIds: ids,
                siteId: user.id,
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete product(s)');
        }

      toast({ title: ids.length > 1 ? `${ids.length} products deleted` : 'Product deleted' });
      invalidateEntity('dashboard'); 
      setSelectedIds([]);
      await fetchProducts(currentPage);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete',
        description: error.message,
      });
    } finally {
        setIsDeleting(false);
        setProductToDelete(null);
        setIsBulkDeleteOpen(false);
    }
  };

  const totalPagesCount = Math.ceil(totals.products / ITEMS_PER_PAGE);

  const getPriceDisplay = (productItem: Product) => {
    if (productItem.variants && productItem.variants.length > 0) {
      const prices = productItem.variants.map(v => v.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      if (minPrice === maxPrice) {
        return `${minPrice.toFixed(2)} ${productItem.currency}`;
      }
      return (
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground font-normal uppercase tracking-tighter">Range</span>
          <span className="font-bold text-primary">{minPrice.toFixed(2)} - {maxPrice.toFixed(2)} {productItem.currency}</span>
        </div>
      );
    }
    return `${productItem.price.toFixed(2)} ${productItem.currency}`;
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        const allIdsOnPage = products.map(p => p.id);
        setSelectedIds(prev => Array.from(new Set([...prev, ...allIdsOnPage])));
    } else {
        const allIdsOnPage = products.map(p => p.id);
        setSelectedIds(prev => prev.filter(id => !allIdsOnPage.includes(id)));
    }
  };

  const isAllSelectedOnPage = products.length > 0 && products.every(p => selectedIds.includes(p.id));

  if (isLoading && products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-80" />
            </div>
            <Skeleton className="h-10 w-36" />
        </div>
        <Card>
            <CardContent className="p-0">
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12"><Skeleton className="h-4 w-4" /></TableHead>
                                <TableHead className="w-[80px]"><Skeleton className="h-4 w-full" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-full" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-full" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-full" /></TableHead>
                                <TableHead className="text-right"><Skeleton className="h-4 w-full ml-auto" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                    <TableCell><Skeleton className="h-12 w-12 rounded-md" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{currentTranslations.title}</h1>
          <p className="text-muted-foreground">{currentTranslations.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
              <Button variant="destructive" className="rounded-xl h-11 animate-in fade-in zoom-in duration-300" onClick={() => setIsBulkDeleteOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" /> 
                  {selectedIds.length} ডিলিট করুন
              </Button>
          )}
          <Button variant="outline" asChild className="rounded-xl h-11">
            <Link href={`/admin/products/bulk-upload`}>
              <Upload className="mr-2 h-4 w-4" /> 
              <span className='hidden sm:block'>Bulk Import</span>
            </Link>
          </Button>
          <Button asChild className="rounded-xl h-11">
            <Link href={`/admin/products/new`}><Plus className="mr-2 h-4 w-4" /> <span className='hidden sm:block'>{currentTranslations.addProduct}</span></Link>
          </Button>
        </div>
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
                    <TableHead className="w-12">
                        <Checkbox 
                            checked={isAllSelectedOnPage} 
                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                            aria-label="Select all"
                        />
                    </TableHead>
                    <TableHead className="w-[80px]">{currentTranslations.image}</TableHead>
                    <TableHead>{currentTranslations.name}</TableHead>
                    <TableHead>{currentTranslations.category}</TableHead>
                    <TableHead>{currentTranslations.price}</TableHead>
                    <TableHead className="text-right">{currentTranslations.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((productItem) => (
                    <TableRow key={productItem.id} className={cn(selectedIds.includes(productItem.id) && "bg-muted/50", isLoading && "opacity-50")}>
                      <TableCell>
                        <Checkbox 
                            checked={selectedIds.includes(productItem.id)} 
                            onCheckedChange={() => handleToggleSelect(productItem.id)}
                            aria-label={`Select ${productItem.name}`}
                        />
                      </TableCell>
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
            {totalPagesCount > 1 && (
                <CardFooter className="flex justify-center gap-4 py-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                        আগেরটি
                    </Button>
                    <div className="text-sm font-medium">পৃষ্ঠা {currentPage} / {totalPagesCount}</div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPagesCount, prev + 1))} disabled={currentPage === totalPagesCount}>
                        পরবর্তী
                    </Button>
                </CardFooter>
            )}
          </Card>

          <div className="grid gap-4 md:hidden">
            {products.map((productItem) => (
              <Card key={productItem.id} className={cn(selectedIds.includes(productItem.id) && "border-primary bg-primary/5", isLoading && "opacity-50")}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                        <Checkbox 
                            checked={selectedIds.includes(productItem.id)} 
                            onCheckedChange={() => handleToggleSelect(productItem.id)}
                        />
                    </div>
                    <div className="relative w-16 h-16 min-w-16 min-h-16 rounded-md overflow-hidden bg-muted">
                      <Image src={productItem.images[0]?.imageUrl || 'https://placehold.co/100x100'} alt={productItem.name} fill className="object-cover" />
                    </div>
                    <div className="flex-grow">
                      <CardTitle className="text-base line-clamp-1">{productItem.name}</CardTitle>
                      <div className="mt-2 text-primary font-bold">
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
                      {productItem.categories?.slice(0, 2).map((catName) => <Badge key={catName} variant="secondary" className="text-[10px]">{catName}</Badge>)}
                      {productItem.variants && productItem.variants.length > 0 && <Badge variant="outline" className="text-[10px]">{productItem.variants.length} Variants</Badge>}
                   </div>
                </CardFooter>
              </Card>
            ))}
            {totalPagesCount > 1 && (
                <div className="flex justify-center items-center gap-4 py-4">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                        আগেরটি
                    </Button>
                    <span className="text-xs font-medium">{currentPage} / {totalPagesCount}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPagesCount, prev + 1))} disabled={currentPage === totalPagesCount}>
                        পরবর্তী
                    </Button>
                </div>
            )}
          </div>
        </>
      )}

      {/* Single Delete Modal */}
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
                    <Button variant="destructive" onClick={() => handleDelete([productToDelete.id])} disabled={isDeleting}>{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{commonTranslations.delete}</Button>
                </div>
            </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {isBulkDeleteOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isDeleting && setIsBulkDeleteOpen(false)} />
            <div className="relative w-full max-w-md bg-background rounded-xl shadow-2xl border p-6 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3 mb-4 text-destructive">
                    <div className="p-2 bg-destructive/10 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
                    <h3 className="text-xl font-bold text-foreground">একসাথে অনেক ডিলিট</h3>
                </div>
                <div className="mb-8"><p className="text-muted-foreground leading-relaxed">আপনি কি নিশ্চিত যে আপনি নির্বাচিত <strong>{selectedIds.length} টি</strong> পণ্য স্থায়ীভাবে ডিলিট করতে চান? এটি আর ফেরানো সম্ভব নয়।</p></div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsBulkDeleteOpen(false)} disabled={isDeleting}>{commonTranslations.cancel}</Button>
                    <Button variant="destructive" onClick={() => handleDelete(selectedIds)} disabled={isDeleting}>{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}সবগুলো ডিলিট করুন</Button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
