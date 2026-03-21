'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import EcommerceAnimation from './ecommerce-animation';

export default function SaasPreloader() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [isPlatformRoot, setIsPlatformRoot] = useState(false);

  useEffect(() => {
    const host = window.location.hostname.toLowerCase();
    const base = (process.env.NEXT_PUBLIC_BASE_DOMAIN || 'ihut.shop').toLowerCase();
    
    const isRoot = host === base || host === `www.${base}` || host === 'e-bd.shop' || host === 'www.e-bd.shop' || host.includes('localhost') || host.includes('cloudworkstations.dev');
    setIsPlatformRoot(isRoot);

    const isHomePage = pathname === '/' && isRoot;

    if (!isHomePage) {
      document.body.classList.add('loaded');
      setIsVisible(false);
      return;
    }
    
    document.body.classList.remove('loaded');
    setIsVisible(true);

    const handleLoad = () => {
      setTimeout(() => {
        document.body.classList.add('loaded');
        setTimeout(() => setIsVisible(false), 600);
      }, 1200);
    };
    
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }

    const fallbackTimer = setTimeout(() => {
        if (!document.body.classList.contains('loaded')) {
            document.body.classList.add('loaded');
            setIsVisible(false);
        }
    }, 5000);

    return () => clearTimeout(fallbackTimer);

  }, [pathname]);

  if (!isPlatformRoot || pathname !== '/' || !isVisible) return null;

  return (
    <div id="preloader" className="flex flex-col items-center justify-center bg-background fixed inset-0 z-[99999] transition-opacity duration-700 ease-in-out">
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150 animate-pulse" />
          <div className="relative z-10">
            <EcommerceAnimation className="w-64 h-64 sm:w-80 sm:h-80" />
          </div>
        </div>
        
        <div className="space-y-4 flex flex-col items-center -mt-8 relative z-20">
            <div className="progress-bar w-48 bg-muted rounded-full h-1.5 overflow-hidden border">
                <div className="progress-bar-inner h-full bg-primary animate-[loader-progress_2s_infinite_ease-in-out]"></div>
            </div>
            <div className="flex flex-col items-center">
                <p className="text-[10px] uppercase tracking-[0.5em] font-black text-primary animate-pulse ml-1">
                    DOKANBD
                </p>
                <p className="text-[8px] uppercase tracking-widest text-muted-foreground mt-1 font-bold">
                    Powered by GenAI
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
