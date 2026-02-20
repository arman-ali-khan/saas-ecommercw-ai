
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Product, ShippingZone } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Minus, Plus, Truck, ShoppingBasket } from 'lucide-react';
import Image from 'next/image';
import { Separator } from './ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';


const showcaseOrderSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'A valid phone number is required'),
  address: z.string().min(5, 'A valid address is required'),
  city: z.string().min(2, 'A valid city is required'),
  shippingZoneId: z.string({ required_error: 'Please select a shipping method.' }),
});

type ShowcaseOrderFormData = z.infer<typeof showcaseOrderSchema>;

export function ShowcaseOrderBlock({ 
    main_product_id, 
    optional_product_ids, 
    also_buy_title, 
    username, 
    siteId,
    initialProducts
}: { 
    main_product_id?: string, 
    optional_product_ids: string[], 
    also_buy_title?: string, 
    username: string, 
    siteId: string,
    initialProducts: Product[]
}) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
    const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
    const [isLoadingShipping, setIsLoadingShipping] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const [uncompletedOrderId, setUncompletedOrderId] = useState<string | null>(null);

    const form = useForm<ShowcaseOrderFormData>({
        resolver: zodResolver(showcaseOrderSchema),
        defaultValues: { name: '', phone: '', address: '', city: '' },
    });
    
    const watchedFormValues = form.watch();

    useEffect(() => {
        let cartSessionId = localStorage.getItem(`cart_session_id_${username}`);
        if (!cartSessionId) {
            cartSessionId = uuidv4();
            localStorage.setItem(`cart_session_id_${username}`, cartSessionId);
        }
        setUncompletedOrderId(cartSessionId);
    }, [username]);

    const saveUncompletedOrder = useCallback(async () => {
        const currentFormValues = form.getValues();
        const itemsToOrder = products.filter(p => (quantities[p.id] || 0) > 0);
        const subtotal = itemsToOrder.reduce((acc, p) => acc + (p.price * (quantities[p.id] || 0)), 0);

        if (!uncompletedOrderId || !siteId || itemsToOrder.length === 0) return;
        
        const hasPhone = !!currentFormValues.phone && currentFormValues.phone.length >= 10;
        if (!hasPhone) return;

        const uncompletedOrderData = {
          id: uncompletedOrderId,
          site_id: siteId,
          customer_info: {
            name: currentFormValues.name,
            phone: currentFormValues.phone,
            address: currentFormValues.address,
            city: currentFormValues.city,
          },
          cart_items: itemsToOrder.map(product => ({
            id: product.id,
            name: product.name,
            quantity: quantities[product.id],
            price: product.price,
            imageUrl: product.images[0]?.imageUrl,
          })),
          cart_total: subtotal,
          status: 'shipping-info-entered'
        };

        try {
            await fetch('/api/uncompleted-orders/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(uncompletedOrderData),
            });
        } catch (err) {
            console.error('Failed to auto-save uncompleted order in showcase:', err);
        }
    }, [uncompletedOrderId, siteId, form, products, quantities]);

    useEffect(() => {
        const handler = setTimeout(() => {
          saveUncompletedOrder();
        }, 2000);
        return () => clearTimeout(handler);
    }, [watchedFormValues.name, watchedFormValues.phone, watchedFormValues.address, watchedFormValues.city, quantities, saveUncompletedOrder]);


    useEffect(() => {
        const fetchShipping = async () => {
            setIsLoadingShipping(true);
            const response = await fetch('/api/get-shipping-zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId }),
            });
            const shippingResult = await response.json();
            if (shippingResult.zones) {
                setShippingZones(shippingResult.zones);
                if (shippingResult.zones.length > 0) form.setValue('shippingZoneId', shippingResult.zones[0].id.toString());
            }
            setIsLoadingShipping(false);
        };
        fetchShipping();
    }, [siteId, form]);

    useEffect(() => {
        const initialQuantities = initialProducts.reduce((acc, p) => {
            acc[p.id] = p.id === main_product_id ? 1 : 0;
            return acc;
        }, {} as { [key: string]: number });
        setQuantities(initialQuantities);
    }, [initialProducts, main_product_id]);


    const handleQuantityChange = (id: string, newQuantity: number) => {
        const minQuantity = id === main_product_id ? 1 : 0;
        setQuantities(prev => ({ ...prev, [id]: Math.max(minQuantity, newQuantity) }));
    };
    
    const itemsToOrder = useMemo(() => products.filter(p => (quantities[p.id] || 0) > 0), [products, quantities]);
    const subtotal = useMemo(() => itemsToOrder.reduce((acc, p) => acc + (p.price * (quantities[p.id] || 0)), 0), [itemsToOrder, quantities]);
    const selectedShippingZoneId = form.watch('shippingZoneId');
    const shippingCost = useMemo(() => shippingZones.find(z => z.id.toString() === selectedShippingZoneId)?.price || 0, [selectedShippingZoneId, shippingZones]);
    const total = useMemo(() => subtotal + shippingCost, [subtotal, shippingCost]);

    async function onSubmit(values: ShowcaseOrderFormData) {
        if (!siteId || itemsToOrder.length === 0) return;
        setIsSubmitting(true);

        const orderData = {
            order_number: `BN-${Date.now().toString().slice(-6)}`,
            site_id: siteId,
            customer_email: 'guest@example.com',
            shipping_info: {
                name: values.name,
                address: values.address,
                city: values.city,
                phone: values.phone,
                shipping_cost: shippingCost,
                shipping_method_name: shippingZones.find(z => z.id.toString() === values.shippingZoneId)?.name || 'N/A'
            },
            cart_items: itemsToOrder.map((product) => ({
                id: product.id,
                name: product.name,
                quantity: quantities[product.id],
                price: product.price,
                imageUrl: product.images[0]?.imageUrl,
            })),
            total: total,
            payment_method: 'cod',
            uncompletedOrderId: uncompletedOrderId,
            domain: username,
        };

        try {
            const response = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            localStorage.removeItem(`cart_session_id_${username}`);
            router.push(`/checkout/success?order_id=${result.order.id}`);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Order Failed', description: error.message });
            setIsSubmitting(false);
        }
    }

    const mainProduct = products.find(p => p.id === main_product_id);
    const optionalProducts = products.filter(p => optional_product_ids.includes(p.id));

    if (products.length === 0) return null;

    return (
        <Card className="my-8 overflow-hidden border-2 shadow-xl rounded-[2rem]">
            <CardHeader className="bg-muted/30 border-b p-6">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                    <ShoppingBasket className="h-6 w-6 text-primary" />
                    {also_buy_title || 'Quick Order'}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="space-y-6">
                            {/* Main Product Section */}
                            {mainProduct && (
                                <div className="p-4 rounded-2xl bg-primary/5 border-2 border-primary/10 shadow-sm transition-all hover:bg-primary/[0.08]">
                                    <div className="flex gap-4 items-center justify-between">
                                        <div className="flex gap-4 items-center flex-grow min-w-0">
                                            <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0">
                                                <Image src={mainProduct.images[0].imageUrl} alt={mainProduct.name} fill className="rounded-xl object-cover aspect-square border shadow-sm" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-base sm:text-lg leading-tight truncate">{mainProduct.name}</p>
                                                <p className="text-sm sm:text-base text-primary font-black mt-1">{mainProduct.price.toFixed(2)} BDT</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-background rounded-xl border p-1 shadow-sm shrink-0">
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" onClick={() => handleQuantityChange(mainProduct.id, (quantities[mainProduct.id] || 0) - 1)}><Minus className="h-4 w-4" /></Button>
                                            <span className="w-8 sm:w-10 text-center font-black text-sm sm:text-base">{quantities[mainProduct.id] || 0}</span>
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" onClick={() => handleQuantityChange(mainProduct.id, (quantities[mainProduct.id] || 0) + 1)}><Plus className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Optional Products Section */}
                            {optionalProducts.length > 0 && (
                                <div className="space-y-4 animate-in fade-in duration-500">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="h-px flex-grow bg-border" />
                                        <h4 className="font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap bg-background px-2">
                                            {also_buy_title || 'আরও যোগ করুন (Also Buy)'}
                                        </h4>
                                        <div className="h-px flex-grow bg-border" />
                                    </div>
                                    
                                    <div className="grid gap-3">
                                        {optionalProducts.map(p => (
                                            <div key={p.id} className="flex gap-4 items-center justify-between p-3 rounded-xl border bg-card/50 hover:bg-card hover:border-primary/30 transition-all group shadow-sm">
                                                <div className="flex gap-4 items-center flex-grow min-w-0">
                                                    <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0">
                                                        <Image src={p.images[0].imageUrl} alt={p.name} fill className="rounded-lg object-cover aspect-square border" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-sm leading-tight truncate group-hover:text-primary transition-colors">{p.name}</p>
                                                        <p className="text-xs text-muted-foreground font-bold mt-0.5">{p.price.toFixed(2)} BDT</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg p-1 shrink-0">
                                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-md" onClick={() => handleQuantityChange(p.id, (quantities[p.id] || 0) - 1)}><Minus className="h-3.5 w-3.5" /></Button>
                                                    <span className="w-6 sm:w-8 text-center text-xs sm:text-sm font-bold">{quantities[p.id] || 0}</span>
                                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-md" onClick={() => handleQuantityChange(p.id, (quantities[p.id] || 0) + 1)}><Plus className="h-3.5 w-3.5" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center px-6 py-4 bg-primary/10 rounded-2xl border-2 border-primary/20 shadow-inner">
                            <span className="font-bold text-sm sm:text-base text-foreground/80">পণ্যের মোট মূল্য (Subtotal):</span>
                            <span className="text-xl sm:text-2xl font-black text-primary">{subtotal.toFixed(2)} BDT</span>
                        </div>

                        <Separator className="opacity-50" />
                        
                        <FormField control={form.control} name="shippingZoneId" render={({ field }) => (
                            <FormItem className="space-y-4">
                                <FormLabel className="text-lg font-bold flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-primary" />
                                    শিপিং পদ্ধতি নির্বাচন করুন
                                </FormLabel>
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {shippingZones.map((zone) => (
                                        <Label key={zone.id} htmlFor={`sc-ship-${zone.id}`} className={cn("flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all duration-200", field.value === zone.id.toString() ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20" : "border-muted hover:border-muted-foreground/30 hover:bg-muted/20")}>
                                            <RadioGroupItem value={zone.id.toString()} id={`sc-ship-${zone.id}`} className="sr-only" />
                                            <div className="flex-grow">
                                                <p className="text-sm font-bold leading-none">{zone.name}</p>
                                                <p className="text-primary font-black mt-1.5">{zone.price.toFixed(2)} BDT</p>
                                            </div>
                                            {field.value === zone.id.toString() && <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-background" /></div>}
                                        </Label>
                                    ))}
                                </RadioGroup>
                                <FormMessage />
                            </FormItem>
                        )} />
                        
                        <Separator className="opacity-50" />
                        
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold border-l-4 border-primary pl-3">শিপিং তথ্য প্রদান করুন</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>আপনার নাম</FormLabel><FormControl><Input placeholder="সম্পূর্ণ নাম লিখুন" {...field} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>ফোন নম্বর</FormLabel><FormControl><Input placeholder="সক্রিয় ফোন নম্বর দিন" {...field} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem> )} />
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>বিস্তারিত ঠিকানা</FormLabel><FormControl><Input placeholder="বাসা নং, রাস্তা নং, এলাকা" {...field} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>শহর</FormLabel><FormControl><Input placeholder="আপনার শহরের নাম" {...field} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem> )} />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t pt-8">
                             <div className="w-full text-center sm:text-left">
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">সর্বমোট মূল্য (Total):</p>
                                <p className="text-3xl sm:text-4xl font-black text-primary drop-shadow-sm">{total.toFixed(2)} BDT</p>
                             </div>
                            <Button type="submit" disabled={isSubmitting || total === 0} className="w-full sm:w-auto h-16 px-10 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group">
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> প্রসেসিং হচ্ছে...</>
                                ) : (
                                    <>অর্ডার কনফার্ম করুন <Plus className="ml-2 h-5 w-5 group-hover:rotate-90 transition-transform" /></>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
