
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { getProductsBySiteId } from '@/lib/products';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/stores/auth';
import { useEffect, useState, useCallback } from 'react';
import type { Product } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';

export default function ProductsAdminPage() {
  const params = useParams();
  const username = params.username as string;
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    const fetchedProducts = await getProductsBySiteId(user.id);
    setProducts(fetchedProducts);
    setIsLoading(false);
  }, [user]);

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
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productToDelete.id);
    setIsDeleting(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete product',
        description: error.message,
      });
    } else {
      toast({ title: 'Product deleted' });
      await fetchProducts(); // Refetch products
    }
    setProductToDelete(null);
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
          <h1 className="text-2xl font-bold">পণ্য ব্যবস্থাপনা</h1>
          <p className="text-muted-foreground">
            আপনার দোকানের জন্য পণ্য যোগ, সম্পাদনা এবং পরিচালনা করুন।
          </p>
        </div>
        <Button asChild>
          <Link href={`/${username}/admin/products/new`}>
            <Plus className="mr-2 h-4 w-4" /> নতুন পণ্য যোগ করুন
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <p className="text-muted-foreground">আপনার কোনো পণ্য নেই।</p>
            <Button asChild className="mt-4">
              <Link href={`/${username}/admin/products/new`}>
                <Plus className="mr-2 h-4 w-4" /> নতুন পণ্য যোগ করুন
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
                    <TableHead className="w-[80px]">ছবি</TableHead>
                    <TableHead>নাম</TableHead>
                    <TableHead>বিভাগ</TableHead>
                    <TableHead>দাম</TableHead>
                    <TableHead className="text-right">কার্যকলাপ</TableHead>
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
                              <span className="sr-only">মেনু</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>কার্যকলাপ</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/${username}/products/${product.id}`}
                                target="_blank"
                              >
                                <Eye className="mr-2 h-4 w-4" /> View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/${username}/admin/products/${product.id}`}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setProductToDelete(product)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              মুছুন
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
                            href={`/${username}/products/${product.id}`}
                            target="_blank"
                          >
                            <Eye className="mr-2 h-4 w-4" /> View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/${username}/admin/products/${product.id}`}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setProductToDelete(product)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          মুছুন
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
      <AlertDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product "{productToDelete?.name}
              ". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className={cn(buttonVariants({ variant: 'destructive' }))}
            >
              {isDeleting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
