
'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { useCart } from '@/stores/cart';
import { useToast } from '@/hooks/use-toast';
import {
  Facebook,
  Twitter,
  ShoppingBag,
  Plus,
  Minus,
  Wand2,
  Star,
  CheckCircle,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Maximize2,
  X,
  Share2,
} from 'lucide-react';
import { AiShareTool } from '@/components/ai-share-tool';
import { Separator } from '@/components/ui/separator';
import type { Product, FlashDeal, ProductReview, ProductQna, ProductVariant } from '@/types';
import { cn } from '@/lib/utils';
import RichTextRenderer from '@/components/saas-page-renderer';
import { supabase } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import Countdown from '@/components/countdown';
import ProductCard from '@/components/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useTranslation } from '@/hooks/use-translation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const ProductImageZoom = ({ src, alt }: { src: string; alt: string }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showZoom, setShowZoom] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setPosition({ x, y });
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden cursor-zoom-in rounded-lg"
      onMouseEnter={() => setShowZoom(true)}
      onMouseLeave={() => setShowZoom(false)}
      onMouseMove={handleMouseMove}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
          "object-cover transition-transform duration-300 ease-out",
          showZoom ? "scale-[2.5]" : "scale-100"
        )}
        style={{
          transformOrigin: `${position.x}% ${position.y}%`,
        }}
        sizes="(max-width: 768px) 100vw, 50vw"
        priority
      />
    </div>
  );
};

const reviewSchema = z.object({
  rating: z.number().min(1, { message: 'Please select a rating.' }).max(5),
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }).optional().or(z.literal('')),
  review_text: z.string().min(10, { message: 'Review must be at least 10 characters.'}),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

const ReviewForm = ({ product, onReviewSubmitted, setDialogOpen }: { product: Product, onReviewSubmitted: () => void, setDialogOpen: (open: boolean) => void }) => {
    const { customer } = useCustomerAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const t = useTranslation();
    const { productPage: t_product } = t;

    const form = useForm<ReviewFormData>({
        resolver: zodResolver(reviewSchema),
        defaultValues: { rating: 0, title: '', review_text: '' },
    });

    if (!customer) {
        return (
            <div className="text-center p-8">
                <p className="text-muted-foreground">{t_product.loginToReview}</p>
                <Button asChild className="mt-4"><Link href="/login">লগইন করুন</Link></Button>
            </div>
        );
    }

    const onSubmit = async (data: ReviewFormData) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/reviews/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteId: product.site_id,
                    product_id: product.id,
                    customer_id: customer.id,
                    customer_name: customer.full_name,
                    ...data,
                    is_approved: false
                }),
            });

            if (!response.ok) {
                const res = await response.json();
                throw new Error(res.error || 'Failed to submit review');
            }

            toast({ title: 'Review submitted for approval!' });
            form.reset();
            onReviewSubmitted();
            setDialogOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t_product.yourRating}</FormLabel>
                        <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={cn( "h-7 w-7 cursor-pointer transition-colors", field.value >= star ? "text-primary fill-primary" : "text-muted-foreground/30" )}
                                onClick={() => field.onChange(star)}
                            />
                        ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>{t_product.reviewTitle}</FormLabel><FormControl><Input {...field} placeholder={t_product.reviewTitlePlaceholder} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="review_text" render={({ field }) => (<FormItem><FormLabel>{t_product.yourReview}</FormLabel><FormControl><Textarea {...field} placeholder={t_product.reviewPlaceholder} rows={4} /></FormControl><FormMessage /></FormItem>)} />
                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t_product.submitReview}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
};

const qnaSchema = z.object({
  question: z.string().min(10, { message: 'Question must be at least 10 characters.' }),
});

type QnaFormData = z.infer<typeof qnaSchema>;

const QnaForm = ({ product, onQuestionSubmitted, setDialogOpen }: { product: Product, onQuestionSubmitted: () => void, setDialogOpen: (open: boolean) => void }) => {
    const { customer } = useCustomerAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const t = useTranslation();
    const { productPage: t_product } = t;

    const form = useForm<QnaFormData>({
        resolver: zodResolver(qnaSchema),
        defaultValues: { question: '' },
    });

    if (!customer) {
       return (
            <div className="text-center p-8">
                <p className="text-muted-foreground">{t_product.loginToAsk}</p>
                <Button asChild className="mt-4"><Link href="/login">লগইন করুন</Link></Button>
            </div>
        );
    }

    const onSubmit = async (data: QnaFormData) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/qna/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteId: product.site_id,
                    product_id: product.id,
                    customer_id: customer.id,
                    customer_name: customer.full_name,
                    question: data.question,
                    is_approved: false
                }),
            });

            if (!response.ok) {
                const res = await response.json();
                throw new Error(res.error || 'Failed to submit question');
            }

            toast({ title: 'Question submitted!', description: 'Your question will be visible once it has been answered.' });
            form.reset();
            onQuestionSubmitted();
            setDialogOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="question"
                    render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <Textarea {...field} placeholder={t_product.questionPlaceholder} rows={3} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t_product.submitQuestion}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    )
}

export default function ProductClientPage({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const addToCart = useCart((state) => state.addToCart);
  const { toast } = useToast();
  const t = useTranslation();
  const { productPage: t_product, toast: t_toast } = t;

  const [mainApi, setMainApi] = useState<CarouselApi>();
  const [thumbApi, setThumbApi] = useState<CarouselApi>();
  const [selectedSnap, setSelectedSnap] = useState(0);

  const [shareUrl, setShareUrl] = useState('');
  const [flashDeal, setFlashDeal] = useState<FlashDeal | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [qna, setQna] = useState<ProductQna[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isLoadingQna, setIsLoadingQna] = useState(true);
  const [qnaSearch, setQnaSearch] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);

  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [isQnaFormOpen, setIsQnaFormOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<any>(null);

  const fetchReviews = useCallback(async () => {
    setIsLoadingReviews(true);
    try {
        const response = await fetch('/api/reviews/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: product.site_id }),
        });
        const result = await response.json();
        if (response.ok) {
            const productReviews = (result.reviews || []).filter((r: any) => r.product_id === product.id && r.is_approved);
            setReviews(productReviews);
        }
    } catch (error) { console.error(error); }
    setIsLoadingReviews(false);
  }, [product.id, product.site_id]);
  
  const fetchQna = useCallback(async () => {
    setIsLoadingQna(true);
    try {
        const response = await fetch('/api/qna/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: product.site_id }),
        });
        const result = await response.json();
        if (response.ok) {
            const productQna = (result.qna || []).filter((q: any) => q.product_id === product.id && q.is_approved);
            setQna(productQna);
        }
    } catch (error) { console.error(error); }
    setIsLoadingQna(false);
  }, [product.id, product.site_id]);

  useEffect(() => {
    setShareUrl(window.location.href);

    const fetchAdditionalData = async () => {
        // Fetch Site Theme/Settings
        const { data: profile } = await supabase.from('profiles').select('active_theme_id, site_name').eq('id', product.site_id).single();
        if (profile?.active_theme_id) {
            const { data: theme } = await supabase.from('store_themes').select('*').eq('id', profile.active_theme_id).single();
            setSiteSettings(theme);
        }

        // Fetch Flash Deal
        try {
            const fdRes = await fetch('/api/flash-deals/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: product.site_id }),
            });
            const fdResult = await fdRes.json();
            if (fdRes.ok) {
                const now = new Date().toISOString();
                const activeDeal = (fdResult.deals || []).find((d: any) => 
                    d.product_id === product.id && d.is_active && d.end_date > now
                );
                if (activeDeal) setFlashDeal(activeDeal);
            }
        } catch (e) { console.error(e); }

        // Fetch Related Products
        try {
            setIsLoadingRelated(true);
            const pRes = await fetch('/api/products/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: product.site_id }),
            });
            const pResult = await pRes.json();
            if (pRes.ok) {
                const filtered = (pResult.products || []).filter((p: Product) => 
                    p.id !== product.id && p.categories?.some(cat => product.categories?.includes(cat))
                ).slice(0, 4);
                setRelatedProducts(filtered);
            }
        } catch (e) { console.error(e); }
        setIsLoadingRelated(false);
    };

    fetchAdditionalData();
    fetchReviews();
    fetchQna();
  }, [product.id, product.categories, product.site_id, fetchReviews, fetchQna]);

  const onThumbClick = useCallback((index: number) => mainApi?.scrollTo(index), [mainApi]);

  const onSelect = useCallback(() => {
    if (!mainApi || !thumbApi) return;
    const selected = mainApi.selectedScrollSnap();
    setSelectedSnap(selected);
    thumbApi.scrollTo(selected);
  }, [mainApi, thumbApi]);

  useEffect(() => {
    if (!mainApi) return;
    onSelect();
    mainApi.on('select', onSelect);
    mainApi.on('reInit', onSelect);
    return () => {
      mainApi.off('select', onSelect);
      mainApi.off('reInit', onSelect);
    };
  }, [mainApi, onSelect]);

  const handleAddToCart = () => {
    let productToAdd = { ...product };
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
  };

  const displayPrice = selectedVariant ? selectedVariant.price : (flashDeal ? flashDeal.discount_price : product.price);
  const currentStock = selectedVariant ? selectedVariant.stock : (product.stock || 0);
  const pageDesign = siteSettings?.product_page_design || 'v1';

  let longDescContent: any = null;
  if (product.long_description) {
    try {
      longDescContent = JSON.parse(product.long_description);
    } catch (e) {
      longDescContent = { type: 'doc', content: [ { type: 'paragraph', content: [ { type: 'text', text: product.long_description } ] } ] };
    }
  }

  // --- V2 DESIGN: CENTERED & MOBILE OPTIMIZED ---
  if (pageDesign === 'v2') {
      return (
          <div className="space-y-12">
              <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
                  <Badge variant="outline" className="px-6 py-1 rounded-full uppercase tracking-widest text-[10px] font-black border-primary text-primary">Product Details</Badge>
                  <h1 className="text-4xl sm:text-6xl font-black font-headline tracking-tighter leading-tight">{product.name}</h1>
                  <p className="text-xl text-muted-foreground leading-relaxed italic">"{product.description}"</p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-start">
                  <div className="space-y-4">
                    <div className="relative aspect-square rounded-[3rem] overflow-hidden border-4 border-primary/5 shadow-2xl bg-muted">
                        {product.images?.[0] && <Image src={product.images[0].imageUrl} alt={product.name} fill className="object-cover" />}
                        {flashDeal && <Badge variant="destructive" className="absolute top-8 left-8 h-10 px-6 text-lg font-black rounded-full shadow-2xl">SALE</Badge>}
                    </div>
                    {product.images && product.images.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-4 px-2">
                            {product.images.map((img, i) => (
                                <div key={i} className="relative h-24 w-24 rounded-2xl overflow-hidden border-2 border-primary/10 shrink-0 cursor-pointer hover:border-primary transition-all">
                                    <Image src={img.imageUrl} alt={product.name} fill className="object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                  </div>

                  <div className="p-10 rounded-[3rem] border-2 bg-card/50 backdrop-blur-sm shadow-xl space-y-8">
                      <div className="flex justify-between items-end">
                          <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Price</p>
                              <p className="text-5xl font-black text-primary drop-shadow-sm">{displayPrice.toFixed(2)} <span className="text-lg">BDT</span></p>
                          </div>
                          {currentStock > 0 ? <Badge className="bg-green-500 text-white font-black">IN STOCK</Badge> : <Badge variant="destructive">OUT OF STOCK</Badge>}
                      </div>

                      {product.variants && product.variants.length > 0 && (
                        <div className="space-y-4">
                            <Label className="font-black uppercase tracking-widest text-xs">Choose Option:</Label>
                            <div className="flex flex-wrap gap-2">
                                {product.variants.map((v, i) => (
                                    <Button key={i} variant={selectedVariant?.unit === v.unit ? 'default' : 'outline'} className="h-12 px-6 rounded-2xl border-2" onClick={() => setSelectedVariant(v)}>{v.unit}</Button>
                                ))}
                            </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2 bg-background p-2 rounded-2xl border-2 shadow-inner">
                              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10" onClick={() => setQuantity(q => Math.max(1, q-1))}><Minus className="h-4 w-4"/></Button>
                              <span className="flex-1 text-center font-black text-xl">{quantity}</span>
                              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10" onClick={() => setQuantity(q => q+1)}><Plus className="h-4 w-4"/></Button>
                          </div>
                          <Button size="lg" className="h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20" onClick={handleAddToCart} disabled={currentStock <= 0}>
                              <ShoppingBag className="mr-2 h-5 w-5" /> {t_product.addToBag}
                          </Button>
                      </div>

                      <div className="pt-6 border-t space-y-4">
                          <h4 className="font-black uppercase tracking-widest text-xs text-muted-foreground">Share Product:</h4>
                          <div className="flex gap-3">
                              <Button variant="outline" size="icon" className="rounded-full h-12 w-12 border-2"><Share2 className="h-5 w-5"/></Button>
                              <Button variant="secondary" className="rounded-full px-8 h-12 font-black" onClick={() => setIsAiModalOpen(true)}><Wand2 className="h-4 w-4 mr-2"/> AI SMART SHARE</Button>
                          </div>
                      </div>
                  </div>
              </div>

              {longDescContent && (
                  <Card className="rounded-[3rem] border-2 shadow-2xl overflow-hidden mt-20">
                      <CardHeader className="bg-primary p-10 text-white"><CardTitle className="text-3xl font-black">Explore Detailed Info</CardTitle></CardHeader>
                      <CardContent className="p-10 lg:p-20 prose dark:prose-invert max-w-full">
                          <RichTextRenderer content={longDescContent} />
                      </CardContent>
                  </Card>
              )}
              
              <AiShareTool product={product} siteName={product.name} open={isAiModalOpen} onOpenChange={setIsAiModalOpen} />
          </div>
      )
  }

  return (
    <div className="pb-20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div className="space-y-4">
                <Carousel className="w-full relative" setApi={setMainApi}>
                <CarouselContent>
                    {images.map((image, index) => (
                    <CarouselItem key={index}>
                        <div className="w-full h-[50vh] rounded-lg overflow-hidden shadow-lg relative">
                        <ProductImageZoom
                            src={image.imageUrl}
                            alt={`${product.name} image ${index + 1}`}
                        />
                        {flashDeal && <Badge variant="destructive" className="absolute top-4 left-4 text-base">SALE</Badge>}
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                {images.length > 1 && (
                    <>
                    <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 sm:h-10 sm:w-10" />
                    <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 sm:h-10 sm:w-10" />
                    </>
                )}
                </Carousel>

                {images.length > 1 && (
                <Carousel
                    setApi={setThumbApi}
                    opts={{ align: 'start', containScroll: 'keepSnaps', dragFree: true }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-2">
                    {images.map((image, index) => (
                        <CarouselItem
                        key={index}
                        onClick={() => onThumbClick(index)}
                        className="pl-2 basis-1/4 cursor-pointer"
                        >
                        <div
                            className={cn(
                            'relative aspect-square w-full rounded-md overflow-hidden ring-offset-background transition-all',
                            selectedSnap === index
                                ? 'ring-2 ring-primary ring-offset-2'
                                : 'opacity-60 hover:opacity-100'
                            )}
                        >
                            <Image src={image.imageUrl} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
                        </div>
                        </CarouselItem>
                    ))}
                    </CarouselContent>
                </Carousel>
                )}
            </div>

            <div className="flex flex-col">
                <h1 className="text-4xl font-headline font-bold">{product.name}</h1>
                
                {flashDeal && !selectedVariant && (
                    <div className='mt-4 space-y-2'>
                        <p className="text-lg font-semibold text-muted-foreground line-through">
                            {product.price.toFixed(2)} {product.currency}
                        </p>
                        <div className="text-sm"><Countdown endDate={flashDeal.end_date} /></div>
                    </div>
                )}

                <p className="text-3xl font-black text-primary mt-2">
                    {displayPrice.toFixed(2)} {product.currency}
                </p>

                {product.variants && product.variants.length > 0 && (
                    <div className="mt-8 space-y-3">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">পছন্দসই সাইজ/ইউনিট বেছে নিন:</h3>
                        <div className="flex flex-wrap gap-2">
                            {product.variants.map((v, i) => (
                                <Button 
                                    key={i} 
                                    variant={selectedVariant?.unit === v.unit ? 'default' : 'outline'} 
                                    className={cn("h-12 px-6 rounded-xl border-2", selectedVariant?.unit === v.unit ? 'border-primary' : 'hover:border-primary/50')}
                                    onClick={() => setSelectedVariant(v)}
                                >
                                    {v.unit} - {v.price} {product.currency}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                <p className="text-lg text-muted-foreground mt-6 leading-relaxed">{product.description}</p>

                <div className="mt-4">
                    {currentStock > 0 ? (
                        <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/5">স্টক আছে ({currentStock} টি)</Badge>
                    ) : (
                        <Badge variant="destructive">স্টক আউট</Badge>
                    )}
                </div>

                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-2" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="h-5 w-5" /></Button>
                        <Input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 h-12 text-center text-lg font-bold rounded-xl border-2" />
                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-2" onClick={() => setQuantity(quantity + 1)}><Plus className="h-5 w-5" /></Button>
                    </div>
                    <Button size="lg" onClick={handleAddToCart} className="flex-grow h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20" disabled={currentStock <= 0}>
                        <ShoppingBag className="mr-2 h-5 w-5" /> {t_product.addToBag}
                    </Button>
                </div>

                <div className="mt-10 p-6 rounded-2xl bg-muted/30 border-2 border-dashed">
                    <h3 className="font-bold mb-3 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> {t_product.shareThisProduct}</h3>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" size="icon" className="rounded-full h-10 w-10"><Share2 className="h-5 w-5" /></Button>
                        <Button variant="secondary" onClick={() => setIsAiModalOpen(true)} className="rounded-full px-5 h-10 font-bold"><Wand2 className="h-4 w-4 mr-2" /> {t_product.aiShare}</Button>
                    </div>
                </div>
            </div>
        </div>
        
        {longDescContent && (
            <div className="mt-16">
                <Card className="rounded-[2rem] border-2 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="text-2xl font-headline font-bold">{t_product.productDetails}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 md:p-10">
                        <div className="prose dark:prose-invert max-w-full">
                            <RichTextRenderer content={longDescContent} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}
        
        <div className="mt-16 grid md:grid-cols-2 gap-12 items-start">
            <div>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-headline font-bold">{t_product.customerReviews}</h2>
                    <Button variant="outline" onClick={() => setIsReviewFormOpen(true)} className="rounded-xl">{t_product.leaveReview}</Button>
                </div>
                {isLoadingReviews ? <Skeleton className="h-40 w-full rounded-2xl" /> : (
                    reviews.length > 0 ? (
                        <div className="space-y-6">
                            {reviews.map(review => (
                                <Card key={review.id} className="rounded-2xl border-2">
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <Avatar><AvatarFallback>{review.customer_name.charAt(0)}</AvatarFallback></Avatar>
                                        <div>
                                            <h4 className="font-semibold">{review.customer_name}</h4>
                                            <div className="flex items-center gap-0.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={cn("h-3 w-3", i < review.rating ? "text-primary fill-primary" : "text-muted-foreground/30")} />
                                                ))}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground italic text-sm">"{review.review_text}"</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : <p className="text-muted-foreground text-center py-12 border-2 border-dashed rounded-2xl">{t_product.noReviews}</p>
                )}
            </div>

            <div>
                 <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-headline font-bold">{t_product.qna}</h2>
                    <Button variant="outline" onClick={() => setIsQnaFormOpen(true)} className="rounded-xl">{t_product.askQuestion}</Button>
                </div>
                 {isLoadingQna ? <Skeleton className="h-60 w-full rounded-2xl" /> : (
                    <div className="space-y-4">
                        {qna.length > 0 ? (
                            qna.map(item => (
                                <div key={item.id} className="p-4 rounded-2xl border-2 bg-muted/5 space-y-2">
                                    <p className="font-bold flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary" /> {item.question}</p>
                                    <div className="p-3 rounded-xl bg-card border text-sm italic">{item.answer || "এই প্রশ্নের উত্তর এখনো দেওয়া হয়নি।"}</div>
                                </div>
                            ))
                        ) : <p className="text-muted-foreground text-center py-12 border-2 border-dashed rounded-2xl">{t_product.noQna}</p>}
                    </div>
                )}
            </div>
        </div>

        <Dialog open={isReviewFormOpen} onOpenChange={setIsReviewFormOpen}>
            <DialogContent className="rounded-[2rem]"><DialogHeader><DialogTitle>{t_product.leaveReview}</DialogTitle></DialogHeader><ReviewForm product={product} onReviewSubmitted={fetchReviews} setDialogOpen={setIsReviewFormOpen} /></DialogContent>
        </Dialog>
        <Dialog open={isQnaFormOpen} onOpenChange={setIsQnaFormOpen}>
            <DialogContent className="rounded-[2rem]"><DialogHeader><DialogTitle>{t_product.askQuestion}</DialogTitle></DialogHeader><QnaForm product={product} onQuestionSubmitted={fetchQna} setDialogOpen={setIsQnaFormOpen} /></DialogContent>
        </Dialog>
        
        <AiShareTool product={product} siteName={product.name} open={isAiModalOpen} onOpenChange={setIsAiModalOpen} />
    </div>
  );
}
