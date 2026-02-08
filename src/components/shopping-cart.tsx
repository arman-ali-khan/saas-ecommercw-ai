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

export default function ShoppingCart() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
  } = useCart();
  const { toast } = useToast();
  
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const KNOWN_ROOT_PATHS = ['admin', 'login', 'register', 'profile'];
  const username = segments.length > 0 && !KNOWN_ROOT_PATHS.includes(segments[0]) ? segments[0] : null;
  const checkoutUrl = username ? `/${username}/checkout` : '/checkout'; // Fallback, though should always have username here.

  const handleRemoveFromCart = (productId: string) => {
    removeFromCart(productId);
    toast({
      title: 'ব্যাগ থেকে সরানো হয়েছে',
      variant: 'destructive',
    });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingBagIcon className="h-6 w-6" />
          {isHydrated && cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {cartCount}
            </span>
          )}
          <span className="sr-only">শপিং ব্যাগ খুলুন</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>শপিং ব্যাগ ({isHydrated ? cartCount : 0})</SheetTitle>
        </SheetHeader>
        {isHydrated && cartItems.length > 0 ? (
          <>
            <ScrollArea className="flex-grow my-4">
              <div className="space-y-6 pr-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-24 w-24 rounded-md overflow-hidden">
                      <Image
                        src={item.images[0].imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col justify-between flex-grow">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.price.toFixed(2)} {item.currency}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.id,
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          className="h-8 w-12 text-center"
                          min={1}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <SheetFooter className="mt-auto">
              <div className="w-full space-y-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>উপমোট</span>
                  <span>
                    {cartTotal.toFixed(2)} {cartItems[0]?.currency}
                  </span>
                </div>
                <SheetClose asChild>
                  <Button asChild className="w-full" size="lg">
                    <Link href={checkoutUrl}>চেকআউটে এগিয়ে যান</Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center">
            <ShoppingBagIcon className="w-24 h-24 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-xl">আপনার ব্যাগ খালি</h3>
            <p className="text-muted-foreground mt-2">
              মনে হচ্ছে আপনি এখনো কিছু যোগ করেননি।
            </p>
            <SheetClose asChild>
              <Button asChild className="mt-6">
                <Link href={username ? `/${username}/products` : '/products'}>কেনাকাটা শুরু করুন</Link>
              </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
