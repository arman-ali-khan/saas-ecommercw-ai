
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product, FlashDeal, ProductVariant } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { ShoppingBag, Star, X, Plus, Minus, CheckCircle2, Eye } from 'lucide-react';
import { useCart } from '@/stores/cart';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import Countdown from './countdown';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';

interface ProductCardProps {
  product: Product;
  flashDeal?: FlashDeal;
}

export default function ProductCard({ product, flashDeal }: ProductCardProps) {
  const addToCart = useCart((state) => state.addToCart);
  const { toast } = useToast();
  const t = useTranslation();
  const { productCard: t_card, toast: t_toast } = t;

  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    // If product has variants and dialog is not open, open Quick View
    if (product.variants && product.variants.length > 0 && !isQuickViewOpen) {
        setIsQuickViewOpen(true);
        return;
    }

    const productToAdd = { ...product };
    
    // Set variant info if selected
    if (selectedVariant) {
        productToAdd.price = selectedVariant.price;
        (productToAdd as any).selected_unit = selectedVariant.unit;
    } else if (flashDeal) {
        productToAdd.price = flashDeal.discount_price;
    }

    addToCart(productToAdd as any, quantity);
    
    toast({
      title: t_toast.addedToBag,
      description: t_toast.addedToBagDesc.replace('{quantity}', quantity.toString()).replace('{productName}', product.name),
    });
    
    if (isQuickViewOpen) {
        setIsQuickViewOpen(false);
    }
  };

  const productUrl = `/products/${product.id}`;

  const priceDisplay = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map(v => v.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      if (minPrice === maxPrice) {
        return `${minPrice.toFixed(2)} ${product.currency}`;
      }
      return `${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)} ${product.currency}`;
    }
    
    const basePrice = flashDeal ? flashDeal.discount_price : product.price;
    return `${basePrice.toFixed(2)} ${product.currency}`;
  }, [product, flashDeal]);

  // Quick view specific calculations
  const currentPrice = selectedVariant ? selectedVariant.price : (flashDeal ? flashDeal.discount_price : product.price);
  const currentStock = selectedVariant ? selectedVariant.stock : (product.stock || 0);

  return (
    <>
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
      <div className="relative">
        <Button 
            variant="secondary" 
            size="icon" 
            className="absolute top-2 left-2 z-20 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md border border-primary/10"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsQuickViewOpen(true);
            }}
        >
            <Eye className="h-4 w-4 text-primary" />
        </Button>
        
        <Link href={productUrl} className="block relative">
            <CardHeader className="p-0">
            <div className="relative w-full aspect-[6/5]">
                <Image
                src={product.images[0]?.imageUrl || 'https://placehold.co/400x300'}
                alt={product.name}
                data-ai-hint={product.images[0]?.imageHint || 'product image'}
                fill
                className="object-cover"
                />
            </div>
            {flashDeal && <Badge className="absolute top-2 right-2" variant="destructive">Sale</Badge>}
            </CardHeader>
            <CardContent className="p-1 sm:p-4 flex-grow">
            <h3 className="text-sm sm:text-lg font-headline font-semibold line-clamp-1">{product.name}</h3>
            {product.review_count && product.review_count > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={cn(
                        "h-4 w-4",
                        product.avg_rating && i < Math.round(product.avg_rating)
                            ? "fill-primary text-primary"
                            : "text-muted-foreground/30"
                        )}
                    />
                    ))}
                </div>
                <span className="text-xs text-muted-foreground">({product.review_count})</span>
                </div>
            )}
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm line-clamp-2">{product.description}</p>
            {flashDeal && (
                <div className="mt-2">
                <Countdown endDate={flashDeal.end_date} />
                </div> 
            )}
            </CardContent>
        </Link>
      </div>
      <CardFooter className="p-1 block sm:p-4 !pt-1 sm:mt-auto items-center">
        <div className="flex flex-col w-full mb-3">
            {flashDeal && !product.variants?.length && (
                <p className="text-xs font-bold text-muted-foreground line-through">
                    {product.price.toFixed(2)} {product.currency}
                </p>
            )}
            <p className="text-sm sm:text-lg font-bold text-primary">
                {priceDisplay}
            </p>
        </div>
        <Button 
            onClick={handleAddToCart} 
            className="w-full h-9 sm:h-10 text-xs sm:text-sm"
            variant={product.variants && product.variants.length > 0 ? "outline" : "default"}
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          {product.variants && product.variants.length > 0 ? "অপশন দেখুন" : t_card.addToBag}
        </Button>
      </CardFooter>
    </Card>

    {/* Quick View Dialog with scrolling enabled */}
    <Dialog open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen}>
        <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-2 border-primary/10 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex-grow overflow-y-auto">
                <div className="flex flex-col">
                    <div className="relative aspect-[16/9] w-full border-b bg-muted">
                        <Image 
                            src={product.images[0]?.imageUrl || 'https://placehold.co/600x400'} 
                            alt={product.name} 
                            fill 
                            className="object-cover"
                        />
                        <div className="absolute top-4 right-4 z-10">
                            <Button 
                                variant="secondary" 
                                size="icon" 
                                className="rounded-full bg-background/80 backdrop-blur-sm h-8 w-8" 
                                onClick={() => setIsQuickViewOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        {flashDeal && <Badge variant="destructive" className="absolute top-4 left-4 text-xs font-bold px-3 py-1">SALE</Badge>}
                    </div>
                    
                    <div className="p-6 sm:p-8 space-y-6 bg-background">
                        <div className="space-y-1">
                            <h2 className="text-2xl sm:text-3xl font-black font-headline leading-tight">{product.name}</h2>
                            <p className="text-primary font-black text-2xl sm:text-3xl mt-2">{currentPrice.toFixed(2)} BDT</p>
                        </div>

                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {product.description}
                        </p>

                        {product.variants && product.variants.length > 0 && (
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block">পছন্দসই ওজন/সাইজ বেছে নিন:</Label>
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((v, i) => (
                                        <Button 
                                            key={i} 
                                            variant={selectedVariant?.unit === v.unit ? 'default' : 'outline'}
                                            size="sm"
                                            className={cn(
                                                "h-11 rounded-xl px-4 border-2 transition-all font-bold", 
                                                selectedVariant?.unit === v.unit ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
                                            )}
                                            onClick={() => setSelectedVariant(v)}
                                        >
                                            {v.unit} - {v.price} BDT
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                            <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-2xl border-2 w-full sm:w-auto justify-between sm:justify-start">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-10 w-10 rounded-xl hover:bg-background" 
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-10 text-center font-black text-lg">{quantity}</span>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-10 w-10 rounded-xl hover:bg-background" 
                                    onClick={() => setQuantity(q => q + 1)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button 
                                className="w-full sm:flex-grow h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 transition-all active:scale-95 group"
                                onClick={handleAddToCart}
                                disabled={currentStock <= 0}
                            >
                                <ShoppingBag className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" /> 
                                {t_card.addToBag}
                            </Button>
                        </div>
                        
                        <div className="pt-2 flex items-center justify-between pb-4">
                            {currentStock > 0 ? (
                                <p className="text-xs text-green-500 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                                    <CheckCircle2 className="h-4 w-4" /> ইন-স্টক ({currentStock} টি উপলব্ধ)
                                </p>
                            ) : (
                                <p className="text-xs text-destructive flex items-center gap-1.5 font-bold uppercase tracking-wider">
                                    <X className="h-4 w-4" /> স্টক আউট
                                </p>
                            )}
                            <Link 
                                href={productUrl} 
                                className="text-xs text-muted-foreground hover:text-primary underline underline-offset-4 font-bold"
                                onClick={() => setIsQuickViewOpen(false)}
                            >
                                আরও বিস্তারিত দেখুন
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
    </>
  );
}
