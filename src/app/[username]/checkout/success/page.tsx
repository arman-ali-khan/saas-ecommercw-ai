'use client';

import { useEffect } from 'react';
import { useCart } from '@/stores/cart';
import { useRouter, useParams } from 'next/navigation';
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
import { CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function CheckoutSuccessPage() {
  const { lastOrder, setLastOrder } = useCart();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  useEffect(() => {
    // If there's no order data, the user likely refreshed or came here directly.
    // Redirect them to the homepage.
    if (!lastOrder) {
      router.replace(`/${username}`);
    }

    // Cleanup the lastOrder from state when the component unmounts
    return () => {
      setLastOrder(null);
    };
  }, [lastOrder, router, username, setLastOrder]);

  if (!lastOrder) {
    // You can show a loading spinner or a simple message here while redirecting
    return (
      <div className="flex justify-center items-center h-64">
        <p>লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader className="items-center text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-3xl">
            আপনার অর্ডার সম্পন্ন হয়েছে!
          </CardTitle>
          <CardDescription>
            আপনার অর্ডারের জন্য ধন্যবাদ। আমরা আপনার পার্সেল প্রস্তুত করছি।
          </CardDescription>
          <p className="font-bold pt-2">অর্ডার #{lastOrder.order_number}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">অর্ডার সারাংশ</h3>
            {lastOrder.cart_items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 text-sm">
                <div className="relative h-14 w-14 rounded-md overflow-hidden border">
                  <Image
                    src={item.imageUrl || 'https://placehold.co/100x100'}
                    alt={item.name}
                    fill
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
              <span className="text-muted-foreground">উপমোট</span>
              <span>{lastOrder.total.toFixed(2)} BDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">শিপিং</span>
              <span>বিনামূল্যে</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>মোট</span>
              <span>{lastOrder.total.toFixed(2)} BDT</span>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-2 text-sm">
            <h3 className="font-semibold text-base">যোগাযোগ ও শিপিং</h3>
            <address className="text-muted-foreground not-italic">
              {lastOrder.shipping_info.name}
              <br />
              {lastOrder.customer_email}
              <br />
              {lastOrder.shipping_info.address}
              <br />
              {lastOrder.shipping_info.city}
              <br />
              {lastOrder.shipping_info.phone}
            </address>
          </div>
          <Separator className="my-4" />
          <Button asChild className="w-full mt-6">
            <Link href={`/${username}/products`}>কেনাকাটা চালিয়ে যান</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
