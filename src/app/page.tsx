import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Logo from '@/components/logo';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-8 min-h-[60vh]">
      <Logo className="text-4xl" />
      <h1 className="text-5xl font-headline font-bold">
        বাংলা ন্যাচারালস-এ স্বাগতম
      </h1>
      <p className="max-w-2xl text-xl text-muted-foreground">
        বাংলাদেশের হৃদয় থেকে সরাসরি আপনার দোরগোড়ায় নিয়ে আসা খাঁটি, প্রাকৃতিক পণ্যের সেরা সম্ভার আবিষ্কার করুন।
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/products">
            কেনাকাটা শুরু করুন <ArrowRight className="ml-2" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/about">আমাদের গল্প</Link>
        </Button>
      </div>
    </div>
  );
}
