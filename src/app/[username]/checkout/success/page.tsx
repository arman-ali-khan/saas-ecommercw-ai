
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
import { useCart } from '@/stores/cart';
import { useTranslation } from '@/hooks/use-translation';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const t = useTranslation();
  const { success: s } = t;

  const { setLastOrder } = useCart();
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      router.replace(`/`);
      return;
    }

    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/orders/get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        
        const result = await response.json();

        if (!response.ok || !result.order) {
          throw new Error(result.error || 'Order not found');
        }

        setOrder(result.order);
        setLastOrder(result.order);
      } catch (error) {
        console.error('Error fetching order on success page:', error);
        router.replace(`/`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();

    return () => {
      setLastOrder(null);
    };
  }, [orderId, router, setLastOrder]);

  if (isLoading || !order) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader className="items-center text-center">
          <div className="relative">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <div className="absolute inset-0 -z-10 bg-green-500 rounded-full animate-pulse blur-xl opacity-30"></div>
          </div>
          <CardTitle className="text-3xl">
            {s.title}
          </CardTitle>
          <CardDescription>
            {s.description}
          </CardDescription>
          <p className="font-bold pt-2">{s.orderNumber}{order.order_number}</p>
          {order.payment_method === 'cod' && (
            <p className='font-bold pt-2 text-primary'>{s.paymentNote}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{s.summary}</h3>
            {order.cart_items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 text-sm">
                <div className="relative h-14 w-14 rounded overflow-hidden border">
                  <Image
                    src={item.imageUrl || 'https://placehold.co/100x100'}
                    alt={item.name}
                    width={56}
                    height={56}
                    className="object-cover"
                  />
                  <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-grow">
                  <p className="font-medium flex items-center gap-2">{item.name} ⨯ {item.quantity}</p> 
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
              <span className="text-muted-foreground">{s.shipping}</span>
              <span>{(order.shipping_info?.shipping_cost || 0).toFixed(2)} BDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{s.subtotal}</span>
              <span>{(order.total - (order.shipping_info?.shipping_cost || 0)).toFixed(2)} BDT</span>
            </div>
           
            <div className="flex justify-between font-bold text-base">
              <span>{s.total}</span>
              <span>{order.total.toFixed(2)} BDT</span>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-2 text-sm">
            <h3 className="font-semibold text-base">{s.contactInfo}</h3>
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
            <Link href={`/products`}>{s.continueShopping}</Link>
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
