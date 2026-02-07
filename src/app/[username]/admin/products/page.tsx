'use client';

import Image from 'next/image';
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
import { Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { getProducts } from '@/lib/products';
import { Badge } from '@/components/ui/badge';

export default function ProductsAdminPage() {
  const products = getProducts();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">পণ্য ব্যবস্থাপনা</h1>
          <p className="text-muted-foreground">
            আপনার দোকানের জন্য পণ্য যোগ, সম্পাদনা এবং পরিচালনা করুন।
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> নতুন পণ্য যোগ করুন
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
            <CardContent className="text-center py-16">
              <p className="text-muted-foreground">আপনার কোনো পণ্য নেই।</p>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> নতুন পণ্য যোগ করুন
              </Button>
            </CardContent>
          </Card>
      ) : (
        <>
            {/* Desktop View: Table */}
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
                                src={product.images[0].imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                            />
                            </div>
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
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
                                <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                সম্পাদনা
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
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
                            src={product.images[0].imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                        />
                        </div>
                        <div className="flex-grow">
                        <CardTitle>{product.name}</CardTitle>
                        <CardDescription>
                            <Badge variant="outline" className="mt-1">
                            {product.category}
                            </Badge>
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
                            <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                সম্পাদনা
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
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
    </div>
  );
}
