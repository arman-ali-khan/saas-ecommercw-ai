
'use client';

import { useCart } from '@/stores/cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { Loader2, Truck, Home, Briefcase, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ShippingZone, Address } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

const checkoutSchema = z
  .object({
    name: z.string().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে'),
    email: z.string().email('অনুগ্রহ করে একটি বৈধ ইমেল ঠিকানা লিখুন'),
    address: z.string().min(5, 'অনুগ্রহ করে একটি বৈধ ঠিকানা লিখুন'),
    city: z.string().min(2, 'অনুগ্রহ করে একটি বৈধ শহর লিখুন'),
    phone: z.string().min(10, 'অনুগ্রহ করে একটি বৈধ ফোন নম্বর লিখুন'),
    shippingZoneId: z.string({ required_error: 'একটি শিপিং পদ্ধতি নির্বাচন করুন।' }),
    paymentMethod: z.enum(['cod', 'mobile_banking'], { required_error: 'একটি পেমেন্ট পদ্ধতি নির্বাচন করুন।' }),
    transactionId: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.paymentMethod === 'mobile_banking') {
        return data.transactionId && data.transactionId.trim() !== '';
      }
      return true;
    },
    {
      message: 'ট্রানজেকশন আইডি প্রয়োজন।',
      path: ['transactionId'],
    }
  );

export default function CheckoutPage() {
  const params = useParams();
  const username = params.username as string;
  const { cartItems, clearCart } = useCart();
  const cartSubtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const router = useRouter();
  const { toast } = useToast();

  const [isHydrated, setIsHydrated] = useState(false);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { customer, _hasHydrated: customerHasHydrated } = useCustomerAuth();
  const [paymentSettings, setPaymentSettings] = useState<{mobile_banking_enabled?: boolean, mobile_banking_number: string | null, accepted_banking_methods: string[] | null} | null>(null);
  const [isLoadingPaymentSettings, setIsLoadingPaymentSettings] = useState(true);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [isLoadingShipping, setIsLoadingShipping] = useState(true);
  const [uncompletedOrderId, setUncompletedOrderId] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);


  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      email: '',
      address: '',
      city: '',
      phone: '',
      paymentMethod: 'cod',
      transactionId: '',
      notes: '',
    },
  });

  const { control, register } = form;
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
    if (!uncompletedOrderId || !siteId || cartItems.length === 0) return;
    
    const hasPhone = !!currentFormValues.phone && currentFormValues.phone.length >= 10;
    if (!hasPhone) return;

    const uncompletedOrderData = {
      id: uncompletedOrderId,
      site_id: siteId,
      customer_id: customer?.id || null,
      customer_info: {
        name: currentFormValues.name,
        email: currentFormValues.email,
        address: currentFormValues.address,
        city: currentFormValues.city,
        phone: currentFormValues.phone,
        notes: currentFormValues.notes,
      },
      cart_items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        imageUrl: item.images[0]?.imageUrl
      })),
      cart_total: cartSubtotal,
      status: 'shipping-info-entered'
    };

    try {
        await fetch('/api/uncompleted-orders/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(uncompletedOrderData),
        });
    } catch (err) {
        console.error('Failed to auto-save uncompleted order:', err);
    }
  }, [uncompletedOrderId, siteId, form, customer, cartItems, cartSubtotal]);


  useEffect(() => {
    const handler = setTimeout(() => {
      saveUncompletedOrder();
    }, 2000); 
    return () => clearTimeout(handler);
  }, [watchedFormValues.name, watchedFormValues.email, watchedFormValues.address, watchedFormValues.city, watchedFormValues.phone, watchedFormValues.notes, saveUncompletedOrder]);


  const paymentMethod = form.watch('paymentMethod');
  const selectedShippingZoneId = form.watch('shippingZoneId');
  
  const shippingCost = useMemo(() => {
    const selectedZone = shippingZones.find(zone => zone.id.toString() === selectedShippingZoneId);
    return selectedZone ? selectedZone.price : 0;
  }, [selectedShippingZoneId, shippingZones]);
  
  const cartTotal = useMemo(() => cartSubtotal + shippingCost, [cartSubtotal, shippingCost]);

  useEffect(() => {
    setIsHydrated(true);
    const getSiteId = async () => {
      if (username) {
        const { data } = await supabase.from('profiles').select('id').eq('domain', username).single();
        if (data) setSiteId(data.id);
      }
    };
    getSiteId();
  }, [username]);
  
  useEffect(() => {
    const fetchSettingsAndAddresses = async () => {
      if (!siteId) {
        setIsLoadingPaymentSettings(false);
        setIsLoadingShipping(false);
        return;
      }
      
      try {
        const paymentPromise = supabase.from('store_settings').select('mobile_banking_enabled, mobile_banking_number, accepted_banking_methods').eq('site_id', siteId).maybeSingle();
        const shippingPromise = fetch('/api/get-shipping-zones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId }),
        }).then(res => res.json());

        const [paymentResult, shippingResult] = await Promise.all([paymentPromise, shippingPromise]);

        if (paymentResult.data) {
            setPaymentSettings(paymentResult.data);
        }

        if (shippingResult.zones) {
            setShippingZones(shippingResult.zones);
            if(shippingResult.zones.length > 0) {
                form.setValue('shippingZoneId', shippingResult.zones[0].id.toString());
            }
        }

        if (customer) {
            const { data: addressesData } = await supabase.from('customer_addresses').select('*').eq('customer_id', customer.id);
            if (addressesData) setSavedAddresses(addressesData);
        }

      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error loading settings', description: error.message });
      } finally {
        setIsLoadingPaymentSettings(false);
        setIsLoadingShipping(false);
      }
    };

    fetchSettingsAndAddresses();
  }, [siteId, customer, form, toast]);

  useEffect(() => {
    if (customerHasHydrated && customer) {
      form.reset({
        ...form.getValues(),
        name: customer.full_name || '',
        email: customer.email || '',
      })
    }
  }, [customer, customerHasHydrated, form]);

  useEffect(() => {
    if (isHydrated && cartCount === 0 && !isSubmitting && !window.location.search.includes('order_id')) {
      router.push(`/`);
    }
  }, [isHydrated, cartCount, router, isSubmitting]);

  const handleSelectAddress = async (address: Address) => {
    setSelectedAddressId(address.id);
    form.setValue('name', customer?.full_name || '');
    form.setValue('address', address.details);
    form.setValue('city', address.city);
    if (address.phone) form.setValue('phone', address.phone);
    toast({ title: "Address selected" });
  }

  async function onSubmit(values: z.infer<typeof checkoutSchema>) {
    if (!siteId) return;
    setIsSubmitting(true);

    const orderNumber = `BN-${Date.now().toString().slice(-6)}`;
    const selectedZone = shippingZones.find(z => z.id.toString() === values.shippingZoneId);

    const orderData = {
      order_number: orderNumber,
      site_id: siteId,
      customer_id: customer?.id || null,
      customer_email: values.email,
      shipping_info: {
        name: values.name,
        address: values.address,
        city: values.city,
        phone: values.phone,
        notes: values.notes,
        shipping_cost: selectedZone?.price || 0,
        shipping_method_name: selectedZone?.name || 'N/A'
      },
      cart_items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        imageUrl: item.images[0]?.imageUrl,
      })),
      total: cartTotal,
      payment_method: values.paymentMethod,
      transaction_id: values.transactionId || null,
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

      if (!response.ok) throw new Error(result.error || 'অর্ডার স্থাপন ব্যর্থ হয়েছে');

      clearCart();
      localStorage.removeItem(`cart_session_id_${username}`);
      router.push(`/checkout/success?order_id=${result.order.id}`);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'অর্ডার স্থাপন ব্যর্থ হয়েছে', description: error.message });
        setIsSubmitting(false);
    }
  }
  
  if (!isHydrated || (cartCount === 0 && !window.location.search.includes('order_id'))) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-12 w-12" /></div>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-12">
      <div className="md:order-2">
        <Card>
          <CardHeader><CardTitle>অর্ডার সারাংশ</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
            {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 text-sm">
                <div className="relative h-16 w-16 rounded-md overflow-hidden">
                    <Image src={item.images[0].imageUrl} alt={item.name} fill className="object-cover" />
                    <span className="absolute -top-0 -right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{item.quantity}</span>
                </div>
                <div className="flex-grow font-medium">{item.name}</div>
                <p>{(item.price * item.quantity).toFixed(2)} {item.currency}</p>
                </div>
            ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{cartSubtotal.toFixed(2)} BDT</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{shippingCost.toFixed(2)} BDT</span></div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{cartTotal.toFixed(2)} BDT</span></div>
          </CardContent>
        </Card>
      </div>

      <div className="md:order-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <h1 className="text-3xl font-headline font-bold">যোগাযোগ ও শিপিং</h1>
            
            {customer && savedAddresses.length > 0 && (
                <div className="space-y-3">
                    <Label>সংরক্ষিত ঠিকানা</Label>
                    <RadioGroup onValueChange={(id) => { const addr = savedAddresses.find(a => a.id === id); if(addr) handleSelectAddress(addr); }} value={selectedAddressId || ''} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {savedAddresses.map(address => (
                            <Label key={address.id} htmlFor={`addr-${address.id}`} className={cn("flex items-start gap-4 rounded-md border-2 p-4 cursor-pointer", selectedAddressId === address.id ? "border-primary bg-primary/10" : "border-muted")}>
                                <RadioGroupItem value={address.id} id={`addr-${address.id}`} className="mt-1" />
                                <div className="flex-grow text-xs">
                                    <p className="font-semibold mb-1">{address.name}</p>
                                    <p className="text-muted-foreground">{address.details}, {address.city}</p>
                                </div>
                            </Label>
                        ))}
                    </RadioGroup>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>পুরো নাম</FormLabel><FormControl><Input placeholder="পুরো নাম" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>ইমেল</FormLabel><FormControl><Input placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>ঠিকানা</FormLabel><FormControl><Input placeholder="ঠিকানা" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>শহর</FormLabel><FormControl><Input placeholder="শহর" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>ফোন নম্বর</FormLabel><FormControl><Input placeholder="ফোন নম্বর" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>

            <FormField control={form.control} name="shippingZoneId" render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>শিপিং পদ্ধতি</FormLabel>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {shippingZones.map((zone) => (
                        <Label key={zone.id} htmlFor={`ship-${zone.id}`} className={cn("flex items-center gap-4 rounded-md border-2 p-4 cursor-pointer", field.value === zone.id.toString() ? "border-primary bg-primary/10" : "border-muted")}>
                            <RadioGroupItem value={zone.id.toString()} id={`ship-${zone.id}`} className="sr-only" />
                            <Truck className="h-6 w-6 text-muted-foreground" />
                            <div className="flex-grow text-xs">
                                <p className="font-medium">{zone.name}</p>
                                <p className="text-muted-foreground">{zone.price.toFixed(2)} BDT</p>
                            </div>
                        </Label>
                    ))}
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>অর্ডার নোট (ঐচ্ছিক)</FormLabel><FormControl><Textarea placeholder="বিশেষ নির্দেশনা..." {...field} /></FormControl><FormMessage /></FormItem> )} />
            
            <div className="pt-4 space-y-4">
              <h2 className="text-2xl font-headline font-bold">পেমেন্ট পদ্ধতি</h2>
                <Controller name="paymentMethod" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Label htmlFor="cod" className={cn("flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer", field.value === 'cod' ? "border-primary bg-primary/10" : "border-muted")}>
                            <RadioGroupItem value="cod" id="cod" className="sr-only" />
                            <p className="font-medium">ক্যাশ অন ডেলিভারি</p>
                        </Label>
                        {paymentSettings?.mobile_banking_enabled && (
                            <Label htmlFor="mb" className={cn("flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer", field.value === 'mobile_banking' ? "border-primary bg-primary/10" : "border-muted")}>
                                <RadioGroupItem value="mobile_banking" id="mb" className="sr-only" />
                                <p className="font-medium">মোবাইল ব্যাংকিং</p>
                            </Label>
                        )}
                    </RadioGroup>
                )} />
                
              {paymentMethod === 'mobile_banking' && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm">মার্চেন্ট নম্বর: <strong>{paymentSettings?.mobile_banking_number}</strong></p>
                    <FormField control={form.control} name="transactionId" render={({ field }) => ( <FormItem><FormLabel>ট্রানজেকশন আইডি</FormLabel><FormControl><Input placeholder="যেমন: 8N7F6G..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || cartItems.length === 0}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'অর্ডার হচ্ছে...' : 'অর্ডার নিশ্চিত করুন'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
