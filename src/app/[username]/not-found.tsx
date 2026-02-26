
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home, Search } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export default function NotFound() {
  const t = useTranslation();
  const { error404: e } = t;

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 min-h-[60vh] space-y-6">
      <div className="relative">
        {/* Decorative background glow */}
        <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-150 animate-pulse" />
        
        <div className="relative bg-card border-2 border-primary/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 blur-2xl rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
          <FileQuestion className="w-24 h-24 text-primary relative z-10" />
        </div>
      </div>
      
      <div className="space-y-3 relative z-10">
        <h1 className="text-4xl md:text-7xl font-headline font-black tracking-tight text-foreground">
            {e?.title || '৪০৪ - পাওয়া যায়নি'}
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto leading-relaxed font-medium">
          {e?.description || 'দুঃখিত, আপনি যে পাতাটি খুঁজছেন সেটি খুঁজে পাওয়া যায়নি।'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-6 relative z-10 w-full max-w-xs sm:max-w-none sm:justify-center">
        <Button asChild size="lg" className="h-14 rounded-2xl px-10 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 group">
          <Link href="/">
            <Home className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" /> {e?.goHome || 'হোমপেজে ফিরে যান'}
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-14 rounded-2xl px-10 text-lg font-bold border-2 transition-all hover:scale-105 active:scale-95 group">
          <Link href="/products">
            <Search className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" /> {e?.browseProducts || 'পণ্য খুঁজুন'}
          </Link>
        </Button>
      </div>
    </div>
  );
}
