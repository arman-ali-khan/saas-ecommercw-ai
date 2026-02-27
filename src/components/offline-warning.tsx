'use client';

import { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

export default function OfflineWarning() {
  const [isOffline, setIsOffline] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check initial status
    setIsOffline(!window.navigator.onLine);

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
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-md animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between border-2 border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full animate-pulse">
            <WifiOff className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-sm">ইন্টারনেট সংযোগ নেই</p>
            <p className="text-[10px] opacity-80 uppercase font-black tracking-widest">আপনি এখন অফলাইনে আছেন</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full hover:bg-white/10" 
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
