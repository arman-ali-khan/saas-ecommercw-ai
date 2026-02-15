'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton';
import { usePathname } from 'next/navigation';

export default function SaasPreloader() {
  const pathname = usePathname();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLogoLoading, setIsLogoLoading] = useState(true);

  // We only want the preloader on the homepage
  const isHomePage = pathname === '/';

  useEffect(() => {
    if (!isHomePage) {
      document.body.classList.add('loaded');
      return;
    }
    
    document.body.classList.remove('loaded');

    const fetchLogo = async () => {
      setIsLogoLoading(true);
      const { data } = await supabase
        .from('saas_settings')
        .select('logo_url')
        .eq('id', 1)
        .single();
      if (data?.logo_url) {
        setLogoUrl(data.logo_url);
      }
      setIsLogoLoading(false);
    };
    fetchLogo();

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
          {isLogoLoading ? (
            <Skeleton className="h-full w-full rounded-lg" />
          ) : logoUrl ? (
            <Image src={logoUrl} alt="Loading..." fill className="object-contain" priority />
          ) : (
            <div className="h-full w-full bg-muted rounded-lg" />
          )}
        </div>
        <div className="progress-bar">
          <div className="progress-bar-inner"></div>
        </div>
      </div>
    </div>
  );
}
