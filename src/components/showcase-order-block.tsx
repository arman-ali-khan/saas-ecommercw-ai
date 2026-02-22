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
import { Loader2, Minus, Plus, Truck, ShoppingBasket, CreditCard, CheckCircle2, Wallet, X, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { Separator } from './ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { Checkbox } from '@/components/ui/checkbox';


const showcaseOrderSchema = z.object({
  name: z.string().min(2, 'আপনার নাম লিখুন'),
  phone: z.string().min(10, 'সঠিক ফোন নম্বর দিন'),
  address: z.string().min(5, 'বিস্তারিত ঠিকানা দিন'),
  city: z.string().min(2, 'শহরের নাম দিন'),
  shippingZoneId: z.string({ required_error: 'শিপিং পদ্ধতি বেছে নিন।' }),
  paymentMethod: z.enum(['cod', 'mobile_banking']).default('cod'),
  transactionId: z.string().optional(),
}).refine(data => {
    if (data.paymentMethod === 'mobile_banking') {
        return !!data.transactionId && data.transactionId.trim() !== '';
    }
    return true;
}, {
    message: 'ট্রানজেকশন আইডি প্রয়োজন।',
    path: ['transactionId'],
});

type ShowcaseOrderFormData = z.infer<typeof showcaseOrderSchema>;

export function ShowcaseOrderBlock({ 
    main_product_id, 
    main_product_unit,
    optional_product_ids, 
    also_buy_title, 
    username, 
    siteId,
    initialProducts
}: { 
    main_product_id?: string, 
    main_product_unit?: string,
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [paymentSettings, setPaymentSettings] = useState<any>(null);
    const { toast } = useToast();
    const router = useRouter();
    const [uncompletedOrderId, setUncompletedOrderId] = useState<string | null>(null);

    const form = useForm<ShowcaseOrderFormData>({
        resolver: zodResolver(showcaseOrderSchema),
        defaultValues: { name: '', phone: '', address: '', city: '', paymentMethod: 'cod', transactionId: '' },
    });
    
    const watchedFormValues = form.watch();
    const paymentMethod = form.watch('paymentMethod');

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
        
        const subtotalValue = itemsToOrder.reduce((acc, p) => {
            let price = p.price;
            if (p.id === main_product_id && main_product_unit && p.variants?.length) {
                const v = p.variants.find(v => v.unit === main_product_unit);
                if (v) price = v.price;
            }
            return acc + (price * (quantities[p.id] || 0));
        }, 0);

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
          cart_items: itemsToOrder.map(product => {
            let price = product.price;
            let unit = product.unit;
            if (product.id === main_product_id && main_product_unit && product.variants?.length) {
                const v = product.variants.find(v => v.unit === main_product_unit);
                if (v) {
                    price = v.price;
                    unit = v.unit;
                }
            }
            return {
                id: product.id,
                name: product.name,
                quantity: quantities[product.id],
                price: price,
                selected_unit: unit,
                imageUrl: product.images[0]?.imageUrl,
            }
          }),
          cart_total: subtotalValue,
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
    }, [uncompletedOrderId, siteId, form, products, quantities, main_product_id, main_product_unit]);

    useEffect(() => {
        const handler = setTimeout(() => {
          saveUncompletedOrder();
        }, 2000);
        return () => clearTimeout(handler);
    }, [watchedFormValues.name, watchedFormValues.phone, watchedFormValues.address, watchedFormValues.city, quantities, saveUncompletedOrder]);


    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingShipping(true);
            
            const shipRes = await fetch('/api/get-shipping-zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId }),
            });
            const shipResult = await shipRes.json();
            if (shipResult.zones) {
                setShippingZones(shipResult.zones);
                if (shipResult.zones.length > 0) form.setValue('shippingZoneId', shipResult.zones[0].id.toString());
            }

            const settingsRes = await fetch('/api/settings/get', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId }),
            });
            const settingsResult = await settingsRes.json();
            if (settingsResult.settings) {
                setPaymentSettings(settingsResult.settings);
            }

            setIsLoadingShipping(false);
        };
        fetchData();
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

    const toggleProductSelection = (id: string) => {
        if (id === main_product_id) return; // Cannot deselect main product here
        setQuantities(prev => {
            const currentQty = prev[id] || 0;
            return {
                ...prev,
                [id]: currentQty > 0 ? 0 : 1
            };
        });
    };
    
    const itemsToOrder = useMemo(() => products.filter(p => (quantities[p.id] || 0) > 0), [products, quantities]);
    
    const subtotal = useMemo(() => itemsToOrder.reduce((acc, p) => {
        let price = p.price;
        if (p.id === main_product_id && main_product_unit && p.variants?.length) {
            const v = p.variants.find(v => v.unit === main_product_unit);
            if (v) price = v.price;
        }
        return acc + (price * (quantities[p.id] || 0));
    }, 0), [itemsToOrder, quantities, main_product_id, main_product_unit]);

    const selectedShippingZoneId = form.watch('shippingZoneId');
    const shippingCost = useMemo(() => shippingZones.find(z => z.id.toString() === selectedShippingZoneId)?.price || 0, [selectedShippingZoneId, shippingZones]);
    const total = useMemo(() => subtotal + shippingCost, [subtotal, shippingCost]);

    const handlePreSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isValid = await form.trigger(['name', 'phone', 'address', 'city', 'shippingZoneId']);
        if (isValid) {
            setIsModalOpen(true);
        } else {
            toast({ variant: 'destructive', title: 'তথ্য অসম্পূর্ণ', description: 'অনুগ্রহ করে লাল চিহ্নিত ফিল্ডগুলো পূরণ করুন।' });
        }
    };

    const confirmOrder = async () => {
        const isValid = await form.trigger();
        if (!isValid) return;

        setIsSubmitting(true);
        const values = form.getValues();

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
            cart_items: itemsToOrder.map((product) => {
                let price = product.price;
                let unit = product.unit;
                if (product.id === main_product_id && main_product_unit && product.variants?.length) {
                    const v = product.variants.find(v => v.unit === main_product_unit);
                    if (v) {
                        price = v.price;
                        unit = v.unit;
                    }
                }
                return {
                    id: product.id,
                    name: product.name,
                    quantity: quantities[product.id],
                    price: price,
                    selected_unit: unit,
                    imageUrl: product.images[0]?.imageUrl,
                };
            }),
            total: total,
            payment_method: values.paymentMethod,
            transaction_id: values.transaction_id || null,
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
    };

    const mainProduct = products.find(p => p.id === main_product_id);
    const optionalProducts = products.filter(p => optional_product_ids.includes(p.id));

    const mainProductPrice = useMemo(() => {
        if (!mainProduct) return 0;
        if (main_product_unit && mainProduct.variants?.length) {
            const v = mainProduct.variants.find(v => v.unit === main_product_unit);
            if (v) return v.price;
        }
        return mainProduct.price;
    }, [mainProduct, main_product_unit]);

    if (products.length === 0) return null;

    return (
        <>
        <Card className="my-8 overflow-hidden border-2 shadow-xl rounded-[2rem]">
            <CardHeader className="bg-muted/30 border-b p-6">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                    <ShoppingBasket className="h-6 w-6 text-primary" />
                    {also_buy_title || 'Quick Order'}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 p-6">
                <Form {...form}>
                    <form onSubmit={handlePreSubmit} className="space-y-8">
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
                                                <div className="flex flex-col mt-1">
                                                    {main_product_unit && <span className="text-[10px] text-muted-foreground uppercase font-black">{main_product_unit}</span>}
                                                    <p className="text-sm sm:text-base text-primary font-black">{mainProductPrice.toFixed(2)} BDT</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center flex-col gap-2 bg-background rounded-xl border p-1 shadow-sm shrink-0">
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
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {optionalProducts.map(p => {
                                            const isSelected = (quantities[p.id] || 0) > 0;
                                            return (
                                                <div 
                                                    key={p.id} 
                                                    className={cn(
                                                        "flex gap-3 items-center justify-between p-3 rounded-xl border transition-all group shadow-sm cursor-pointer",
                                                        isSelected ? "bg-primary/5 border-primary/40 ring-1 ring-primary/10" : "bg-card/50 hover:bg-card hover:border-primary/20"
                                                    )}
                                                    onClick={() => toggleProductSelection(p.id)}
                                                >
                                                    <div className="flex gap-3 items-center flex-grow min-w-0">
                                                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                                            <Checkbox 
                                                                checked={isSelected}
                                                                onCheckedChange={() => toggleProductSelection(p.id)}
                                                                className="h-5 w-5 rounded-md"
                                                            />
                                                        </div>
                                                        <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0">
                                                            <Image src={p.images[0].imageUrl} alt={p.name} fill className="rounded-lg object-cover aspect-square border" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className={cn("font-semibold text-xs sm:text-sm leading-tight truncate transition-colors", isSelected ? "text-primary" : "group-hover:text-primary")}>{p.name}</p>
                                                            <p className="text-[10px] sm:text-xs text-muted-foreground font-bold mt-0.5">{p.price.toFixed(2)} BDT</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-background rounded-lg p-1 shrink-0 flex-col-reverse border shadow-sm" onClick={(e) => e.stopPropagation()}>
                                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 rounded-md" onClick={() => handleQuantityChange(p.id, (quantities[p.id] || 0) - 1)}><Minus className="h-3 w-3" /></Button>
                                                        <span className="w-5 sm:w-6 text-center text-xs font-black">{quantities[p.id] || 0}</span>
                                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 rounded-md" onClick={() => handleQuantityChange(p.id, (quantities[p.id] || 0) + 1)}><Plus className="h-3 w-3" /></Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center px-6 py-4 bg-primary/10 rounded-2xl border-2 border-primary/20 shadow-inner">
                            <span className="font-bold text-sm sm:text-base text-foreground/80">পণ্যের মোট মূল্য (Subtotal):</span>
                            <span className="text-sm sm:text-xl font-black text-primary">{subtotal.toFixed(2)} BDT</span>
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

                        <Separator className="opacity-50" />

                        <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                            <FormItem className="space-y-4">
                                <FormLabel className="text-lg font-bold flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-primary" />
                                    পেমেন্ট মেথড
                                </FormLabel>
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Label htmlFor="sc-pm-cod" className={cn("flex flex-col items-center justify-center rounded-xl border-2 p-4 cursor-pointer transition-all", field.value === 'cod' ? "border-primary bg-primary/10 shadow-md" : "border-muted hover:border-primary/30")}>
                                        <RadioGroupItem value="cod" id="sc-pm-cod" className="sr-only" />
                                        <Truck className="h-6 w-6 mb-2 text-primary" />
                                        <p className="font-bold text-sm">ক্যাশ অন ডেলিভারি</p>
                                    </Label>
                                    {paymentSettings?.mobile_banking_enabled && (
                                        <Label htmlFor="sc-pm-mb" className={cn("flex flex-col items-center justify-center rounded-xl border-2 p-4 cursor-pointer transition-all", field.value === 'mobile_banking' ? "border-primary bg-primary/10 shadow-md" : "border-muted hover:border-primary/30")}>
                                            <RadioGroupItem value="mobile_banking" id="sc-pm-mb" className="sr-only" />
                                            <Wallet className="h-6 w-6 mb-2 text-primary" />
                                            <p className="font-bold text-sm">মোবাইল ব্যাংকিং</p>
                                        </Label>
                                    )}
                                </RadioGroup>
                            </FormItem>
                        )} />

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t pt-8">
                             <div className="w-full text-center sm:text-left">
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">সর্বমোট মূল্য (Total):</p>
                                <p className="text-3xl sm:text-4xl font-black text-primary drop-shadow-sm">{total.toFixed(2)} BDT</p>
                             </div>
                            <Button type="submit" disabled={isSubmitting || total === 0} className="w-full sm:w-auto h-16 px-10 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group">
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> প্রসেসিং...</>
                                ) : (
                                    <>অর্ডার কনফার্ম করুন <CheckCircle2 className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" /></>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>

        {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => !isSubmitting && setIsModalOpen(false)}
                />
                <div className="relative w-full max-w-lg bg-background rounded-[2.5rem] shadow-2xl border-2 border-primary/20 overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="bg-primary p-6 text-primary-foreground text-center">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-90" />
                        <h3 className="text-2xl font-black font-headline">অর্ডার নিশ্চিত করুন</h3>
                    </div>
                    
                    <div className="p-8 space-y-6">
                        <div className="p-4 rounded-2xl bg-muted/50 border space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">পণ্যের মূল্য:</span>
                                <span className="font-bold">{subtotal.toFixed(2)} BDT</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">শিপিং খরচ:</span>
                                <span className="font-bold">{shippingCost.toFixed(2)} BDT</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-lg">
                                <span className="font-bold">সর্বমোট:</span>
                                <span className="font-black text-primary">{total.toFixed(2)} BDT</span>
                            </div>
                        </div>

                        {paymentMethod === 'cod' ? (
                            <div className="text-center py-4 space-y-3">
                                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                                    <Truck className="h-6 w-6" />
                                </div>
                                <p className="text-lg font-bold text-foreground">পণ্য হাতে পেয়ে টাকা পরিশোধ করুন</p>
                                <p className="text-sm text-muted-foreground">আমাদের ডেলিভারি ম্যান আপনার ঠিকানায় পণ্যটি পৌঁছে দিবে।</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-primary/5 border-2 border-primary/10 text-sm space-y-3">
                                    <h4 className="font-bold text-primary flex items-center gap-2">
                                        <Wallet className="h-4 w-4" /> মোবাইল ব্যাংকিং নির্দেশনা
                                    </h4>
                                    <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground leading-relaxed">
                                        <li>আপনার মোবাইল ব্যাংকিং অ্যাপটি খুলুন।</li>
                                        <li>মার্চেন্ট নম্বর হিসেবে <strong>{paymentSettings?.mobile_banking_number || '...'}</strong> দিন।</li>
                                        <li>টাকার পরিমাণ হিসেবে <strong>{total.toFixed(2)}</strong> লিখুন।</li>
                                        <li>পেমেন্ট সম্পন্ন করে নিচের বক্সে ট্রানজেকশন আইডি দিন।</li>
                                    </ol>
                                </div>
                                <Form {...form}>
                                    <FormField
                                        control={form.control}
                                        name="transactionId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">ট্রানজেকশন আইডি (Transaction ID)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="যেমন: 8N7F6G5H4J" {...field} className="h-12 rounded-xl border-2 focus:border-primary" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </Form>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 pt-4">
                            <Button 
                                onClick={confirmOrder} 
                                disabled={isSubmitting || (paymentMethod === 'mobile_banking' && !form.getValues('transactionId'))}
                                className="h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> প্রসেসিং...</>
                                ) : (
                                    'হ্যাঁ, অর্ডার কনফার্ম করুন'
                                )}
                            </Button>
                            <Button 
                                variant="ghost" 
                                onClick={() => setIsModalOpen(false)}
                                disabled={isSubmitting}
                                className="h-12 rounded-xl text-muted-foreground"
                            >
                                ফিরে যান
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}