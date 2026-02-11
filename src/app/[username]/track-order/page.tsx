'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Loader2, Search, Package, Truck, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  orderNumber: z.string().min(1, 'অর্ডার আইডি প্রয়োজন।'),
});

type TrackedOrder = {
    order_number: string;
    status: string;
    created_at: string;
}

const ORDER_STATUSES = ['processing', 'shipped', 'delivered'];

export default function TrackOrderPage() {
  const params = useParams();
  const username = params.username as string;

  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { orderNumber: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);
    setOrder(null);
    try {
      const response = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: values.orderNumber,
          domain: username,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'অর্ডার খুঁজে পাওয়া যায়নি।');
      }
      setOrder(result.order);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const currentStatusIndex = order ? ORDER_STATUSES.indexOf(order.status) : -1;
  
  const statusLabels: {[key: string]: string} = {
    processing: 'প্রক্রিয়াকরণ চলছে',
    shipped: 'পাঠানো হয়েছে',
    delivered: 'বিতরণ করা হয়েছে',
    canceled: 'বাতিল করা হয়েছে'
  };

  const StatusIcon = ({ status, isActive, isCompleted }: { status: string, isActive: boolean, isCompleted: boolean }) => {
    const icons: {[key: string]: React.ElementType} = {
        processing: Package,
        shipped: Truck,
        delivered: CheckCircle,
    }
    const Icon = icons[status];
    return (
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center border-2", 
            isActive || isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted border-muted-foreground/20 text-muted-foreground'
        )}>
            <Icon className="h-6 w-6" />
        </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>আপনার অর্ডার ট্র্যাক করুন</CardTitle>
          <CardDescription>
            আপনার অর্ডার আইডি লিখুন এবং বর্তমান অবস্থা জানুন।
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel className="sr-only">Order ID</FormLabel>
                    <FormControl>
                      <Input placeholder="অর্ডার আইডি, যেমন BN-123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="mt-0.5">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">ট্র্যাক</span>
              </Button>
            </form>
          </Form>

          <div className="mt-8">
            {error && <p className="text-destructive text-center">{error}</p>}
            {order && (
              <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle>অর্ডার #{order.order_number}</CardTitle>
                    <CardDescription>অর্ডার দেওয়া হয়েছে: {format(new Date(order.created_at), 'PPp', { locale: bn })}</CardDescription>
                  </CardHeader>
                  <CardContent>
                     {order.status === 'canceled' ? (
                        <div className="text-center py-8">
                            <p className="text-xl font-bold text-destructive">এই অর্ডারটি বাতিল করা হয়েছে।</p>
                        </div>
                     ) : (
                        <div className="flex justify-between items-start relative">
                            <div className="absolute top-6 left-0 w-full h-1 bg-border -z-10">
                                <div className="h-full bg-primary transition-all duration-500" style={{width: `${(currentStatusIndex / (ORDER_STATUSES.length - 1)) * 100}%`}}></div>
                            </div>
                            {ORDER_STATUSES.map((status, index) => (
                                <div key={status} className="flex flex-col items-center gap-2 w-1/3 text-center">
                                    <StatusIcon status={status} isActive={index === currentStatusIndex} isCompleted={index <= currentStatusIndex} />
                                    <p className={cn("text-sm font-medium", index <= currentStatusIndex ? "text-foreground" : "text-muted-foreground")}>{statusLabels[status]}</p>
                                </div>
                            ))}
                        </div>
                     )}
                  </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}