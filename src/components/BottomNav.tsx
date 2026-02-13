'use client';

import Link from 'next/link';
import { Home, User, Menu, Search } from 'lucide-react';
import { usePathname, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from './ui/sheet';
import { CardHeader, CardTitle } from './ui/card';
import DynamicIcon from './dynamic-icon';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Category } from '@/types';
import { useSearchStore } from '@/stores/useSearchStore';
import { useCart } from '@/stores/cart';
import { ShoppingBag as ShoppingBagIcon, Trash2, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCustomerAuth } from '@/stores/useCustomerAuth';

function CategoryDrawer() {
  const params = useParams();
  const domain = params.username as string;
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      if (domain) {
        setIsLoading(true);
        const { data: profile } = await supabase.from('profiles').select('id').eq('domain', domain).single();
        if (profile) {
          const { data: categoriesData } = await supabase.from('categories').select('*').eq('site_id', profile.id).order('name');
          setCategories(categoriesData || []);
        }
        setIsLoading(false);
      }
    }
    fetchCategories();
  }, [domain]);

  return (
    <SheetContent side="left" className="w-full max-w-sm">
      <SheetHeader>
        <SheetTitle>Categories</SheetTitle>
      </SheetHeader>
      <div className="py-4">
        {isLoading ? <p>Loading...</p> : (
          <nav className="flex flex-col gap-1">
            {categories.map((cat) => (
              <SheetClose asChild key={cat.id}>
                <Link href={`/products?category=${encodeURIComponent(cat.name)}`} passHref>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <DynamicIcon name={cat.icon || 'Package'} className="h-5 w-5 text-muted-foreground" />
                    <span className="truncate">{cat.name}</span>
                  </Button>
                </Link>
              </SheetClose>
            ))}
            {categories.length === 0 && <p className="text-muted-foreground text-center">No categories found.</p>}
          </nav>
        )}
      </div>
    </SheetContent>
  );
}

function CartDrawerContent() {
    const { cartItems, updateQuantity, removeFromCart } = useCart();
    const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const { toast } = useToast();

    const handleRemoveFromCart = (productId: string) => {
        removeFromCart(productId);
        toast({
          title: 'Bag থেকে সরানো হয়েছে',
          variant: 'destructive',
        });
    };

    return (
        <>
            <SheetHeader>
                <SheetTitle>Shopping Bag ({cartItems.reduce((count, item) => count + item.quantity, 0)})</SheetTitle>
            </SheetHeader>
            {cartItems.length > 0 ? (
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
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <Input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))} className="h-8 w-12 text-center" min={1} />
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemoveFromCart(item.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <SheetFooter className="mt-auto">
                        <div className="w-full space-y-4">
                            <div className="flex justify-between font-bold text-lg">
                                <span>সাব-টোটাল</span>
                                <span>{cartTotal.toFixed(2)} {cartItems[0]?.currency}</span>
                            </div>
                            <SheetClose asChild>
                                <Button asChild className="w-full" size="lg">
                                    <Link href={`/checkout`}>চেকআউটে যান</Link>
                                </Button>
                            </SheetClose>
                        </div>
                    </SheetFooter>
                </>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <ShoppingBagIcon className="w-24 h-24 text-muted-foreground/50 mb-4" />
                    <h3 className="font-semibold text-xl">আপনার ব্যাগ খালি</h3>
                    <p className="text-muted-foreground mt-2">মনে হচ্ছে আপনি এখনো কিছু অ্যাড করেননি।</p>
                    <SheetClose asChild>
                        <Button asChild className="mt-6">
                            <Link href={`/products`}>কেনাকাটা শুরু করুন</Link>
                        </Button>
                    </SheetClose>
                </div>
            )}
        </>
    );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { customer } = useCustomerAuth();
  const { setSearchOpen } = useSearchStore();
  const { cartItems } = useCart();
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  if (pathname.includes('/admin')) {
      return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-40 p-1">
      <div className="grid h-16 grid-cols-5 gap-1">

        {/* Category Drawer */}
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" className="flex flex-col h-auto items-center justify-center p-1 text-foreground/70 hover:bg-accent hover:text-accent-foreground">
                    <Menu className="h-6 w-6" />
                    <span className="text-xs font-normal">Categories</span>
                </Button>
            </SheetTrigger>
            <CategoryDrawer />
        </Sheet>
        
        {/* Search Button */}
        <Button variant="ghost" className="flex flex-col h-auto items-center justify-center p-1 text-foreground/70 hover:bg-accent hover:text-accent-foreground" onClick={() => setSearchOpen(true)}>
            <Search className="h-6 w-6" />
            <span className="text-xs font-normal">Search</span>
        </Button>

        {/* Home Link */}
        <Link href="/">
            <div className={cn('flex flex-col h-full items-center justify-center p-1 rounded-md text-foreground/70 hover:bg-accent hover:text-accent-foreground', pathname === '/' && 'text-primary')}>
                <Home className="h-6 w-6" />
                <span className="text-xs font-normal">Home</span>
            </div>
        </Link>
        
        {/* Profile Link */}
        <Link href={customer ? '/profile' : '/login'}>
            <div className={cn('flex flex-col h-full items-center justify-center p-1 rounded-md text-foreground/70 hover:bg-accent hover:text-accent-foreground', pathname.startsWith('/profile') && 'text-primary')}>
                <User className="h-6 w-6" />
                <span className="text-xs font-normal">Profile</span>
            </div>
        </Link>

        {/* Cart Button */}
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" className="relative flex flex-col h-auto items-center justify-center p-1 text-foreground/70 hover:bg-accent hover:text-accent-foreground">
                    <ShoppingBagIcon className="h-6 w-6" />
                    <span className="text-xs font-normal">Cart</span>
                    {cartCount > 0 && (
                        <span className="absolute top-1.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {cartCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col">
                <CartDrawerContent />
            </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
