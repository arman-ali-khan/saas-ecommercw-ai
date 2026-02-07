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
          জমির সাথে আমাদের সংযোগ
        </h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
          বাংলা ন্যাচারালস-এর জন্ম একটি সাধারণ ইচ্ছা থেকে: বাংলাদেশের খাঁটি,
          বিশুদ্ধ স্বাদ বিশ্বের কাছে পৌঁছে দেওয়া, যা আমাদের নিজস্ব সম্প্রদায়
          থেকে শুরু হয়েছে।
        </p>
      </div>

      <Card className="overflow-hidden md:grid md:grid-cols-2">
        <div className="p-8 md:p-12">
          <CardHeader>
            <Sprout className="w-12 h-12 text-accent" />
            <CardTitle className="font-headline text-3xl mt-4">
              আমাদের গল্প
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              সব শুরু হয়েছিল একটি ছোট পারিবারিক বাগানে, যেখানে আম গাছগুলো
              প্রজন্মের পর প্রজন্ম ধরে লালিত-পালিত হয়ে আসছে। আমরা বুঝতে
              পেরেছিলাম যে গাছ থেকে সরাসরি পেড়ে আনা আমের স্বাদ, খাঁটি মধুর
              সমৃদ্ধি এবং তাজা নলেন গুড়ের ধোঁয়াটে মিষ্টি স্বাদ এমন এক অভিজ্ঞতা যা
              শহরের অনেকেই মিস করছিল।
            </p>
            <p>
              আমরা সেই ব্যবধান পূরণ করার সিদ্ধান্ত নিয়েছি। আমরা স্থানীয় কৃষক এবং
              কারিগরদের সাথে অংশীদারিত্ব শুরু করেছি যারা গুণমান এবং প্রাকৃতিক
              পদ্ধতির প্রতি আমাদের আবেগ ভাগ করে নেয়। বাংলা ন্যাচারালস একটি ব্র্যান্ডের
              চেয়েও বেশি কিছু; এটি উৎপাদক, নির্মাতা এবং গ্রাহকদের একটি সম্প্রদায়
              যারা প্রকৃতির আসল স্বাদকে প্রশংসা করে।
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
              আমাদের ট্রেসেবিলিটির প্রতিশ্রুতি
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              আপনার খাবার কোথা থেকে আসে তা জানার অধিকার আপনার আছে। আমরা সম্পূর্ণ
              স্বচ্ছতায় বিশ্বাস করি। প্রতিটি পণ্যের জন্য, আমরা তার উৎস, যে
              সম্প্রদায় এটি উৎপাদন করেছে এবং আপনার বাড়িতে পৌঁছানোর যাত্রা
              সম্পর্কে তথ্য সরবরাহ করি।
            </p>
            <p>
              এই প্রতিশ্রুতি নিশ্চিত করে যে আপনি সর্বোচ্চ মানের পণ্য পাচ্ছেন এবং
              একই সাথে স্থানীয় সম্প্রদায় ও টেকসই অনুশীলনকে সমর্থন করছেন যা এই
              সবকিছু সম্ভব করে তুলেছে। এটি এমন একটি সংযোগ যা আপনি স্বাদ এবং
              বিশ্বাসের সাথে অনুভব করতে পারেন।
            </p>
          </CardContent>
        </div>
      </Card>

      <div className="text-center">
        <Heart className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-3xl font-headline font-bold">
          আমাদের সম্প্রদায়ে যোগ দিন
        </h2>
        <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
          আপনি যখন বাংলা ন্যাচারালস বেছে নেন, তখন আপনি শুধু একটি পণ্য কিনছেন না;
          আপনি একটি গল্পের অংশ হয়ে উঠছেন।
        </p>
      </div>
    </div>
  );
}
