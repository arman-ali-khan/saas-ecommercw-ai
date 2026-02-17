
'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import { Separator } from './ui/separator';

const showcaseOrderSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'A valid phone number is required'),
  address: z.string().min(5, 'A valid address is required'),
  city: z.string().min(2, 'A valid city is required'),
});

type ShowcaseOrderFormData = z.infer<typeof showcaseOrderSchema>;

export function ShowcaseOrderBlock({ main_product_id, optional_product_ids, also_buy_title, username }: { main_product_id?: string, optional_product_ids: string[], also_buy_title?: string, username: string }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [siteId, setSiteId] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<ShowcaseOrderFormData>({
        resolver: zodResolver(showcaseOrderSchema),
        defaultValues: { name: '', phone: '', address: '', city: '' },
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

            const all_ids = [main_product_id, ...optional_product_ids].filter(Boolean) as string[];

            if (all_ids && all_ids.length > 0) {
                const { data: productsData, error } = await supabase.from('products').select('*').eq('site_id', siteId).in('id', all_ids);
                if (error) {
                    toast({ variant: 'destructive', title: 'Error fetching products' });
                } else {
                    const productMap = new Map(productsData.map(p => [p.id, p]));
                    const orderedProducts = all_ids.map(id => productMap.get(id)).filter(Boolean) as Product[];
                    setProducts(orderedProducts);
                    
                    const initialQuantities = orderedProducts.reduce((acc, p) => {
                        acc[p.id] = p.id === main_product_id ? 1 : 0;
                        return acc;
                    }, {} as { [key: string]: number });
                    setQuantities(initialQuantities);
                }
            }
            setIsLoading(false);
        };
        fetchSiteAndProducts();
    }, [main_product_id, optional_product_ids, username, toast]);

    const handleQuantityChange = (id: string, newQuantity: number) => {
        const minQuantity = id === main_product_id ? 1 : 0;
        setQuantities(prev => ({ ...prev, [id]: Math.max(minQuantity, newQuantity) }));
    };
    
    const itemsToOrder = useMemo(() => {
        return products.filter(p => quantities[p.id] > 0);
    }, [products, quantities]);

    const total = useMemo(() => {
        return itemsToOrder.reduce((acc, p) => acc + (p.price * (quantities[p.id] || 0)), 0);
    }, [itemsToOrder, quantities]);

    async function onSubmit(values: ShowcaseOrderFormData) {
        if (itemsToOrder.length === 0) {
            toast({ variant: 'destructive', title: 'No items selected', description: 'Please add at least one item to your order.' });
            return;
        }
        if (!siteId) return;

        setIsSubmitting(true);

        const orderNumber = `BN-${Date.now().toString().slice(-6)}`;
        const orderData = {
            order_number: orderNumber,
            site_id: siteId,
            customer_email: 'guest@example.com', // Guest checkout
            shipping_info: {
                name: values.name,
                address: values.address,
                city: values.city,
                phone: values.phone,
                shipping_cost: 0, // No shipping calculation in this block
                shipping_method_name: 'Standard'
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
            router.push(`/checkout/success?order_id=${newOrder.id}`);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Order Failed', description: error.message });
            setIsSubmitting(false);
        }
    }

    const mainProduct = useMemo(() => products.find(p => p.id === main_product_id), [products, main_product_id]);
    const optionalProducts = useMemo(() => products.filter(p => optional_product_ids.includes(p.id)), [products, optional_product_ids]);


    if (isLoading) return <Card className="my-8"><CardContent><Loader2 className="mx-auto my-16 h-10 w-10 animate-spin" /></CardContent></Card>;
    if (products.length === 0) return null;

    return (
        <Card className="my-8">
            <CardHeader><CardTitle>{also_buy_title || 'Quick Order'}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
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
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(mainProduct.id, (quantities[mainProduct.id] || 0) - 1)}><Minus className="h-4 w-4" /></Button>
                            <Input value={quantities[mainProduct.id] || 0} onChange={e => handleQuantityChange(mainProduct.id, parseInt(e.target.value) || 0)} className="h-7 w-12 text-center" />
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(mainProduct.id, (quantities[mainProduct.id] || 0) + 1)}><Plus className="h-4 w-4" /></Button>
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
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(p.id, (quantities[p.id] || 0) - 1)}><Minus className="h-4 w-4" /></Button>
                                    <Input value={quantities[p.id] || 0} onChange={e => handleQuantityChange(p.id, parseInt(e.target.value) || 0)} className="h-7 w-12 text-center" />
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleQuantityChange(p.id, (quantities[p.id] || 0) + 1)}><Plus className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                )}

                <Separator />
                
                <div>
                    <h3 className="font-semibold mb-4">Shipping Information</h3>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your Full Name" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="Your Phone Number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </div>
                             <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="House Address" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Your City" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            
                            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 p-0 pt-6">
                                <div className="text-lg font-bold">
                                    Total: <span className="text-primary">{total.toFixed(2)} BDT</span>
                                </div>
                                <Button type="submit" disabled={isSubmitting || total === 0}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Place Order
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </div>
            </CardContent>
        </Card>
    );
}
