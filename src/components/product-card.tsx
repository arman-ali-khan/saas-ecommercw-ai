

'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product, ShippingZone, FlashDeal } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ShoppingBag, Loader2, Minus, Plus, Truck } from 'lucide-react';
import { useCart } from '@/stores/cart';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import Countdown from './countdown';
import { useTranslation } from '@/hooks/use-translation';

interface ProductCardProps {
  product: Product;
  flashDeal?: FlashDeal;
}

export default function ProductCard({ product, flashDeal }: ProductCardProps) {
  const addToCart = useCart((state) => state.addToCart);
  const { toast } = useToast();
  const t = useTranslation();
  const { productCard: t_card } = t;

  const handleAddToCart = () => {
    const productWithDealPrice = flashDeal
      ? { ...product, price: flashDeal.discount_price }
      : product;
    addToCart(productWithDealPrice, 1);
    toast({
      title: 'ব্যাগে যোগ করা হয়েছে',
      description: `1 x ${product.name} আপনার ব্যাগে যোগ করা হয়েছে।`,
    });
  };

  const productUrl = `/products/${product.id}`;
  const displayPrice = flashDeal ? flashDeal.discount_price : product.price;

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <Link href={productUrl} className="block relative">
        <CardHeader className="p-0">
          <div className="relative w-full aspect-[6/5]">
            <Image
              src={product.images[0].imageUrl}
              alt={product.name}
              data-ai-hint={product.images[0].imageHint}
              fill
              className="object-cover"
            />
          </div>
          {flashDeal && <Badge className="absolute top-2 left-2" variant="destructive">Sale</Badge>}
        </CardHeader>
        <CardContent className="p-1 sm:p-4 flex-grow">
          <h3 className="text-sm sm:text-lg font-headline font-semibold">{product.name}</h3>
          <p className="text-muted-foreground mt-1 text-sm truncate">{product.description}</p>
          {flashDeal && (
            <div className="mt-2">
              <Countdown endDate={flashDeal.end_date} />
            </div> 
          )}
        </CardContent>
      </Link>
      <CardFooter className="p-1 block sm:p-4 !pt-1 sm:mt-auto items-center">
        <div className="flex flex-col w-full justify-start sm:justify-center">
            {flashDeal && (
                <p className="text-sm font-bold text-muted-foreground line-through">
                    {product.price.toFixed(2)} {product.currency}
                </p>
            )}
            <p className="text-sm sm:text-lg font-bold text-primary">
                {displayPrice.toFixed(2)} {product.currency}
            </p>
        </div>
        <Button onClick={handleAddToCart}>
          <ShoppingBag className="w-4 h-4 mr-2" />
          {t_card.addToBag}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ProductShowcaseBlock({ product_ids, title, username }: { product_ids: string[], title?: string, username: string }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const addToCart = useCart((state) => state.addToCart);

    useEffect(() => {
        const fetchSiteAndProducts = async () => {
            setIsLoading(true);

            const { data: profileData } = await supabase.from('profiles').select('id').eq('domain', username).single();
            if (!profileData) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not find site.' });
                setIsLoading(false);
                return;
            }
            const siteId = profileData.id;

            if (product_ids && product_ids.length > 0) {
                const { data: productsData, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('site_id', siteId)
                    .in('id', product_ids);

                if (error) {
                    toast({ variant: 'destructive', title: 'Error fetching products' });
                } else {
                    const productMap = new Map(productsData.map(p => [p.id, p]));
                    const orderedProducts = product_ids.map(id => productMap.get(id)).filter(Boolean) as Product[];
                    setProducts(orderedProducts);
                    setQuantities(orderedProducts.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {}));
                }
            }
            setIsLoading(false);
        };

        if (username) {
            fetchSiteAndProducts();
        }
    }, [product_ids, username, toast]);

    const handleQuantityChange = (id: string, newQuantity: number) => {
        setQuantities(prev => ({ ...prev, [id]: Math.max(0, newQuantity) }));
    };

    const handleBulkAddToCart = () => {
        let itemsAdded = 0;
        let totalQuantity = 0;
        products.forEach(product => {
            const quantity = quantities[product.id];
            if (quantity > 0) {
                addToCart(product, quantity);
                itemsAdded++;
                totalQuantity += quantity;
            }
        });
        if (itemsAdded > 0) {
            toast({
                title: 'Items Added to Bag',
                description: `${totalQuantity} item(s) have been added to your shopping bag.`,
            });
        } else {
            toast({
                title: 'No items selected',
                description: 'Please set a quantity greater than 0 to add items to your bag.',
                variant: 'destructive',
            });
        }
    };
    
    const total = useMemo(() => {
        return products.reduce((acc, p) => acc + (p.price * (quantities[p.id] || 0)), 0);
    }, [products, quantities]);
    
    if (isLoading) return <Card className="my-8"><CardContent><Loader2 className="mx-auto my-16 h-10 w-10 animate-spin" /></CardContent></Card>;
    if (products.length === 0) return null;

    return (
        <Card className="my-8">
            <CardHeader><CardTitle>{title || 'Product Showcase'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {products.map(p => (
                    <div key={p.id} className="flex gap-4 items-center justify-between p-2 rounded-md hover:bg-muted/50">
                        <div className="flex gap-4 items-center flex-grow">
                            <Image src={p.images[0].imageUrl} alt={p.name} width={64} height={64} className="rounded-md object-cover aspect-square" />
                            <div className="flex-grow">
                                <p className="font-medium">{p.name}</p>
                                <p className="text-sm text-primary font-semibold">{p.price.toFixed(2)} {p.currency}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(p.id, (quantities[p.id] || 0) - 1)}><Minus className="h-4 w-4" /></Button>
                            <Input value={quantities[p.id] || 0} onChange={e => handleQuantityChange(p.id, parseInt(e.target.value) || 0)} className="h-7 w-12 text-center" />
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(p.id, (quantities[p.id] || 0) + 1)}><Plus className="h-4 w-4" /></Button>
                        </div>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-lg font-bold">
                    Total: <span className="text-primary">{total.toFixed(2)} BDT</span>
                </div>
                <Button onClick={handleBulkAddToCart} disabled={total === 0}>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Add Selected to Bag
                </Button>
            </CardFooter>
        </Card>
    );
}
