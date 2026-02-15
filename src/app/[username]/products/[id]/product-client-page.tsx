
'use client';
import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { AiShareTool } from '@/components/ai-share-tool';
import { Separator } from '@/components/ui/separator';
import type { Product, FlashDeal, ProductReview } from '@/types';
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Link from 'next/link';

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

const ReviewForm = ({ product, onReviewSubmitted }: { product: Product, onReviewSubmitted: () => void }) => {
    const { customer } = useCustomerAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ReviewFormData>({
        resolver: zodResolver(reviewSchema),
        defaultValues: { rating: 0, title: '', review_text: '' },
    });

    if (!customer) {
        return <p className="text-sm text-muted-foreground">Please <Link href="/login" className="underline">log in</Link> to leave a review.</p>;
    }

    const onSubmit = async (data: ReviewFormData) => {
        setIsSubmitting(true);
        const { error } = await supabase.from('product_reviews').insert({
            site_id: product.site_id,
            product_id: product.id,
            customer_id: customer.id,
            customer_name: customer.full_name,
            ...data
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to submit review', description: error.message });
        } else {
            toast({ title: 'Review submitted for approval!' });
            form.reset();
            onReviewSubmitted();
        }
        setIsSubmitting(false);
    };

    return (
        <Card>
            <CardHeader><h4 className="font-semibold">Leave a Review</h4></CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                         <FormField
                            control={form.control}
                            name="rating"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Your Rating</FormLabel>
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
                        <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Review Title</FormLabel><FormControl><Input {...field} placeholder="e.g., Best mangoes ever!" /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="review_text" render={({ field }) => (<FormItem><FormLabel>Your Review</FormLabel><FormControl><Textarea {...field} placeholder="What did you like or dislike?" rows={4} /></FormControl><FormMessage /></FormItem>)} />
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Review
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default function ProductClientPage({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const addToCart = useCart((state) => state.addToCart);
  const { toast } = useToast();

  const [mainApi, setMainApi] = useState<CarouselApi>();
  const [thumbApi, setThumbApi] = useState<CarouselApi>();
  const [selectedSnap, setSelectedSnap] = useState(0);

  const [shareUrl, setShareUrl] = useState('');
  const [flashDeal, setFlashDeal] = useState<FlashDeal | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);

  const fetchReviews = useCallback(async () => {
    setIsLoadingReviews(true);
    const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', product.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
    if(error) {
      console.error("Error fetching reviews", error);
    } else {
      setReviews(data as ProductReview[]);
    }
    setIsLoadingReviews(false);
  }, [product.id]);

  useEffect(() => {
    setShareUrl(window.location.href);

    const fetchFlashDeal = async () => {
        const { data } = await supabase
            .from('flash_deals')
            .select('*')
            .eq('product_id', product.id)
            .eq('is_active', true)
            .gt('end_date', new Date().toISOString())
            .single();
        if (data) {
            setFlashDeal(data as FlashDeal);
        }
    }
    
    const fetchRelatedProducts = async () => {
        if (!product.categories || product.categories.length === 0) {
            setIsLoadingRelated(false);
            return;
        }

        setIsLoadingRelated(true);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('site_id', product.site_id)
            .overlaps('categories', product.categories)
            .neq('id', product.id)
            .limit(4);

        if (error) {
            console.error("Error fetching related products:", error);
        } else {
            setRelatedProducts(data as Product[]);
        }
        setIsLoadingRelated(false);
    }

    fetchFlashDeal();
    fetchRelatedProducts();
    fetchReviews();
  }, [product.id, product.categories, product.site_id, fetchReviews]);

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
      title: 'ব্যাগে যোগ করা হয়েছে',
      description: `${quantity} x ${product.name} আপনার ব্যাগে যোগ করা হয়েছে।`,
    });
  };

  const shareText = `বাংলা ন্যাচারালস থেকে ${product.name} দেখুন!`;
  const images = product.images || [];
  const displayPrice = flashDeal ? flashDeal.discount_price : product.price;

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
                    <span className="font-semibold">উৎপত্তি:</span> {product.origin}
                </p>
                <p>
                    <span className="font-semibold">আমাদের গল্প:</span> {product.story}
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
                    <ShoppingBag className="mr-2 h-5 w-5" /> ব্যাগে যোগ করুন
                </Button>
                </div>

                <div className="mt-8">
                <h3 className="font-semibold mb-2">এই পণ্যটি শেয়ার করুন:</h3>
                <div className="flex gap-2">
                    <Button asChild variant="outline" size="icon" disabled={!shareUrl}>
                    <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                        shareUrl
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="ফেসবুকে শেয়ার করুন"
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
                        aria-label="টুইটারে শেয়ার করুন"
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
                    এআই শেয়ার
                    </Button>
                </div>
                </div>
                
                {longDescContent && (
                <div className="mt-8 pt-8 border-t">
                    <h3 className="text-2xl font-headline font-bold mb-4">পণ্যের বিবরণ</h3>
                    <RichTextRenderer content={longDescContent} />
                </div>
                )}

            </div>
        </div>
        
        <div className="mt-16">
            <h2 className="text-3xl font-headline font-bold mb-8">Customer Reviews</h2>
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
                ) : <p className="text-muted-foreground">No reviews for this product yet.</p>
            )}
            <div className="mt-12">
                <ReviewForm product={product} onReviewSubmitted={fetchReviews} />
            </div>
        </div>

        <div className="mt-16">
            <h2 className="text-3xl font-headline font-bold mb-8">Related Products</h2>
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
                <p className="text-muted-foreground">No related products found.</p>
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

    