'use client';

import { useCart } from '@/stores/cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const checkoutSchema = z
  .object({
    name: z.string().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে'),
    email: z.string().email('অনুগ্রহ করে একটি বৈধ ইমেল ঠিকানা লিখুন'),
    address: z.string().min(5, 'অনুগ্রহ করে একটি বৈধ ঠিকানা লিখুন'),
    city: z.string().min(2, 'অনুগ্রহ করে একটি বৈধ শহর লিখুন'),
    phone: z.string().min(10, 'অনুগ্রহ করে একটি বৈধ ফোন নম্বর লিখুন'),
    paymentMethod: z.string({
      required_error: 'একটি পেমেন্ট পদ্ধতি নির্বাচন করুন।',
    }),
    transactionId: z.string().optional(),
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
  const { cartItems, clearCart, setLastOrder } = useCart();
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const router = useRouter();
  const { toast } = useToast();

  const [isHydrated, setIsHydrated] = useState(false);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { customer, _hasHydrated: customerHasHydrated } = useCustomerAuth();
  const [paymentSettings, setPaymentSettings] = useState<{mobile_banking_number: string | null, accepted_banking_methods: string[] | null} | null>(null);
  const [isLoadingPaymentSettings, setIsLoadingPaymentSettings] = useState(true);

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
    },
  });

  const paymentMethod = form.watch('paymentMethod');

  useEffect(() => {
    setIsHydrated(true);
    // Fetch siteId based on domain
    const getSiteId = async () => {
      if (username) {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('domain', username)
          .single();
        if (data) {
          setSiteId(data.id);
        }
      }
    };
    getSiteId();
  }, [username]);
  
  useEffect(() => {
    const fetchPaymentSettings = async () => {
        setIsLoadingPaymentSettings(true);
        const { data, error } = await supabase
            .from('saas_settings')
            .select('mobile_banking_number, accepted_banking_methods')
            .eq('id', 1)
            .limit(1)
            .maybeSingle();
        
        if (data) {
            setPaymentSettings(data);
        } else if (error && error.code !== 'PGRST116') {
            console.warn("Could not fetch payment settings:", error?.message);
        }
        setIsLoadingPaymentSettings(false);
    }
    fetchPaymentSettings();
  }, []);

  // Pre-fill form if customer is logged in
  useEffect(() => {
    if (customerHasHydrated && customer) {
      form.reset({
        name: customer.full_name || '',
        email: customer.email || '',
        // Keep other fields as they might be different for shipping
        address: form.getValues('address'),
        city: form.getValues('city'),
        phone: form.getValues('phone'),
        paymentMethod: form.getValues('paymentMethod'),
        transactionId: form.getValues('transactionId'),
      })
    }
  }, [customer, customerHasHydrated, form]);

  const acceptedMethods = useMemo(() => {
    if (!paymentSettings?.accepted_banking_methods || paymentSettings.accepted_banking_methods.length === 0) {
        return 'যেমন বিকাশ, নগদ';
    }
    return paymentSettings.accepted_banking_methods.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ');
  }, [paymentSettings]);

  useEffect(() => {
    if (isHydrated && cartCount === 0) {
      router.push(`/${username}/products`);
    }
  }, [isHydrated, cartCount, router, username]);

  async function onSubmit(values: z.infer<typeof checkoutSchema>) {
    if (!siteId) {
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: 'সাইট খুঁজে পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
      });
      return;
    }
    setIsSubmitting(true);

    const orderNumber = `BN-${Date.now().toString().slice(-6)}`;

    const orderData = {
      order_number: orderNumber,
      site_id: siteId,
      user_id: customer?.id || null,
      customer_email: values.email,
      shipping_info: {
        name: values.name,
        address: values.address,
        city: values.city,
        phone: values.phone,
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
      status: 'processing',
    };

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      toast({
        variant: 'destructive',
        title: 'অর্ডার স্থাপন ব্যর্থ হয়েছে',
        description: orderError.message,
      });
      setIsSubmitting(false);
      return;
    }

    setLastOrder(newOrder);
    clearCart();
    router.push(`/${username}/checkout/success`);
  }

  if (!isHydrated || cartCount === 0) {
    return (
      <div className="grid md:grid-cols-2 gap-12">
        <div className="md:order-2 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="md:order-1 space-y-4">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-12">
      <div className="md:order-2">
        <Card>
          <CardHeader>
            <CardTitle>অর্ডার সারাংশ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-md overflow-hidden">
                    <Image
                      src={item.images[0].imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold">{item.name}</p>
                  </div>
                  <p>
                    {(item.price * item.quantity).toFixed(2)} {item.currency}
                  </p>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>উপমোট</span>
                <span>
                  {cartTotal.toFixed(2)} {cartItems[0]?.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span>শিপিং</span>
                <span>বিনামূল্যে</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between font-bold text-lg">
              <span>মোট</span>
              <span>
                {cartTotal.toFixed(2)} {cartItems[0]?.currency}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:order-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <h1 className="text-3xl font-headline font-bold">
              যোগাযোগ ও শিপিং
            </h1>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>পুরো নাম</FormLabel>
                  <FormControl>
                    <Input placeholder="আপনার নাম" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ইমেল ঠিকানা</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} disabled={!!(customerHasHydrated && customer)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ঠিকানা</FormLabel>
                  <FormControl>
                    <Input placeholder="বাসা/রাস্তা নং" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>শহর</FormLabel>
                  <FormControl>
                    <Input placeholder="ঢাকা" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ফোন নম্বর</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="01712345678"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <h2 className="text-2xl font-headline font-bold mb-4">
                পেমেন্ট
              </h2>

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <Label
                          htmlFor="cod"
                          className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <RadioGroupItem
                            value="cod"
                            id="cod"
                            className="sr-only"
                          />
                          <p className="text-lg font-medium">ক্যাশ অন ডেলিভারি</p>
                        </Label>
                        <Label
                          htmlFor="mobile_banking"
                          className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <RadioGroupItem
                            value="mobile_banking"
                            id="mobile_banking"
                            className="sr-only"
                          />
                          <p className="text-lg font-medium">মোবাইল ব্যাংকিং</p>
                        </Label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {paymentMethod === 'mobile_banking' && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>মোবাইল ব্যাংকিং নির্দেশনা</CardTitle>
                    <CardDescription>
                      আপনার পেমেন্ট সম্পন্ন করতে নিচের নির্দেশনা অনুসরণ করুন।
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                  {isLoadingPaymentSettings ? (
                      <div className="space-y-4">
                          <Skeleton className="h-40 w-full" />
                          <Skeleton className="h-10 w-full" />
                      </div>
                  ) : (
                    <>
                    <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                      <ol className="list-decimal list-inside space-y-2">
                        <li>
                          আপনার পছন্দের মোবাইল ব্যাংকিং অ্যাপ ({acceptedMethods})
                          খুলুন।
                        </li>
                        <li>"পেমেন্ট" অপশন নির্বাচন করুন।</li>
                        <li>
                          মার্চেন্ট নম্বর হিসেবে <strong>{paymentSettings?.mobile_banking_number || '01...'}</strong>{' '}
                          দিন।
                        </li>
                        <li>
                          টাকার পরিমাণ হিসেবে{' '}
                          <strong>
                            {cartTotal.toFixed(2)} {cartItems[0]?.currency}
                          </strong>{' '}
                          লিখুন।
                        </li>
                        <li>
                          পেমেন্ট সম্পন্ন করুন এবং প্রাপ্ত ট্রানজেকশন আইডিটি কপি
                          করুন।
                        </li>
                        <li>
                          নিচের বক্সে ট্রানজেকশন আইডিটি পেস্ট করুন।
                        </li>
                      </ol>
                    </div>
                    <FormField
                      control={form.control}
                      name="transactionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ট্রানজেকশন আইডি</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 8N7F6G5H4J" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    </>
                  )}
                  </CardContent>
                </Card>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-6"
              size="lg"
              disabled={isSubmitting || !siteId || isLoadingPaymentSettings}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? 'অর্ডার প্রক্রিয়া করা হচ্ছে...' : 'অর্ডার দিন'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
