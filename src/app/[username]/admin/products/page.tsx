
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
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/stores/auth';
import { useEffect, useState, useCallback } from 'react';
import type { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import en from '@/locales/en.json';
import bn from '@/locales/bn.json';

const translations = { en, bn };

export default function ProductsAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const lang = user?.language || 'bn';
  const t = {
    title: { en: 'Product Management', bn: 'প্রোডাক্ট ম্যানেজমেন্ট' },
    description: { en: 'Add, edit, and manage products for your store.', bn: 'আপনার দোকানের জন্য প্রোডাক্ট যোগ, এডিট এবং ম্যানেজ করুন।' },
    addProduct: { en: 'Add New Product', bn: 'নতুন প্রোডাক্ট যোগ করুন' },
    noProducts: { en: 'You have no products yet.', bn: 'আপনার কোনো প্রোডাক্ট নেই।' },
    image: { en: 'Image', bn: 'ছবি' },
    name: { en: 'Name', bn: 'নাম' },
    category: { en: 'Category', bn: 'বিভাগ' },
    price: { en: 'Price', bn: 'দাম' },
    actions: { en: 'Actions', bn: 'অ্যাকশন' },
    menu: { en: 'Menu', bn: 'মেনু' },
    view: { en: 'View', bn: 'দেখুন' },
    edit: { en: 'Edit', bn: 'এডিট' },
    delete: { en: 'Delete', bn: 'মুছুন' },
    deleteConfirmTitle: { en: 'Are you absolutely sure?', bn: 'আপনি কি নিশ্চিত?' },
    deleteConfirmDesc: { en: 'This will permanently delete the product "{productName}". This action cannot be undone.', bn: 'এটি স্থায়ীভাবে "{productName}" প্রোডাক্টটি মুছে ফেলবে। এই কাজটি আর ফেরানো যাবে না।'},
    cancel: { bn: 'বাতিল', en: 'Cancel' }
  };

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        const response = await fetch('/api/products/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: user.id }),
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
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchProducts();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [user, authLoading, fetchProducts]);

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
      await fetchProducts(); // Refetch products
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

  if (isLoading) {
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
          <h1 className="text-2xl font-bold">{t.title[lang]}</h1>
          <p className="text-muted-foreground">
            {t.description[lang]}
          </p>
        </div>
        <Button asChild>
          <Link href={`/admin/products/new`}>
            <Plus className="mr-2 h-4 w-4" /> {t.addProduct[lang]}
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <p className="text-muted-foreground">{t.noProducts[lang]}</p>
            <Button asChild className="mt-4">
              <Link href={`/admin/products/new`}>
                <Plus className="mr-2 h-4 w-4" /> {t.addProduct[lang]}
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
                    <TableHead className="w-[80px]">{t.image[lang]}</TableHead>
                    <TableHead>{t.name[lang]}</TableHead>
                    <TableHead>{t.category[lang]}</TableHead>
                    <TableHead>{t.price[lang]}</TableHead>
                    <TableHead className="text-right">{t.actions[lang]}</TableHead>
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
                              <span className="sr-only">{t.menu[lang]}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t.actions[lang]}</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/products/${product.id}`}
                                target="_blank"
                              >
                                <Eye className="mr-2 h-4 w-4" /> {t.view[lang]}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/products/${product.id}`}
                              >
                                <Edit className="mr-2 h-4 w-4" /> {t.edit[lang]}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setProductToDelete(product)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t.delete[lang]}
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

          {/* Mobile View: Cards */}
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
                      <CardTitle>{product.name}</CardTitle>
                      <CardDescription>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.categories?.map((cat) => (
                            <Badge key={cat} variant="outline">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </CardDescription>
                      <p className="font-semibold text-lg mt-2">
                        {product.price.toFixed(2)} {product.currency}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/products/${product.id}`}
                            target="_blank"
                          >
                            <Eye className="mr-2 h-4 w-4" /> {t.view[lang]}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/products/${product.id}`}
                          >
                            <Edit className="mr-2 h-4 w-4" /> {t.edit[lang]}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setProductToDelete(product)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t.delete[lang]}
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
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in-0">
            <div className="w-full max-w-md p-6 bg-background rounded-lg shadow-xl border animate-in zoom-in-95">
                <div className="text-center sm:text-left">
                    <h3 className="text-lg font-semibold text-foreground">{t.deleteConfirmTitle[lang]}</h3>
                    <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                            {t.deleteConfirmDesc[lang].replace('{productName}', productToDelete.name)}
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <Button variant="outline" onClick={() => setProductToDelete(null)}>
                    {t.cancel[lang]}
                    </Button>
                    <Button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className={cn(buttonVariants({ variant: 'destructive' }))}
                    >
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t.delete[lang]}
                    </Button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
