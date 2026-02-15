'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Store } from 'lucide-react';

export default function SaasPreloader() {
  const pathname = usePathname();

  // We only want the preloader on the homepage
  const isHomePage = pathname === '/';

  useEffect(() => {
    if (!isHomePage) {
      document.body.classList.add('loaded');
      return;
    }
    
    document.body.classList.remove('loaded');

    const handleLoad = () => {
      setTimeout(() => {
        document.body.classList.add('loaded');
      }, 200);
    };
    
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }

  }, [pathname, isHomePage]);

  if (!isHomePage) return null;

  return (
    <div id="preloader">
      <div className="flex flex-col items-center gap-4">
        <div className="loader-logo-container">
          <div className="h-full w-full bg-primary rounded-full flex items-center justify-center">
            <Store className="h-1/2 w-1/2 text-primary-foreground" />
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-inner"></div>
        </div>
      </div>
    </div>
  );
}
