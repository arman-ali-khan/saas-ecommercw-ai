
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/stores/cart';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from './ui/sheet';
import {
  ShoppingBag as ShoppingBagIcon,
  Trash2,
  Plus,
  Minus,
} from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

export default function FixedCartButton() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
  } = useCart();
  const { toast } = useToast();
  const t = useTranslation();
  const { toast: t_toast } = t;
  
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const pathname = usePathname();

  if (!isHydrated || cartCount === 0 || pathname.startsWith('/admin')) {
    return null;
  }
  
  const checkoutUrl = `/checkout`;

  const handleRemoveFromCart = (productId: string) => {
    removeFromCart(productId);
    toast({
      title: t_toast.removedFromBag,
      variant: 'destructive',
    });
  }

  return (
    <div className="hidden md:block">
      <Sheet>
        <SheetTrigger asChild>
          <div className="fixed top-1/2 right-6 -translate-y-1/2 z-50 group">
            <Button
              className={cn(
                "h-auto w-16 py-5 flex flex-col items-center justify-center gap-3 rounded-full shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] hover:-translate-x-1.5 active:scale-95 border-2 border-primary-foreground/10 ring-4 ring-primary/5",
                "bg-primary text-primary-foreground"
              )}
            >
              <div className="relative">
                <ShoppingBagIcon className="h-7 w-7 transition-transform group-hover:scale-110" />
                <span className="absolute -top-[35px] -left-[5px] flex h-6 w-6 items-center justify-center rounded-full bg-background text-foreground text-[10px] font-black shadow-lg border-2 border-primary animate-in zoom-in duration-500">
                  {cartCount}
                </span>
              </div>
              
              <div className="h-px w-8 bg-primary-foreground/20" />
              
              <div className="flex flex-col items-center leading-none gap-0.5">
                <span className="text-xs font-black tracking-tighter">
                  {cartTotal.toFixed(0)}
                </span>
                <span className="text-[8px] font-bold opacity-80 uppercase">
                  {cartItems[0]?.currency || 'BDT'}
                </span>
              </div>
            </Button>
          </div>
        </SheetTrigger>
        <SheetContent className="flex flex-col w-full sm:max-w-md border-l-2 border-primary/10">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="flex items-center gap-2 text-2xl font-black font-headline">
                <div className="bg-primary/10 p-2 rounded-xl">
                    <ShoppingBagIcon className="h-6 w-6 text-primary" />
                </div>
                শপিং ব্যাগ ({cartCount})
            </SheetTitle>
          </SheetHeader>
          {cartItems.length > 0 ? (
            <>
              <ScrollArea className="flex-grow my-4 -mr-6 pr-6">
                <div className="space-y-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 group/item">
                      <div className="relative h-24 w-24 rounded-2xl overflow-hidden border-2 border-muted bg-muted shadow-sm shrink-0">
                        <Image
                          src={item.images[0].imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover/item:scale-110"
                        />
                      </div>
                      <div className="flex flex-col justify-between flex-grow min-w-0">
                        <div>
                          <h3 className="font-bold text-base truncate">{item.name}</h3>
                          <p className="text-sm font-black text-primary">
                            {item.price.toFixed(2)} {item.currency}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-background"
                                onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                                }
                            >
                                <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-background"
                                onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                                }
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl h-10 w-10 transition-colors"
                            onClick={() => handleRemoveFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <SheetFooter className="mt-auto pt-6 border-t">
                <div className="w-full space-y-6">
                  <div className="flex justify-between items-end">
                    <span className="text-muted-foreground font-medium uppercase tracking-widest text-xs">উপমোট (Subtotal)</span>
                    <span className="text-2xl font-black text-primary">
                      {cartTotal.toFixed(2)} {cartItems[0]?.currency}
                    </span>
                  </div>
                  <div className="grid gap-3">
                    <SheetClose asChild>
                        <Button asChild className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95" size="lg">
                        <Link href={checkoutUrl}>চেকআউটে এগিয়ে যান</Link>
                        </Button>
                    </SheetClose>
                    <SheetClose asChild>
                        <Button variant="ghost" className="w-full h-12 rounded-2xl text-muted-foreground font-bold">কেনাকাটা চালিয়ে যান</Button>
                    </SheetClose>
                  </div>
                </div>
              </SheetFooter>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
              <div className="bg-muted/30 p-10 rounded-full mb-6">
                <ShoppingBagIcon className="w-20 h-20 text-muted-foreground/30" />
              </div>
              <h3 className="font-black text-2xl font-headline">আপনার ব্যাগ খালি</h3>
              <p className="text-muted-foreground mt-3 max-w-xs mx-auto">
                মনে হচ্ছে আপনি এখনও কোনো সুস্বাদু পণ্য বেছে নেননি।
              </p>
              <SheetClose asChild>
                <Button asChild className="mt-8 px-10 h-12 rounded-2xl font-bold shadow-lg" variant="outline">
                  <Link href={'/products'}>কেনাকাটা শুরু করুন</Link>
                </Button>
              </SheetClose>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
