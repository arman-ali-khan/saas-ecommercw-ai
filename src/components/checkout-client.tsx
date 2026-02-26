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
import { Loader2, Truck, Wallet, CheckCircle2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ShippingZone, Address, SaasSettings } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '@/hooks/use-translation';
import { Badge } from './ui/badge';

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
  const { cartItems, clearCart, updateQuantity } = useCart();
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

  const getActionKeyword = () => {
    if (!paymentSettings) return t_checkout.payment;
    const type = paymentSettings.mobile_banking_type || 'personal';
    if (type === 'personal') return t_checkout.sendMoney;
    if (type === 'agent') return t_checkout.cashOut;
    return t_checkout.payment;
  };

  return (
    <div className="grid md:grid-cols-2 gap-12">
      {/* Product List Section - Move to top on mobile for better UX */}
      <div className="order-1 md:order-2">
        <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                {t_checkout.summary} ({cartCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-6">
            {cartItems.map((item, index) => (
                <div key={`${item.id}-${item.selected_unit || index}`} className="flex gap-3 sm:gap-4 group items-start">
                    {/* Product Image */}
                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-xl overflow-hidden border-2 border-muted bg-muted shrink-0 shadow-sm">
                        <Image src={item.images[0].imageUrl} alt={item.name} fill className="object-cover" />
                        <Badge className="absolute top-1 left-1 h-5 min-w-[20px] px-1.5 justify-center text-[10px] font-black" variant="secondary">
                            {item.quantity}
                        </Badge>
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex flex-col flex-grow min-w-0 py-1">
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-sm sm:text-base line-clamp-2 leading-tight flex-grow">
                                {item.name}
                            </h3>
                            <div className="text-right shrink-0">
                                <p className="font-black text-primary text-sm sm:text-base">{(item.price * item.quantity).toFixed(2)}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">BDT</p>
                            </div>
                        </div>
                        
                        <div className="mt-auto pt-2 flex items-center justify-between">
                            {item.selected_unit ? (
                                <Badge variant="outline" className="text-[10px] h-5 uppercase font-black px-1.5 border-primary/20 bg-primary/5 text-primary/80">
                                    {item.selected_unit}
                                </Badge>
                            ) : <div />}
                            
                            {/* Responsive Quantity Controls */}
                            <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border shadow-inner">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 rounded-md hover:bg-background"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.selected_unit)}
                                >
                                    <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 rounded-md hover:bg-background"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.selected_unit)}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            </div>
            
            <Separator className="my-6" />
            
            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t_checkout.subtotal}</span>
                    <span className="text-foreground font-bold">{cartSubtotal.toFixed(2)} BDT</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t_checkout.shipping}</span>
                    <span className="text-foreground font-bold">{shippingCost.toFixed(2)} BDT</span>
                </div>
                <Separator className="opacity-50" />
                <div className="flex justify-between items-center pt-2">
                    <span className="font-black text-lg uppercase tracking-tight">{t_checkout.total}</span>
                    <div className="text-right">
                        <span className="text-3xl font-black text-primary drop-shadow-sm">{cartTotal.toFixed(2)}</span>
                        <span className="text-xs font-bold text-muted-foreground ml-1 uppercase">BDT</span>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checkout Form Section */}
      <div className="order-2 md:order-1 px-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <h1 className="text-3xl sm:text-4xl font-headline font-black tracking-tight">{t_checkout.title}</h1>
            
            {customer && savedAddresses.length > 0 && (
                <div className="space-y-4">
                    <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">{t_checkout.savedAddresses}</Label>
                    <RadioGroup 
                        onValueChange={(id) => { const addr = savedAddresses.find(a => a.id === id); if(addr) handleSelectAddress(addr); }} 
                        value={selectedAddressId || ''} 
                        className="grid grid-cols-1 gap-3"
                    >
                        {savedAddresses.map(address => (
                            <Label 
                                key={address.id} 
                                htmlFor={`addr-${address.id}`} 
                                className={cn(
                                    "flex items-start gap-4 rounded-2xl border-2 p-4 cursor-pointer transition-all", 
                                    selectedAddressId === address.id ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/10" : "border-muted bg-card/50 hover:bg-card hover:border-primary/30"
                                )}
                            >
                                <div className="mt-1">
                                    <RadioGroupItem value={address.id} id={`addr-${address.id}`} />
                                </div>
                                <div className="flex-grow text-xs space-y-1">
                                    <p className="font-black text-sm text-foreground uppercase tracking-tight">{address.name}</p>
                                    <p className="text-muted-foreground leading-relaxed font-medium">{address.details}, {address.city}</p>
                                    {address.phone && <p className="text-[10px] text-primary font-bold">Tel: {address.phone}</p>}
                                </div>
                            </Label>
                        ))}
                    </RadioGroup>
                </div>
            )}

            <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel className="font-bold">{t_checkout.fullName}</FormLabel><FormControl><Input placeholder={t_checkout.fullName} {...field} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel className="font-bold">{t_checkout.email}</FormLabel><FormControl><Input placeholder="you@example.com" {...field} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel className="font-bold">{t_checkout.address}</FormLabel><FormControl><Input placeholder={t_checkout.address} {...field} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem> )} />
                <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel className="font-bold">{t_checkout.city}</FormLabel><FormControl><Input placeholder={t_checkout.city} {...field} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel className="font-bold">{t_checkout.phone}</FormLabel><FormControl><Input placeholder={t_checkout.phone} {...field} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem> )} />
                </div>

                <FormField control={form.control} name="shippingZoneId" render={({ field }) => (
                    <FormItem className="space-y-4">
                    <FormLabel className="text-sm font-black uppercase tracking-widest text-muted-foreground">{t_checkout.shippingMethod}</FormLabel>
                    {shippingZones.length > 0 ? (
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {shippingZones.map((zone) => (
                                <Label 
                                    key={zone.id} 
                                    htmlFor={`ship-${zone.id}`} 
                                    className={cn(
                                        "flex items-center gap-4 rounded-2xl border-2 p-4 cursor-pointer transition-all", 
                                        field.value === zone.id.toString() ? "border-primary bg-primary/5 ring-2 ring-primary/10 shadow-md" : "border-muted bg-card/50 hover:bg-card hover:border-primary/20"
                                    )}
                                >
                                    <RadioGroupItem value={zone.id.toString()} id={`ship-${zone.id}`} className="sr-only" />
                                    <div className="bg-primary/10 p-2 rounded-xl shrink-0">
                                        <Truck className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-bold text-sm leading-tight">{zone.name}</p>
                                        <p className="text-xs text-primary font-black mt-1">{zone.price.toFixed(2)} BDT</p>
                                    </div>
                                    {field.value === zone.id.toString() && <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-background" /></div>}
                                </Label>
                            ))}
                        </RadioGroup>
                    ) : (
                        <p className="text-sm text-destructive font-bold">{t_checkout.noShipping}</p>
                    )}
                    <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel className="font-bold">{t_checkout.orderNote}</FormLabel><FormControl><Textarea placeholder="..." {...field} className="rounded-xl resize-none" rows={3} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            
            <Separator className="opacity-50" />

            <div className="space-y-6">
              <h2 className="text-2xl font-headline font-black tracking-tight">{t_checkout.paymentMethod}</h2>
                <Controller name="paymentMethod" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Label 
                            htmlFor="cod" 
                            className={cn(
                                "flex flex-col items-center justify-center rounded-2xl border-2 p-6 cursor-pointer transition-all", 
                                field.value === 'cod' ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/10" : "border-muted bg-card/50 hover:bg-card hover:border-primary/20"
                            )}
                        >
                            <RadioGroupItem value="cod" id="cod" className="sr-only" />
                            <div className={cn("p-3 rounded-2xl mb-3", field.value === 'cod' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                <Truck className="h-6 w-6" />
                            </div>
                            <p className="font-black text-sm uppercase tracking-tight">{t_checkout.cod}</p>
                        </Label>
                        {paymentSettings?.mobile_banking_enabled && (
                            <Label 
                                htmlFor="mb" 
                                className={cn(
                                    "flex flex-col items-center justify-center rounded-2xl border-2 p-6 cursor-pointer transition-all", 
                                    field.value === 'mobile_banking' ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/10" : "border-muted bg-card/50 hover:bg-card hover:border-primary/20"
                                )}
                            >
                                <RadioGroupItem value="mobile_banking" id="mb" className="sr-only" />
                                <div className={cn("p-3 rounded-2xl mb-3", field.value === 'mobile_banking' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                    <Wallet className="h-6 w-6" />
                                </div>
                                <p className="font-black text-sm uppercase tracking-tight">{t_checkout.mobileBanking}</p>
                            </Label>
                        )}
                    </RadioGroup>
                )} />
                
              {paymentMethod === 'mobile_banking' && (
                <div className="space-y-4 p-6 border-2 border-primary/20 rounded-3xl bg-primary/5 animate-in slide-in-from-top-4 duration-500">
                    <h4 className="font-black text-sm uppercase tracking-widest text-primary flex items-center gap-2">
                        <Wallet className="h-5 w-5" /> 
                        {t_checkout.mobileBanking} Instructions
                    </h4>
                    <div className="text-xs sm:text-sm space-y-3 bg-card p-5 rounded-2xl border shadow-inner">
                        <p className="font-bold flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> 1. {t_checkout.paymentStep1}</p>
                        <p className="font-bold flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> 2. {t_checkout.paymentStep2} <span className="text-primary underline font-black">{getActionKeyword()}</span></p>
                        <p className="font-bold flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> 3. {t_checkout.paymentStep3} <span className="text-base sm:text-lg font-black font-mono tracking-tight bg-primary/10 px-2 py-0.5 rounded-md">{paymentSettings?.mobile_banking_number}</span></p>
                        <p className="font-bold flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> 4. {t_checkout.paymentStep4} <span className="text-base sm:text-lg font-black text-primary">{cartTotal.toFixed(2)} BDT</span></p>
                        <p className="text-muted-foreground italic text-[10px] sm:text-xs mt-3 border-t pt-3 border-dashed">5. {t_checkout.paymentStep5}</p>
                    </div>
                    <FormField control={form.control} name="transactionId" render={({ field }) => ( <FormItem><FormLabel className="font-black text-[10px] uppercase tracking-widest ml-1">{t_checkout.transactionId}</FormLabel><FormControl><Input placeholder="8N7F6G..." {...field} className="bg-background border-2 h-14 text-lg font-mono font-bold rounded-xl focus:border-primary" /></FormControl><FormMessage /></FormItem> )} />
                </div>
              )}
            </div>

            <div className="pt-6 pb-10 sm:pb-0">
                <Button 
                    type="submit" 
                    className="w-full h-16 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group" 
                    size="lg" 
                    disabled={isSubmitting || cartItems.length === 0 || shippingZones.length === 0}
                >
                {isSubmitting ? (
                    <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> {t_checkout.placingOrder}</>
                ) : (
                    <>{t_checkout.placeOrder} <CheckCircle2 className="ml-3 h-6 w-6 group-hover:scale-110 transition-transform" /></>
                )}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground mt-4 uppercase font-black tracking-widest opacity-60">Secure Checkout Powered by eHut</p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
