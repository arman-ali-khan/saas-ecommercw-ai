import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Sprout, Map, Heart } from 'lucide-react';

export default function AboutPage() {
  const storyImage = PlaceHolderImages.find((img) => img.id === 'about-story');
  const traceabilityImage = PlaceHolderImages.find(
    (img) => img.id === 'about-traceability'
  );

  return (
    <div className="space-y-16">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold">
          Our Connection to the Land
        </h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
          Bangla Naturals was born from a simple desire: to share the pure,
          unadulterated flavors of Bangladesh with the world, starting with our
          own community.
        </p>
      </div>

      <Card className="overflow-hidden md:grid md:grid-cols-2">
        <div className="p-8 md:p-12">
          <CardHeader>
            <Sprout className="w-12 h-12 text-accent" />
            <CardTitle className="font-headline text-3xl mt-4">
              Our Story
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              It all started in a small family orchard, with mango trees that
              have been nurtured for generations. We realized that the taste of
              a mango plucked straight from the tree, the richness of pure honey,
              and the smoky sweetness of fresh Nolen Gur were experiences that
              many in the city were missing out on.
            </p>
            <p>
              We decided to bridge that gap. We began partnering with local
              farmers and artisans who share our passion for quality and natural
              methods. Bangla Naturals is more than a brand; it&apos;s a
              community of growers, makers, and customers who appreciate the
              true taste of nature.
            </p>
          </CardContent>
        </div>
        <div className="relative h-80 md:h-full">
          {storyImage && (
            <Image
              src={storyImage.imageUrl}
              alt={storyImage.description}
              data-ai-hint={storyImage.imageHint}
              fill
              className="object-cover"
            />
          )}
        </div>
      </Card>

      <Card className="overflow-hidden md:grid md:grid-cols-2">
        <div className="relative h-80 md:h-full md:order-2">
          {traceabilityImage && (
            <Image
              src={traceabilityImage.imageUrl}
              alt={traceabilityImage.description}
              data-ai-hint={traceabilityImage.imageHint}
              fill
              className="object-cover"
            />
          )}
        </div>
        <div className="p-8 md:p-12 md:order-1">
          <CardHeader>
            <Map className="w-12 h-12 text-accent" />
            <CardTitle className="font-headline text-3xl mt-4">
              Our Promise of Traceability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              You deserve to know where your food comes from. We believe in
              complete transparency. For every product, we provide information
              about its origin, the community that grew it, and the journey it
              took to reach your home.
            </p>
            <p>
              This commitment ensures that you receive the highest quality
              products while also supporting the local communities and
              sustainable practices that make it all possible. It&apos;s a
              connection you can taste and trust.
            </p>
          </CardContent>
        </div>
      </Card>

      <div className="text-center">
        <Heart className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-3xl font-headline font-bold">
          Join Our Community
        </h2>
        <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
          When you choose Bangla Naturals, you&apos;re not just buying a
          product; you&apos;re becoming part of a story.
        </p>
      </div>
    </div>
  );
}
