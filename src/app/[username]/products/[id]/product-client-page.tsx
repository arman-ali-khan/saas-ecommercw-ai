
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'lucide-react';
import { AiShareTool } from '@/components/ai-share-tool';
import { Separator } from '@/components/ui/separator';
import type { Product, FlashDeal, ProductReview, ProductQna } from '@/types';
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


const TikTokIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12.52.02c1.31-.02 2.61.01 3.91.02.08 1.53.01 3.07.01 4.6 0 1.1.35 2.21 1.22 3.01.91.82 2.1 1.25 3.32 1.19.08 1.5.01 3 .01 4.5a5.42 5.42 0 0 1-5.12 5.14c-1.53.08-3.07.01-4.6.01-1.1 0-2.21-.35-3.01-1.22-.82-.91-1.25-2.1-1.19-3.32-.08-1.5-.01-3-.01-4.5a5.42 5.42 0 0 1 5.12-5.14Z"></path>
    <path d="M9 8.5h4"></path>
    <path d="M9 12.5h4"></path>
    <path d="M13.5 4.5v4"></path>
  </svg>
);

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
            
            // Create notification for admin
            await fetch('/api/notifications/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId: product.site_id,
                    recipientType: 'admin',
                    siteId: product.site_id,
                    message: `New review for "${product.name}" from ${customer.full_name}.`,
                    link: '/admin/reviews',
                }),
            });

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
            
            // Create notification for admin
            await fetch('/api/notifications/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId: product.site_id,
                    recipientType: 'admin',
                    siteId: product.site_id,
                    message: `New question for "${product.name}" from ${customer.full_name}.`,
                    link: '/admin/qna',
                }),
            });
            
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
    } catch (error) {
        console.error("Error fetching reviews", error);
    }
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
    } catch (error) {
        console.error("Error fetching Q&A:", error);
    }
    setIsLoadingQna(false);
  }, [product.id, product.site_id]);

  useEffect(() => {
    setShareUrl(window.location.href);

    const fetchAdditionalData = async () => {
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
                    d.product_id === product.id && 
                    d.is_active && 
                    d.end_date > now
                );
                if (activeDeal) setFlashDeal(activeDeal);
            }
        } catch (e) { console.error("Flash Deal fetch error", e); }

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
                    p.id !== product.id && 
                    p.categories?.some(cat => product.categories?.includes(cat))
                ).slice(0, 4);
                setRelatedProducts(filtered);
            }
        } catch (e) { console.error("Related products fetch error", e); }
        setIsLoadingRelated(false);
    };

    fetchAdditionalData();
    fetchReviews();
    fetchQna();
  }, [product.id, product.categories, product.site_id, fetchReviews, fetchQna]);

  const onThumbClick = useCallback(
    (index: number) => {
      if (!mainApi || !thumbApi) return;
      mainApi.scrollTo(index);
    },
    [mainApi, thumbApi]
  );

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

  if (!product) {
    return null;
  }

  let longDescContent: any = null;
  if (product.long_description) {
    try {
      longDescContent = JSON.parse(product.long_description);
    } catch (e) {
      longDescContent = {
        type: 'doc',
        content: [ { type: 'paragraph', content: [ { type: 'text', text: product.long_description, },], },],
      };
    }
  }

  const handleAddToCart = () => {
    const productWithDealPrice = flashDeal
      ? { ...product, price: flashDeal.discount_price }
      : product;
    addToCart(productWithDealPrice, quantity);
    toast({
      title: t_toast.addedToBag,
      description: t_toast.addedToBagDesc.replace('{quantity}', quantity.toString()).replace('{productName}', product.name),
    });
  };

  const shareText = `Check out ${product.name} from this store!`;
  const images = product.images || [];
  const displayPrice = flashDeal ? flashDeal.discount_price : product.price;

  const filteredQna = useMemo(() => 
    qna.filter(item => 
        item.question.toLowerCase().includes(qnaSearch.toLowerCase()) ||
        item.answer?.toLowerCase().includes(qnaSearch.toLowerCase())
    ), [qna, qnaSearch]);

  return (
    <div>
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div className="space-y-4">
                <Carousel className="w-full" setApi={setMainApi}>
                <CarouselContent>
                    {images.map((image, index) => (
                    <CarouselItem key={index}>
                        <div className="w-full h-[50vh] rounded-lg overflow-hidden shadow-lg relative">
                        <Image
                            src={image.imageUrl}
                            alt={`${product.name} image ${index + 1}`}
                            fill
                            className="object-cover"
                        />
                        {flashDeal && <Badge variant="destructive" className="absolute top-4 left-4 text-base">SALE</Badge>}
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                {images.length > 1 && (
                    <>
                    <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
                    <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
                    </>
                )}
                </Carousel>

                {images.length > 1 && (
                <Carousel
                    setApi={setThumbApi}
                    opts={{
                    align: 'start',
                    containScroll: 'keepSnaps',
                    dragFree: true,
                    }}
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
                            <Image
                            src={image.imageUrl}
                            alt={`Thumbnail ${index + 1}`}
                            fill
                            className="object-cover"
                            />
                        </div>
                        </CarouselItem>
                    ))}
                    </CarouselContent>
                </Carousel>
                )}
            </div>

            <div className="flex flex-col">
                <h1 className="text-4xl font-headline font-bold">{product.name}</h1>
                {flashDeal && (
                    <div className='mt-4 space-y-2'>
                        <p className="text-lg font-semibold text-muted-foreground line-through">
                            {product.price.toFixed(2)} {product.currency}
                        </p>
                        <div className="text-sm">
                        <Countdown endDate={flashDeal.end_date} />
                        </div>
                    </div>
                )}
                <p className="text-2xl font-semibold text-primary mt-1">
                {displayPrice.toFixed(2)} {product.currency}
                </p>

                <p className="text-lg text-muted-foreground mt-4">
                {product.description}
                </p>

                <Separator className="my-6" />

                <div className="space-y-4">
                <p>
                    <span className="font-semibold">{t_product.origin}:</span> {product.origin}
                </p>
                <p>
                    <span className="font-semibold">{t_product.story}:</span> {product.story}
                </p>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                    <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    >
                    <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-16 text-center"
                    min="1"
                    />
                    <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                    >
                    <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <Button size="lg" onClick={handleAddToCart} className="flex-grow">
                    <ShoppingBag className="mr-2 h-5 w-5" /> {t_product.addToBag}
                </Button>
                </div>

                <div className="mt-8">
                <h3 className="font-semibold mb-2">{t_product.shareThisProduct}</h3>
                <div className="flex gap-2">
                    <Button asChild variant="outline" size="icon" disabled={!shareUrl}>
                    <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                        shareUrl
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Share on Facebook"
                    >
                        <Facebook className="h-5 w-5" />
                    </a>
                    </Button>
                    <Button asChild variant="outline" size="icon" disabled={!shareUrl}>
                    <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                        shareUrl
                        )}&text=${encodeURIComponent(shareText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Share on Twitter"
                    >
                        <Twitter className="h-5 w-5" />
                    </a>
                    </Button>
                    <Button variant="outline" size="icon" disabled aria-label="Share on TikTok">
                    <TikTokIcon />
                    </Button>
                    <Button
                    variant="outline"
                    onClick={() => setIsAiModalOpen(true)}
                    className="px-3"
                    >
                    <Wand2 className="h-5 w-5 mr-2" />
                    {t_product.aiShare}
                    </Button>
                </div>
                </div>
            </div>
        </div>
        
        {longDescContent && (
            <div className="mt-16">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-headline font-bold">{t_product.productDetails}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            <div
                                className={cn(
                                    'prose dark:prose-invert max-w-full transition-all duration-300 overflow-hidden',
                                    !isDescriptionExpanded ? 'max-h-32' : 'max-h-none'
                                )}
                            >
                                <RichTextRenderer content={longDescContent} />
                            </div>
                            {!isDescriptionExpanded && (
                               <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                            )}
                        </div>
                        <Button
                            variant="link"
                            className="mt-2 px-0 text-primary hover:text-primary/80"
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        >
                            {isDescriptionExpanded ? (
                                <>
                                    {t_product.seeLess} <ChevronUp className="ml-1 h-4 w-4" />
                                </>
                            ) : (
                                <>
                                    {t_product.seeMore} <ChevronDown className="ml-1 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )}
        
        <div className="mt-16 grid md:grid-cols-2 gap-12 items-start">
            <div>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-headline font-bold">{t_product.customerReviews}</h2>
                    <Dialog open={isReviewFormOpen} onOpenChange={setIsReviewFormOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">{t_product.leaveReview}</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t_product.leaveReview}</DialogTitle>
                            </DialogHeader>
                            <ReviewForm product={product} onReviewSubmitted={fetchReviews} setDialogOpen={setIsReviewFormOpen} />
                        </DialogContent>
                    </Dialog>
                </div>
                {isLoadingReviews ? <Skeleton className="h-40 w-full" /> : (
                    reviews.length > 0 ? (
                        <div className="space-y-6">
                            {reviews.map(review => (
                                <Card key={review.id}>
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className={cn("h-5 w-5", i < review.rating ? "text-primary fill-primary" : "text-muted-foreground/30")} />
                                            ))}
                                        </div>
                                        <h4 className="font-semibold">{review.title}</h4>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground italic">"{review.review_text}"</p>
                                        <p className="text-sm font-semibold mt-4">- {review.customer_name}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : <p className="text-muted-foreground text-center py-8">{t_product.noReviews}</p>
                )}
            </div>

            <div>
                 <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-headline font-bold">{t_product.qna}</h2>
                    <Dialog open={isQnaFormOpen} onOpenChange={setIsQnaFormOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">{t_product.askQuestion}</Button>
                        </DialogTrigger>
                        <DialogContent>
                             <DialogHeader>
                                <DialogTitle>{t_product.askQuestion}</DialogTitle>
                            </DialogHeader>
                            <QnaForm product={product} onQuestionSubmitted={fetchQna} setDialogOpen={setIsQnaFormOpen} />
                        </DialogContent>
                    </Dialog>
                </div>
                 {isLoadingQna ? <Skeleton className="h-60 w-full" /> : (
                    <>
                        <Input 
                            placeholder={t_product.searchQna}
                            value={qnaSearch}
                            onChange={(e) => setQnaSearch(e.target.value)}
                            className="mb-6"
                        />
                        {filteredQna.length > 0 ? (
                            <Accordion type="single" collapsible className="w-full space-y-4">
                                {filteredQna.map(item => (
                                    <AccordionItem value={item.id} key={item.id} className="border rounded-lg bg-muted/20">
                                        <AccordionTrigger className="text-left font-semibold p-4 hover:no-underline">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-background rounded-full p-2 mt-1">
                                                    <HelpCircle className="h-5 w-5 text-primary"/>
                                                </div>
                                                <div>
                                                    {item.question}
                                                    <p className="text-xs text-muted-foreground font-normal mt-1">Asked by {item.customer_name}</p>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 pt-0 pl-14">
                                            <p className="text-foreground/80">{item.answer}</p>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">{t_product.noQna}</p>
                        )}
                    </>
                )}
            </div>
        </div>

        <div className="mt-16">
            <h2 className="text-3xl font-headline font-bold mb-8">{t_product.relatedProducts}</h2>
            {isLoadingRelated ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-56 w-full" />
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                </div>
            ) : relatedProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
                    {relatedProducts.map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground">{t_product.noRelated}</p>
            )}
        </div>
        
        {product && (
            <AiShareTool
            product={product}
            open={isAiModalOpen}
            onOpenChange={setIsAiModalOpen}
            />
        )}
    </div>
  );
}
