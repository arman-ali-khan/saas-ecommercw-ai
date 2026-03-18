
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import EcommerceAnimation from './ecommerce-animation';

export default function SaasPreloader() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);

  // We only want the preloader on the main SaaS landing page
  const isHomePage = pathname === '/';

  useEffect(() => {
    if (!isHomePage) {
      document.body.classList.add('loaded');
      setIsVisible(false);
      return;
    }
    
    document.body.classList.remove('loaded');
    setIsVisible(true);

    const handleLoad = () => {
      // Allow the Lottie animation to play for at least a brief moment
      setTimeout(() => {
        document.body.classList.add('loaded');
        setTimeout(() => setIsVisible(false), 400); // Faster fade out
      }, 800);
    };
    
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }

    // Safety fallback: ensure preloader hides after 4 seconds no matter what
    const fallbackTimer = setTimeout(() => {
        if (!document.body.classList.contains('loaded')) {
            document.body.classList.add('loaded');
            setIsVisible(false);
        }
    }, 4000);

    return () => clearTimeout(fallbackTimer);

  }, [pathname, isHomePage]);

  if (!isHomePage || !isVisible) return null;

  return (
    <div id="preloader" className="flex flex-col items-center justify-center bg-background fixed inset-0 z-[99999] transition-opacity duration-500">
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          {/* Decorative background glow for the animation */}
          <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150 animate-pulse" />
          <div className="relative z-10">
            <EcommerceAnimation className="w-48 h-48" />
          </div>
        </div>
        
        <div className="space-y-4 flex flex-col items-center -mt-4">
            <div className="progress-bar w-48 bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="progress-bar-inner h-full bg-primary animate-[loader-progress_2s_infinite_ease-in-out]"></div>
            </div>
            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-primary animate-pulse ml-1">
                DOKANBD
            </p>
        </div>
      </div>
    </div>
  );
}
