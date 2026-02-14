
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
import { z } from 'zod';
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

interface ProductCardProps {
  product: Product;
  flashDeal?: FlashDeal;
}

export default function ProductCard({ product, flashDeal }: ProductCardProps) {
  const addToCart = useCart((state) => state.addToCart);
  const { toast } = useToast();

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
          <div className="relative w-full h-28 sm:h-[200px]">
            <Image
              src={product.images[0].imageUrl}
              alt={product.name}
              data-ai-hint={product.images[0].imageHint}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
      <CardFooter className="p-1 sm:p-4 pt-1 sm:mt-auto justify-between items-center">
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
          ব্যাগে যোগ করুন
        </Button>
      </CardFooter>
    </Card>
  );
}


const shippingFormSchema = z.object({
  name: z.string().min(2, 'নাম প্রয়োজন'),
  phone: z.string().min(11, '১১ সংখ্যার ফোন নম্বর প্রয়োজন'),
  address: z.string().min(5, 'ঠিকানা প্রয়োজন'),
  city: z.string().min(1, 'শহর প্রয়োজন'),
  shippingZoneId: z.string({ required_error: 'শিপিং পদ্ধতি নির্বাচন করুন' }),
  notes: z.string().optional(),
});

export function ProductShowcaseBlock({ product_ids, title, username }: { product_ids: string[], title?: string, username: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<{[key: string]: number}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [siteId, setSiteId] = useState<string | null>(null);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [shippingData, setShippingData] = useState<z.infer<typeof shippingFormSchema> | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [transactionId, setTransactionId] = useState('');
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);

  const form = useForm<z.infer<typeof shippingFormSchema>>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: { name: '', phone: '', address: '', city: '', notes: '' },
  });

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
      setSiteId(siteId);

      if (product_ids && product_ids.length > 0) {
        const { data: productsData, error } = await supabase
            .from('products')
            .select('*')
            .eq('site_id', siteId)
            .in('id', product_ids);
            
        if (error) { 
            toast({ variant: 'destructive', title: 'Error fetching products for showcase' });
        } else {
          const productMap = new Map(productsData.map(p => [p.id, p]));
          const orderedProducts = product_ids.map(id => productMap.get(id)).filter(Boolean) as Product[];
          setProducts(orderedProducts);
          setQuantities(orderedProducts.reduce((acc, p) => ({ ...acc, [p.id]: 1 }), {}));
        }
      }
      
      const { data: zonesData } = await supabase.from('shipping_zones').select('*').eq('site_id', siteId).eq('is_enabled', true).order('price');
      if (zonesData) {
        setShippingZones(zonesData);
        if (zonesData.length > 0) {
          form.setValue('shippingZoneId', zonesData[0].id.toString());
        }
      }

      setIsLoading(false);
    };

    if (username) {
        fetchSiteAndProducts();
    }
  }, [product_ids, username, toast, form]);

  const selectedShippingZoneId = form.watch('shippingZoneId');
  
  const shippingCost = useMemo(() => {
    const selectedZone = shippingZones.find(zone => zone.id.toString() === selectedShippingZoneId);
    return selectedZone ? selectedZone.price : 0;
  }, [selectedShippingZoneId, shippingZones]);
  
  const subtotal = useMemo(() => products.reduce((acc, p) => acc + (p.price * (quantities[p.id] || 0)), 0), [products, quantities]);
  const total = useMemo(() => subtotal + shippingCost, [subtotal, shippingCost]);
  
  const handleQuantityChange = (id: string, newQuantity: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, newQuantity) }));
  }
  
  const onShippingSubmit = (values: z.infer<typeof shippingFormSchema>) => {
    setShippingData(values);
    setIsPaymentDialogOpen(true);
  };
  
  const handleConfirmOrder = async () => {
    if (!shippingData || !siteId) {
        toast({ variant: 'destructive', title: 'An error occurred', description: 'Shipping data is missing.'});
        return;
    }
    if (paymentMethod === 'mobile_banking' && !transactionId.trim()) {
        toast({ variant: 'destructive', title: 'Validation Error', description: 'Transaction ID is required for mobile banking.' });
        return;
    }
    setIsSubmitting(true);
    
    const selectedZone = shippingZones.find(z => z.id.toString() === shippingData.shippingZoneId);

    const orderData = {
      order_number: `BN-${Date.now().toString().slice(-6)}`,
      site_id: siteId,
      customer_email: 'quickorder@example.com',
      shipping_info: {
        name: shippingData.name, address: shippingData.address, city: shippingData.city, phone: shippingData.phone, notes: shippingData.notes,
        shipping_cost: selectedZone?.price || 0,
        shipping_method_name: selectedZone?.name || 'N/A'
      },
      cart_items: products.map(p => ({ id: p.id, name: p.name, quantity: quantities[p.id] || 1, price: p.price, imageUrl: p.images[0]?.imageUrl })),
      total: total,
      payment_method: paymentMethod,
      transaction_id: paymentMethod === 'mobile_banking' ? transactionId : null,
      domain: username,
    };

    try {
      const response = await fetch('/api/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
      const newOrder = await response.json();
      if (!response.ok) throw new Error(newOrder.error || 'Failed to create order');
      router.push(`/${username}/checkout/success?order_id=${newOrder.id}`);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Order failed', description: error.message });
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Card className="my-8"><CardContent><Loader2 className="mx-auto my-16 h-10 w-10 animate-spin" /></CardContent></Card>;
  if (products.length === 0) return null;
  
  return (
    <>
    <Card className="my-8">
      <CardHeader>{title && <CardTitle>{title}</CardTitle>}</CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
             <h3 className="font-semibold text-sm sm:text-lg">আপনার নির্বাচিত পণ্য</h3>
             {products.map(p => (
              <div key={p.id} className="flex gap-4 items-center">
                <Image src={p.images[0].imageUrl} alt={p.name} width={64} height={64} className="rounded-md object-cover aspect-square" />
                <div className="flex-grow">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.price.toFixed(2)} {p.currency}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(p.id, (quantities[p.id] || 1) - 1)}><Minus className="h-4 w-4" /></Button>
                  <Input value={quantities[p.id] || 1} onChange={e => handleQuantityChange(p.id, parseInt(e.target.value) || 1)} className="h-7 w-12 text-center" />
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(p.id, (quantities[p.id] || 1) + 1)}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
             ))}
             <Separator className="my-4" />
             <div className="space-y-1 text-sm pt-4">
                <div className="flex justify-between"><span>উপমোট</span><span>{subtotal.toFixed(2)} BDT</span></div>
                <div className="flex justify-between"><span>শিপিং</span><span>{shippingCost.toFixed(2)} BDT</span></div>
                <div className="flex justify-between font-bold text-base mt-2"><span>মোট</span><span>{total.toFixed(2)} BDT</span></div>
             </div>
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-lg mb-4">শিপিং তথ্য</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onShippingSubmit)} className="space-y-4">
                 <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>পুরো নাম</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>ফোন নম্বর</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>ঠিকানা</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>শহর</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="shippingZoneId" render={({ field }) => ( <FormItem> <FormLabel>শিপিং এলাকা</FormLabel> <FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 gap-2 pt-2">{shippingZones.map(zone => (<Label key={zone.id} htmlFor={`showcase_shipping-${zone.id}`} className="flex items-center gap-4 rounded-md border-2 border-muted bg-popover p-3 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value={zone.id.toString()} id={`showcase_shipping-${zone.id}`} /><div className="flex-grow"><p className="font-medium">{zone.name}</p></div><p className="text-sm text-muted-foreground">{zone.price.toFixed(2)} BDT</p></Label>))}</RadioGroup></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>অর্ডার নোট (ঐচ্ছিক)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <Button type="submit" className="w-full" size="lg">পেমেন্টে এগিয়ে যান</Button>
              </form>
            </Form>
          </div>
        </div>
      </CardContent>
    </Card>

    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>পেমেন্ট পদ্ধতি</DialogTitle>
            <DialogDescription>আপনার অর্ডার চূড়ান্ত করতে একটি পেমেন্ট পদ্ধতি নির্বাচন করুন। মোট: {total.toFixed(2)} BDT</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-4">
                <div>
                    <RadioGroupItem value="cod" id="d-cod" className="sr-only peer" />
                    <Label htmlFor="d-cod" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">ক্যাশ অন ডেলিভারি</Label>
                </div>
                 <div>
                    <RadioGroupItem value="mobile_banking" id="d-mb" className="sr-only peer" />
                    <Label htmlFor="d-mb" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">মোবাইল ব্যাংকিং</Label>
                </div>
             </RadioGroup>
             {paymentMethod === 'mobile_banking' && (
                <div className='space-y-2 pt-4 border-t'>
                    <p className='text-sm text-muted-foreground'>অনুগ্রহ করে পেমেন্ট করার পর নিচের বক্সে ট্রানজেকশন আইডি প্রদান করুন।</p>
                    <Label htmlFor="transactionId">ট্রানজেকশন আইডি</Label>
                    <Input id="transactionId" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="e.g., 8N7F6G5H4J" />
                </div>
             )}
          </div>
          <DialogFooter>
            <Button onClick={handleConfirmOrder} disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              অর্ডার নিশ্চিত করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
