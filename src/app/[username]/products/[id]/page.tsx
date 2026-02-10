'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import { getProductById } from '@/lib/products';
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
} from 'lucide-react';
import { AiShareTool } from '@/components/ai-share-tool';
import { Separator } from '@/components/ui/separator';
import type { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function generateMetadata({ params }: { params: { id: string, username: string } }): Promise<Metadata> {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
      },
    }
  );

  const { data: product } = await supabase
    .from('products')
    .select('name, description, images')
    .eq('id', params.id)
    .single<Pick<Product, 'name' | 'description' | 'images'>>();

  const { data: profile } = await supabase
    .from('profiles')
    .select('site_name')
    .eq('domain', params.username)
    .single();

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  const siteName = profile?.site_name || params.username;
  const title = `${product.name} | ${siteName}`;
  const description = product.description;
  const imageUrl = product.images?.[0]?.imageUrl;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}


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

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const addToCart = useCart((state) => state.addToCart);
  const { toast } = useToast();

  const [mainApi, setMainApi] = useState<CarouselApi>();
  const [thumbApi, setThumbApi] = useState<CarouselApi>();
  const [selectedSnap, setSelectedSnap] = useState(0);

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
    if (!id) return;
    const fetchProduct = async () => {
      setIsLoading(true);
      const fetchedProduct = await getProductById(id);
      if (fetchedProduct) {
        setProduct(fetchedProduct);
      } else {
        notFound();
      }
      setIsLoading(false);
    };
    fetchProduct();
  }, [id]);

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

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-4">
          <Skeleton className="w-full h-[50vh] rounded-lg" />
          <div className="flex gap-4">
            <Skeleton className="h-24 w-24 rounded-md" />
            <Skeleton className="h-24 w-24 rounded-md" />
            <Skeleton className="h-24 w-24 rounded-md" />
            <Skeleton className="h-24 w-24 rounded-md" />
          </div>
        </div>
        <div className="flex flex-col space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-20 w-full" />
          <Separator className="my-6" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-2/3" />
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 flex-grow" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast({
      title: 'ব্যাগে যোগ করা হয়েছে',
      description: `${quantity} x ${product.name} আপনার ব্যাগে যোগ করা হয়েছে।`,
    });
  };

  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://banglanaturals.example.com/products/${product.id}`;
  const shareText = `বাংলা ন্যাচারালস থেকে ${product.name} দেখুন!`;

  const images = product.images || [];

  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-12">
      <div className="space-y-4">
        <Carousel className="w-full" setApi={setMainApi}>
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={index}>
                <div className="relative w-full h-[50vh] rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src={image.imageUrl}
                    alt={`${product.name} image ${index + 1}`}
                    data-ai-hint={image.imageHint}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={index === 0}
                  />
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
        <p className="text-2xl font-semibold text-primary mt-2">
          {product.price.toFixed(2)} {product.currency}
        </p>
        <p className="text-lg text-muted-foreground mt-4">
          {product.long_description}
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
            <Button asChild variant="outline" size="icon">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  currentUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ফেসবুকে শেয়ার করুন"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </Button>
            <Button asChild variant="outline" size="icon">
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                  currentUrl
                )}&text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="টুইটারে শেয়ার করুন"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </Button>
            <Button variant="outline" size="icon" disabled>
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
