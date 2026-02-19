'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Loader2, AlertTriangle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import { useEffect, useState, useCallback } from 'react';
import type { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import en from '@/locales/en.json';
import bn from '@/locales/bn.json';

const translations = { en, bn };

export default function ProductsAdminPage() {
  const { user } = useAuth();
  const { products, setProducts, invalidateEntity } = useAdminStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const lang = user?.language || 'bn';
  const t = translations[lang].products;
  const common = translations[lang].common;

  const fetchProducts = useCallback(async (force = false) => {
    const siteId = user?.id;
    if (!siteId) return;

    const store = useAdminStore.getState();
    const isFresh = Date.now() - store.lastFetched.products < 300000;
    if (!force && store.products.length > 0 && isFresh) {
        return;
    }

    setIsLoading(true);
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
        toast({
            variant: 'destructive',
            title: 'Error loading products',
            description: error.message,
        });
    } finally {
        setIsLoading(false);
    }
  }, [user?.id, setProducts, toast]);

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
      invalidateEntity('dashboard'); // Invalidate dashboard stats
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
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">
            {t.description}
          </p>
        </div>
        <Button asChild>
          <Link href={`/admin/products/new`}>
            <Plus className="mr-2 h-4 w-4" /> {t.addProduct}
          </Link>
        </Button>
      </div>

      {products.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="text-center py-16">
            <p className="text-muted-foreground">{t.noProducts}</p>
            <Button asChild className="mt-4">
              <Link href={`/admin/products/new`}>
                <Plus className="mr-2 h-4 w-4" /> {t.addProduct}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">{t.image}</TableHead>
                    <TableHead>{t.name}</TableHead>
                    <TableHead>{t.category}</TableHead>
                    <TableHead>{t.price}</TableHead>
                    <TableHead className="text-right">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="relative h-12 w-12 rounded-md overflow-hidden">
                          <Image
                            src={
                              product.images[0]?.imageUrl ||
                              'https://placehold.co/100x100'
                            }
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.categories?.map((cat) => (
                            <Badge key={cat} variant="outline">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.price.toFixed(2)} {product.currency}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/products/${product.id}`}
                                target="_blank"
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" /> {t.view}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/products/${product.id}`}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" /> {t.edit}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive cursor-pointer"
                              onClick={() => setProductToDelete(product)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t.delete}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:hidden">
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="relative h-20 w-20 rounded-md overflow-hidden">
                      <Image
                        src={
                          product.images[0]?.imageUrl ||
                          'https://placehold.co/100x100'
                        }
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <CardTitle className="text-base">{product.name}</CardTitle>
                      <CardDescription>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.categories?.map((cat) => (
                            <Badge key={cat} variant="outline" className="text-[10px]">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </CardDescription>
                      <p className="font-semibold text-lg mt-2 text-primary">
                        {product.price.toFixed(2)} {product.currency}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/products/${product.id}`}
                            target="_blank"
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" /> {t.view}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" /> {t.edit}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive cursor-pointer"
                          onClick={() => setProductToDelete(product)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Delete Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isDeleting && setProductToDelete(null)} />
            <div className="relative w-full max-w-md bg-background rounded-xl shadow-2xl border p-6 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center gap-3 mb-4 text-destructive">
                    <div className="p-2 bg-destructive/10 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
                    <h3 className="text-xl font-bold text-foreground">{common.confirmDelete}</h3>
                </div>
                <div className="mb-8">
                    <p className="text-muted-foreground leading-relaxed">
                        {common.deleteWarning} <strong>"{productToDelete?.name}"</strong> মুছে ফেলা হবে।
                    </p>
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                    <Button variant="outline" onClick={() => setProductToDelete(null)} disabled={isDeleting}>
                        {common.cancel}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {common.delete}
                    </Button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
