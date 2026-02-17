
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
import { Loader2, Minus, Plus, Truck } from 'lucide-react';
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
        const itemsToOrder = products.filter(p => quantities[p.id] > 0);
        const subtotal = itemsToOrder.reduce((acc, p) => acc + (p.price * (quantities[p.id] || 0)), 0);

        if (!uncompletedOrderId || !siteId || itemsToOrder.length === 0) {
          return;
        }
        
        const hasShippingInfo = currentFormValues.name || currentFormValues.phone || currentFormValues.address || currentFormValues.city;
        if (!hasShippingInfo) return;

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

        const { error } = await supabase
          .from('uncompleted_orders')
          .upsert(uncompletedOrderData, { onConflict: 'id' });
        
        if (error) {
          console.error("Failed to save uncompleted order from showcase:", error);
        }
    }, [uncompletedOrderId, siteId, form, products, quantities]);

    useEffect(() => {
        const handler = setTimeout(() => {
          saveUncompletedOrder();
        }, 2000);

        return () => {
          clearTimeout(handler);
        };
    }, [JSON.stringify(watchedFormValues), quantities, saveUncompletedOrder]);


    useEffect(() => {
        const fetchShipping = async () => {
            setIsLoadingShipping(true);
            if (!siteId) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not identify the site.' });
                setIsLoadingShipping(false);
                return;
            }

            const response = await fetch('/api/get-shipping-zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId }),
            });
            const shippingResult = await response.json();
            
            if (shippingResult.error) {
                 toast({ variant: 'destructive', title: 'Error fetching shipping zones', description: shippingResult.error });
            } else if (shippingResult.zones) {
                setShippingZones(shippingResult.zones);
                if (shippingResult.zones.length > 0) {
                    form.setValue('shippingZoneId', shippingResult.zones[0].id.toString());
                }
            }
            setIsLoadingShipping(false);
        };
        fetchShipping();
    }, [siteId, toast, form]);

    useEffect(() => {
        // Set initial quantities when products are loaded
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
    
    const itemsToOrder = useMemo(() => {
        return products.filter(p => quantities[p.id] > 0);
    }, [products, quantities]);

    const subtotal = useMemo(() => {
        return itemsToOrder.reduce((acc, p) => acc + (p.price * (quantities[p.id] || 0)), 0);
    }, [itemsToOrder, quantities]);

    const selectedShippingZoneId = form.watch('shippingZoneId');
    const shippingCost = useMemo(() => {
        const selectedZone = shippingZones.find(zone => zone.id.toString() === selectedShippingZoneId);
        return selectedZone ? selectedZone.price : 0;
    }, [selectedShippingZoneId, shippingZones]);
    
    const total = useMemo(() => subtotal + shippingCost, [subtotal, shippingCost]);

    async function onSubmit(values: ShowcaseOrderFormData) {
        if (itemsToOrder.length === 0) {
            toast({ variant: 'destructive', title: 'No items selected', description: 'Please add at least one item to your order.' });
            return;
        }
        if (!siteId) return;

        setIsSubmitting(true);

        const orderNumber = `BN-${Date.now().toString().slice(-6)}`;
        const selectedZone = shippingZones.find(z => z.id.toString() === values.shippingZoneId);

        const orderData = {
            order_number: orderNumber,
            site_id: siteId,
            customer_email: 'guest@example.com', // Guest checkout
            shipping_info: {
                name: values.name,
                address: values.address,
                city: values.city,
                phone: values.phone,
                shipping_cost: selectedZone?.price || 0,
                shipping_method_name: selectedZone?.name || 'Standard'
            },
            cart_items: itemsToOrder.map((product) => ({
                id: product.id,
                name: product.name,
                quantity: quantities[product.id],
                price: product.price,
                imageUrl: product.images[0]?.imageUrl,
            })),
            total: total,
            payment_method: 'cod', // Default to COD for this simple form
            uncompletedOrderId: uncompletedOrderId,
            domain: username,
        };

        try {
            const response = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });
            const newOrder = await response.json();
            if (!response.ok) throw new Error(newOrder.error || 'Failed to create order');
            if (uncompletedOrderId) {
                localStorage.removeItem(`cart_session_id_${username}`);
            }
            router.push(`/checkout/success?order_id=${newOrder.id}`);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Order Failed', description: error.message });
            setIsSubmitting(false);
        }
    }

    const mainProduct = useMemo(() => products.find(p => p.id === main_product_id), [products, main_product_id]);
    const optionalProducts = useMemo(() => products.filter(p => optional_product_ids.includes(p.id)), [products, optional_product_ids]);


    if (products.length === 0) return null;

    return (
        <Card className="my-8">
            <CardHeader><CardTitle>{also_buy_title || 'Quick Order'}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {mainProduct && (
                            <div className="flex gap-4 items-center justify-between p-2 rounded-md">
                                <div className="flex gap-4 items-center flex-grow">
                                    <Image src={mainProduct.images[0].imageUrl} alt={mainProduct.name} width={64} height={64} className="rounded-md object-cover aspect-square" />
                                    <div>
                                        <p className="font-medium">{mainProduct.name}</p>
                                        <p className="text-sm text-primary font-semibold">{mainProduct.price.toFixed(2)} {mainProduct.currency}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(mainProduct.id, (quantities[mainProduct.id] || 0) - 1)}><Minus className="h-4 w-4" /></Button>
                                    <Input value={quantities[mainProduct.id] || 0} onChange={e => handleQuantityChange(mainProduct.id, parseInt(e.target.value) || 0)} className="h-7 w-12 text-center" />
                                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(mainProduct.id, (quantities[mainProduct.id] || 0) + 1)}><Plus className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        )}
                        
                        {optionalProducts.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-2">{also_buy_title || 'Also Buy'}</h3>
                                <div className="space-y-4">
                                {optionalProducts.map(p => (
                                    <div key={p.id} className="flex gap-4 items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                        <div className="flex gap-4 items-center flex-grow">
                                            <Image src={p.images[0].imageUrl} alt={p.name} width={64} height={64} className="rounded-md object-cover aspect-square" />
                                            <div>
                                                <p className="font-medium">{p.name}</p>
                                                <p className="text-sm text-primary font-semibold">{p.price.toFixed(2)} {p.currency}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(p.id, (quantities[p.id] || 0) - 1)}><Minus className="h-4 w-4" /></Button>
                                            <Input value={quantities[p.id] || 0} onChange={e => handleQuantityChange(p.id, parseInt(e.target.value) || 0)} className="h-7 w-12 text-center" />
                                            <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(p.id, (quantities[p.id] || 0) + 1)}><Plus className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}

                        <Separator />

                        <FormField
                            control={form.control}
                            name="shippingZoneId"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Shipping Method</FormLabel>
                                {isLoadingShipping ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                                    </div>
                                    ) : (
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2"
                                    >
                                        {shippingZones.map((zone) => (
                                        <Label
                                            key={zone.id}
                                            htmlFor={`showcase-shipping-${zone.id}`}
                                            className={cn("flex items-center gap-4 rounded-md border-2 p-4 cursor-pointer transition-colors", 
                                                field.value === zone.id.toString() ? "border-primary bg-primary/10" : "border-muted bg-popover"
                                            )}
                                            >
                                            <RadioGroupItem value={zone.id.toString()} id={`showcase-shipping-${zone.id}`} className="sr-only" />
                                            <Truck className="h-6 w-6 text-muted-foreground" />
                                            <div className="flex-grow">
                                                <p className="font-medium">{zone.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                {zone.price.toFixed(2)} BDT
                                                </p>
                                            </div>
                                            </Label>
                                        ))}
                                    </RadioGroup>
                                    )}
                                <FormMessage />
                                </FormItem>
                            )}
                            />

                        <Separator />
                        
                        <div>
                            <h3 className="font-semibold mb-4">Shipping Information</h3>
                            <div className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your Full Name" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="Your Phone Number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                </div>
                                <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="House Address" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Your City" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </div>
                        </div>

                        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 p-0 pt-6">
                             <div className="w-full text-right space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{subtotal.toFixed(2)} BDT</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span>{shippingCost.toFixed(2)} BDT</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span className="text-primary">{total.toFixed(2)} BDT</span>
                                </div>
                            </div>
                            <Button type="submit" disabled={isSubmitting || total === 0 || !form.formState.isValid} className="w-full sm:w-auto">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Place Order
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
