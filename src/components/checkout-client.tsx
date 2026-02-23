
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
import { Label } from '@/components/ui/label';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { Loader2, Truck, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ShippingZone, Address, SaasSettings } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '@/hooks/use-translation';

const checkoutSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    address: z.string().min(5, 'Please enter a valid address'),
    city: z.string().min(2, 'Please enter a valid city'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    shippingZoneId: z.string({ required_error: 'Please select a shipping method.' }),
    paymentMethod: z.enum(['cod', 'mobile_banking'], { required_error: 'Please select a payment method.' }),
    transactionId: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.paymentMethod === 'mobile_banking') {
        return !!data.transactionId && data.transactionId.trim() !== '';
      }
      return true;
    },
    {
      message: 'Transaction ID is required for mobile banking.',
      path: ['transactionId'],
    }
  );

interface CheckoutClientProps {
    siteId: string;
    username: string;
    shippingZones: ShippingZone[];
    paymentSettings: SaasSettings | null;
}

export default function CheckoutClient({ siteId, username, shippingZones, paymentSettings }: CheckoutClientProps) {
  const { cartItems, clearCart } = useCart();
  const cartSubtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslation();
  const { checkout: t_checkout, profile: t_profile } = t;

  const { customer, _hasHydrated: customerHasHydrated } = useCustomerAuth();
  const [uncompletedOrderId, setUncompletedOrderId] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      shippingZoneId: shippingZones.length > 0 ? shippingZones[0].id.toString() : '',
    },
  });

  const { control } = form;
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
        selected_unit: item.selected_unit || null,
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
    if (customer) {
        const fetchAddresses = async () => {
            const addrResponse = await fetch('/api/customers/addresses/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: customer.id, siteId: customer.site_id }),
            });
            const addrResult = await addrResponse.json();
            if (addrResponse.ok && addrResult.addresses) {
                setSavedAddresses(addrResult.addresses);
            }
        }
        fetchAddresses();
    }
  }, [customer]);

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
    if (cartCount === 0 && !isSubmitting && !window.location.search.includes('order_id')) {
      router.push(`/`);
    }
  }, [cartCount, router, isSubmitting]);

  const handleSelectAddress = async (address: Address) => {
    setSelectedAddressId(address.id);
    form.setValue('name', customer?.full_name || '');
    form.setValue('address', address.details);
    form.setValue('city', address.city);
    if (address.phone) form.setValue('phone', address.phone);
    toast({ title: t_checkout.addressSelected });
  }

  async function onSubmit(values: z.infer<typeof checkoutSchema>) {
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
        selected_unit: item.selected_unit || null,
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

      if (!response.ok) throw new Error(result.error || 'Order placement failed');

      clearCart();
      localStorage.removeItem(`cart_session_id_${username}`);
      router.push(`/checkout/success?order_id=${result.order.id}`);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Order Failed', description: error.message });
        setIsSubmitting(false);
    }
  }

  const getPaymentInstruction = () => {
    if (!paymentSettings) return t_checkout.mobileBanking;
    const type = paymentSettings.mobile_banking_type || 'personal';
    if (type === 'personal') return t_checkout.sendMoney;
    if (type === 'agent') return t_checkout.cashOut;
    return t_checkout.payment;
  };

  return (
    <div className="grid md:grid-cols-2 gap-12">
      <div className="md:order-2">
        <Card>
          <CardHeader><CardTitle>{t_checkout.summary}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
            {cartItems.map((item, index) => (
                <div key={`${item.id}-${item.selected_unit || index}`} className="flex items-center gap-4 text-sm">
                <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                    <Image src={item.images[0].imageUrl} alt={item.name} fill className="object-cover" />
                    <span className="absolute -top-0 -right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{item.quantity}</span>
                </div>
                <div className="flex-grow font-medium">
                    <p>{item.name}</p>
                    {item.selected_unit && <p className="text-[10px] uppercase font-black text-muted-foreground">{item.selected_unit}</p>}
                </div>
                <p>{(item.price * item.quantity).toFixed(2)} {item.currency}</p>
                </div>
            ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>{t_checkout.subtotal}</span><span>{cartSubtotal.toFixed(2)} BDT</span></div>
                <div className="flex justify-between"><span>{t_checkout.shipping}</span><span>{shippingCost.toFixed(2)} BDT</span></div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between font-bold text-lg"><span>{t_checkout.total}</span><span>{cartTotal.toFixed(2)} BDT</span></div>
          </CardContent>
        </Card>
      </div>

      <div className="md:order-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <h1 className="text-3xl font-headline font-bold">{t_checkout.title}</h1>
            
            {customer && savedAddresses.length > 0 && (
                <div className="space-y-3">
                    <Label>{t_checkout.savedAddresses}</Label>
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
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>{t_checkout.fullName}</FormLabel><FormControl><Input placeholder={t_checkout.fullName} {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>{t_checkout.email}</FormLabel><FormControl><Input placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>{t_checkout.address}</FormLabel><FormControl><Input placeholder={t_checkout.address} {...field} /></FormControl><FormMessage /></FormItem> )} />
            <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>{t_checkout.city}</FormLabel><FormControl><Input placeholder={t_checkout.city} {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>{t_checkout.phone}</FormLabel><FormControl><Input placeholder={t_checkout.phone} {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>

            <FormField control={form.control} name="shippingZoneId" render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t_checkout.shippingMethod}</FormLabel>
                  {shippingZones.length > 0 ? (
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
                  ) : (
                    <p className="text-sm text-destructive">{t_checkout.noShipping}</p>
                  )}
                  <FormMessage />
                </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>{t_checkout.orderNote}</FormLabel><FormControl><Textarea placeholder="..." {...field} /></FormControl><FormMessage /></FormItem> )} />
            
            <div className="pt-4 space-y-4">
              <h2 className="text-2xl font-headline font-bold">{t_checkout.paymentMethod}</h2>
                <Controller name="paymentMethod" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Label htmlFor="cod" className={cn("flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer", field.value === 'cod' ? "border-primary bg-primary/10" : "border-muted")}>
                            <RadioGroupItem value="cod" id="cod" className="sr-only" />
                            <p className="font-medium">{t_checkout.cod}</p>
                        </Label>
                        {paymentSettings?.mobile_banking_enabled && (
                            <Label htmlFor="mb" className={cn("flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer", field.value === 'mobile_banking' ? "border-primary bg-primary/10" : "border-muted")}>
                                <RadioGroupItem value="mobile_banking" id="mb" className="sr-only" />
                                <p className="font-medium">{t_checkout.mobileBanking}</p>
                            </Label>
                        )}
                    </RadioGroup>
                )} />
                
              {paymentMethod === 'mobile_banking' && (
                <div className="space-y-4 p-4 border-2 border-primary/20 rounded-xl bg-primary/5">
                    <h4 className="font-bold flex items-center gap-2 text-primary">
                        <Wallet className="h-4 w-4" /> {getPaymentInstruction()}
                    </h4>
                    <div className="text-sm space-y-1">
                        <p>{t_checkout.merchantNumber}: <strong className="text-lg">{paymentSettings?.mobile_banking_number}</strong></p>
                        <p>{t_profile.total}: <strong className="text-lg">{cartTotal.toFixed(2)} BDT</strong></p>
                    </div>
                    <FormField control={form.control} name="transactionId" render={({ field }) => ( <FormItem><FormLabel>{t_checkout.transactionId}</FormLabel><FormControl><Input placeholder="8N7F6G..." {...field} className="bg-background border-2" /></FormControl><FormMessage /></FormItem> )} />
                </div>
              )}
            </div>

            <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20" size="lg" disabled={isSubmitting || cartItems.length === 0 || shippingZones.length === 0}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? t_checkout.placingOrder : t_checkout.placeOrder}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
