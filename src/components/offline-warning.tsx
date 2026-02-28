'use client';

import { useState, useEffect } from 'react';
import { WifiOff, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

export default function OfflineWarning() {
  const [isOffline, setIsOffline] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check initial status
    if (typeof window !== 'undefined') {
      setIsOffline(!window.navigator.onLine);
    }

    const handleOnline = () => {
      setIsOffline(false);
      setIsDismissed(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setIsDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline || isDismissed) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card text-card-foreground p-8 rounded-[2.5rem] shadow-2xl border-2 border-primary/20 max-w-sm w-full text-center space-y-6">
        <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative bg-primary/10 p-6 rounded-full border-2 border-primary/20 flex items-center justify-center">
                <WifiOff className="h-12 w-12 text-primary" />
            </div>
        </div>
        
        <div className="space-y-2">
            <h2 className="text-2xl font-black font-headline tracking-tight">ইন্টারনেট সংযোগ নেই</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
                দুঃখিত, আপনার ডিভাইসে কোনো ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না। পেজটি পুনরায় লোড করতে সংযোগটি চেক করুন।
            </p>
        </div>

        <div className="pt-4 flex flex-col gap-3">
            <Button 
                onClick={() => window.location.reload()} 
                className="h-12 rounded-xl font-bold shadow-lg shadow-primary/20 w-full"
            >
                <RefreshCw className="mr-2 h-4 w-4" /> পুনরায় চেষ্টা করুন
            </Button>
            <Button 
                variant="ghost" 
                onClick={() => setIsDismissed(true)}
                className="h-10 text-muted-foreground text-xs"
            >
                বন্ধ করুন
            </Button>
        </div>
      </div>
    </div>
  );
}
