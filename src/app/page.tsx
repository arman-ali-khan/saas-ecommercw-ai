import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getProducts } from '@/lib/products';
import ProductCard from '@/components/product-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, Leaf } from 'lucide-react';

export default function Home() {
  const featuredProducts = getProducts().slice(0, 3);
  const heroImage = PlaceHolderImages.find((img) => img.id === 'home-hero');
  const aboutImage = PlaceHolderImages.find(
    (img) => img.id === 'about-traceability'
  );

  return (
    <div className="space-y-16">
      <section className="relative h-[50vh] md:h-[60vh] -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative h-full flex flex-col items-center justify-center text-center text-white p-4">
          <h1 className="text-4xl md:text-6xl font-headline font-bold drop-shadow-lg">
            The True Taste of Nature
          </h1>
          <p className="mt-4 max-w-2xl text-lg md:text-xl drop-shadow-md">
            Discover the finest natural products from the heart of Bangladesh.
            Pure, authentic, and delivered to your door.
          </p>
          <Button asChild className="mt-8" size="lg">
            <Link href="/products">
              Shop All Products <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-headline font-bold text-center mb-8">
          Featured Products
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section>
        <Card className="overflow-hidden md:grid md:grid-cols-2 md:gap-8 items-center">
          <div className="p-8 md:p-12">
            <CardHeader>
              <Leaf className="w-12 h-12 text-accent" />
              <CardTitle className="font-headline text-3xl mt-4">
                From Our Land, To Your Home
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                We are committed to bringing you products that are as natural as
                the land they come from. Learn about our story, our process, and
                our promise of quality and traceability.
              </p>
              <Button asChild variant="secondary">
                <Link href="/about">
                  Our Story & Traceability{' '}
                  <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </CardContent>
          </div>
          <div className="h-64 md:h-full w-full relative">
            {aboutImage && (
              <Image
                src={aboutImage.imageUrl}
                alt={aboutImage.description}
                data-ai-hint={aboutImage.imageHint}
                fill
                className="object-cover"
              />
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
