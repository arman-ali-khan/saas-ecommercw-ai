
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

        await supabase.from('uncompleted_orders').upsert(uncompletedOrderData, { onConflict: 'id' });
    }, [uncompletedOrderId, siteId, form, products, quantities]);

    useEffect(() => {
        const handler = setTimeout(() => {
          saveUncompletedOrder();
        }, 2000);
        return () => clearTimeout(handler);
    }, [JSON.stringify(watchedFormValues), quantities, saveUncompletedOrder]);


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
    
    const itemsToOrder = useMemo(() => products.filter(p => quantities[p.id] > 0), [products, quantities]);
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

    if (products.length === 0) return null;

    return (
        <Card className="my-8">
            <CardHeader><CardTitle>{also_buy_title || 'Quick Order'}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {products.filter(p => p.id === main_product_id || optional_product_ids.includes(p.id)).map(p => (
                            <div key={p.id} className="flex gap-4 items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                <div className="flex gap-4 items-center flex-grow">
                                    <Image src={p.images[0].imageUrl} alt={p.name} width={64} height={64} className="rounded-md object-cover aspect-square" />
                                    <div><p className="font-medium text-sm">{p.name}</p><p className="text-xs text-primary font-bold">{p.price.toFixed(2)} BDT</p></div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(p.id, (quantities[p.id] || 0) - 1)}><Minus className="h-4 w-4" /></Button>
                                    <Input value={quantities[p.id] || 0} readOnly className="h-7 w-10 text-center text-xs p-0" />
                                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(p.id, (quantities[p.id] || 0) + 1)}><Plus className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                        <Separator />
                        <FormField control={form.control} name="shippingZoneId" render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Shipping Method</FormLabel>
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    {shippingZones.map((zone) => (
                                        <Label key={zone.id} htmlFor={`sc-ship-${zone.id}`} className={cn("flex items-center gap-4 rounded-md border-2 p-4 cursor-pointer", field.value === zone.id.toString() ? "border-primary bg-primary/10" : "border-muted")}>
                                            <RadioGroupItem value={zone.id.toString()} id={`sc-ship-${zone.id}`} className="sr-only" />
                                            <div className="text-xs font-medium">{zone.name}<br/><span className="text-muted-foreground">{zone.price.toFixed(2)} BDT</span></div>
                                        </Label>
                                    ))}
                                </RadioGroup>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <Separator />
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Name" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="Phone" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="Address" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="City" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-6">
                             <div className="w-full text-right"><p className="text-lg font-bold text-primary">Total: {total.toFixed(2)} BDT</p></div>
                            <Button type="submit" disabled={isSubmitting || total === 0} className="w-full sm:w-auto">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Place Quick Order
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
