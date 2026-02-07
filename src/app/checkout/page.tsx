'use client';

import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const checkoutSchema = z.object({
  name: z.string().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে'),
  address: z.string().min(5, 'অনুগ্রহ করে একটি বৈধ ঠিকানা লিখুন'),
  city: z.string().min(2, 'অনুগ্রহ করে একটি বৈধ শহর লিখুন'),
  phone: z.string().min(10, 'অনুগ্রহ করে একটি বৈধ ফোন নম্বর লিখুন'),
});

export default function CheckoutPage() {
  const { cartItems, cartTotal, cartCount, isLoading } = useCart();
  const router = useRouter();

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (!isLoading && cartCount === 0) {
      router.push('/products');
    }
  }, [isLoading, cartCount, router]);

  if (isLoading || cartCount === 0) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </main>
    );
  }

  function onSubmit(values: z.infer<typeof checkoutSchema>) {
    console.log(values);
    alert('অর্ডার সফলভাবে স্থাপন করা হয়েছে! (এটি একটি ডেমো)');
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <h1 className="text-3xl font-headline font-bold mb-6">
            শিপিং বিবরণ
          </h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <Input placeholder="01712345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="mt-8">
                <h2 className="text-2xl font-headline font-bold mb-4">
                  পেমেন্ট
                </h2>
                <div className="rounded-md border bg-muted p-4 text-center">
                  <p className="text-muted-foreground">
                    পেমেন্ট গেটওয়ে শীঘ্রই আসছে। আপাতত, ডেমো উপভোগ করুন।
                  </p>
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg">
                অর্ডার দিন
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </main>
  );
}
