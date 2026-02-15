'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase/client';
import { useCart } from '@/stores/cart';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  const { setLastOrder } = useCart();
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      // If there's no order_id, we can't show anything. Redirect home.
      router.replace(`/`);
      return;
    }

    const fetchOrder = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error || !data) {
        // Can't find the order, maybe a bad link.
        console.error('Error fetching order on success page:', error);
        router.replace(`/`);
      } else {
        setOrder(data);
        setLastOrder(data);
      }
      setIsLoading(false);
    };

    fetchOrder();

    // Cleanup the lastOrder in the cart store when the component unmounts
    // to prevent showing old data on a future checkout.
    return () => {
      setLastOrder(null);
    };
  }, [orderId, router, setLastOrder]);

  if (isLoading || !order) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">আপনার অর্ডার নিশ্চিত করা হচ্ছে...</p>
      </div>
    );
  }

  console.log(order,'order')

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader className="items-center text-center">
          <div className="relative">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <div className="absolute inset-0 -z-10 bg-green-500 rounded-full animate-pulse blur-xl opacity-30"></div>
          </div>
          <CardTitle className="text-3xl">
            আপনার অর্ডার সম্পন্ন হয়েছে!
          </CardTitle>
          <CardDescription>
            আপনার অর্ডারের জন্য ধন্যবাদ। আমরা আপনার পার্সেল প্রস্তুত করছি।
          </CardDescription>
          <p className="font-bold pt-2">অর্ডার #{order.order_number}</p>
          <p className='font-bold pt-2'>{order.payment_method === 'cod' ? 'টাকা হাতে পেয়ে মূল্য পরিশোধ করুন।':''}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">অর্ডার সারাংশ</h3>
            {order.cart_items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 text-sm">
                <div className="relative h-14 w-14 rounded-md overflow-hidden border">
                  <Image
                    src={item.imageUrl || 'https://placehold.co/100x100'}
                    alt={item.name}
                    width={56}
                    height={56}
                    className="object-cover"
                  />
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-grow">
                  <p className="font-medium">{item.name}</p>
                </div>
                <p>
                  {(item.price * item.quantity).toFixed(2)} BDT
                </p>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="space-y-2 text-sm">
          <div className="flex justify-between">
              <span className="text-muted-foreground">শিপিং</span>
              <span>{order.shipping_info.shipping_cost.toFixed(2)} BDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">উপমোট</span>
              <span>{order.total.toFixed(2)} BDT</span>
            </div>
           
            <div className="flex justify-between font-bold text-base">
              <span>মোট</span>
              <span>{order.total.toFixed(2)} BDT</span>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-2 text-sm">
            <h3 className="font-semibold text-base">যোগাযোগ ও শিপিং</h3>
            <address className="text-muted-foreground not-italic">
              {order.shipping_info.name}
              <br />
              {order.customer_email}
              <br />
              {order.shipping_info.address}
              <br />
              {order.shipping_info.city}
              <br />
              {order.shipping_info.phone}
            </address>
          </div>
          <Button asChild className="w-full mt-6">
            <Link href={`/products`}>কেনাকাটা চালিয়ে যান</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">লোড হচ্ছে...</p>
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}
