'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton';
import { usePathname, useParams } from 'next/navigation';
import DynamicIcon from './dynamic-icon';

export default function StorePreloader() {
  const pathname = usePathname();
  const params = useParams();
  const domain = params.username as string;

  const [logoInfo, setLogoInfo] = useState<{
    type: 'icon' | 'image';
    value: string;
  } | null>(null);
  const [isLogoLoading, setIsLogoLoading] = useState(true);

  // We only want the preloader on the homepage of the store
  const isHomePage = pathname === `/`;

  useEffect(() => {
    if (!isHomePage) {
      document.body.classList.add('loaded');
      return;
    }
    
    document.body.classList.remove('loaded');

    const fetchLogo = async () => {
      if (!domain) {
          setIsLogoLoading(false);
          return;
      };
      setIsLogoLoading(true);
      const { data: profileData } = await supabase.from('profiles').select('id').eq('domain', domain).single();
      if(profileData) {
        const { data: settingsData } = await supabase
            .from('store_settings')
            .select('logo_type, logo_icon, logo_image_url')
            .eq('site_id', profileData.id)
            .single();

        if (settingsData?.logo_type === 'image' && settingsData.logo_image_url) {
            setLogoInfo({ type: 'image', value: settingsData.logo_image_url });
        } else {
            setLogoInfo({ type: 'icon', value: settingsData?.logo_icon || 'Leaf' });
        }
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

  }, [pathname, isHomePage, domain]);

  if (!isHomePage) return null;

  return (
    <div id="preloader">
      <div className="flex flex-col items-center gap-4">
        <div className="loader-logo-container">
          {isLogoLoading ? (
            <Skeleton className="h-full w-full rounded-lg" />
          ) : logoInfo?.type === 'image' && logoInfo.value ? (
            <Image src={logoInfo.value} alt="Loading..." fill className="object-contain" priority />
          ) : (
            <div className="h-full w-full bg-primary rounded-full flex items-center justify-center">
              <DynamicIcon name={logoInfo?.value || 'Leaf'} className="h-1/2 w-1/2 text-primary-foreground" />
            </div>
          )}
        </div>
        <div className="progress-bar">
          <div className="progress-bar-inner"></div>
        </div>
      </div>
    </div>
  );
}
