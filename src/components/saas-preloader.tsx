'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Store } from 'lucide-react';

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
      // Small timeout to ensure the progress bar looks like it finished
      setTimeout(() => {
        document.body.classList.add('loaded');
        setTimeout(() => setIsVisible(false), 600); // Wait for CSS transition
      }, 800);
    };
    
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }

  }, [pathname, isHomePage]);

  if (!isHomePage || !isVisible) return null;

  return (
    <div id="preloader">
      <div className="flex flex-col items-center gap-6">
        <div className="loader-logo-container">
          <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
            <Store className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>
        <div className="space-y-3 flex flex-col items-center">
            <div className="progress-bar">
                <div className="progress-bar-inner"></div>
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary/60 animate-pulse">
                লোড হচ্ছে
            </p>
        </div>
      </div>
    </div>
  );
}
