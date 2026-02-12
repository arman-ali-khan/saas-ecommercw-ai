'use client';

import Link from 'next/link';
import { Facebook, Twitter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import DynamicIcon from './dynamic-icon';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton';

const TikTokIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <path d="M12.52.02c1.31-.02 2.61.01 3.91.02.08 1.53.01 3.07.01 4.6 0 1.1.35 2.21 1.22 3.01.91.82 2.1 1.25 3.32 1.19.08 1.5.01 3 .01 4.5a5.42 5.42 0 0 1-5.12 5.14c-1.53.08-3.07.01-4.6.01-1.1 0-2.21-.35-3.01-1.22-.82-.91-1.25-2.1-1.19-3.32-.08-1.5-.01-3-.01-4.5a5.42 5.42 0 0 1 5.12-5.14Z" />
    <path d="M9 8.5h4" />
    <path d="M9 12.5h4" />
    <path d="M13.5 4.5v4" />
  </svg>
);

export default function Footer() {
  const params = useParams();
  const domain = params.username as string;
  const [siteInfo, setSiteInfo] = useState<{
    name: string;
    description: string | null;
    logoType: 'icon' | 'image';
    logoIcon: string;
    logoImageUrl: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchInfo() {
      if (domain) {
        setIsLoading(true);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, site_name, site_description')
          .eq('domain', domain)
          .single();
        if (profileData) {
          const { data: settingsData } = await supabase
            .from('store_settings')
            .select('logo_type, logo_icon, logo_image_url')
            .eq('site_id', profileData.id)
            .single();

          setSiteInfo({
            name: profileData.site_name || domain,
            description: profileData.site_description,
            logoType: settingsData?.logo_type || 'icon',
            logoIcon: settingsData?.logo_icon || 'Leaf',
            logoImageUrl: settingsData?.logo_image_url || null,
          });
        } else {
          setSiteInfo({ name: domain, description: 'An e-commerce store', logoType: 'icon', logoIcon: 'Leaf', logoImageUrl: null });
        }
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    }
    fetchInfo();
  }, [domain]);
  
  const FooterLogo = () => {
    if (isLoading || !siteInfo) {
      return (
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
      );
    }

    return (
       <Link href="/" className="mb-4 flex items-center gap-3">
        <div className={`${siteInfo.logoType === 'image' ? '':'bg-primary'} p-2 rounded-full flex items-center justify-center h-10 w-10`}>
          {siteInfo.logoType === 'image' && siteInfo.logoImageUrl ? (
            <div className="relative h-8 w-8">
              <Image src={siteInfo.logoImageUrl} alt={siteInfo.name} fill className="object-contain rounded-sm" />
            </div>
          ) : (
            <DynamicIcon name={siteInfo.logoIcon} className="h-6 w-6 text-primary-foreground" />
          )}
        </div>
        <span className="text-xl font-bold font-headline">{siteInfo.name}</span>
      </Link>
    );
  };
  
  const basePath = '';
  
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-start">
            <FooterLogo />
            {isLoading ? <Skeleton className="h-12 w-full max-w-xs" /> : (
                <p className="max-w-xs text-secondary-foreground/80">
                  {siteInfo?.description || 'আপনার বাড়িতে বাংলাদেশের প্রাকৃতিক সম্পদের খাঁটি স্বাদ নিয়ে আসা।'}
                </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-headline font-semibold mb-4">কেনাকাটা</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href={`${basePath}/products`}
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    সব পণ্য
                  </Link>
                </li>
                <li>
                  <Link
                    href={`${basePath}/products/mango-himsagar`}
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    আম
                  </Link>
                </li>
                <li>
                  <Link
                    href={`${basePath}/products/sundarban-honey`}
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    মধু
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-headline font-semibold mb-4">আমাদের সম্পর্কে</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href={`${basePath}/about`}
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    আমাদের গল্প
                  </Link>
                </li>
                <li>
                  <Link
                    href={`${basePath}/about`}
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    ট্রেসেবিলিটি
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div>
            <h3 className="font-headline font-semibold mb-4">আমাদের অনুসরণ করুন</h3>
            <div className="flex space-x-4">
              <Link
                href="#"
                aria-label="Facebook"
                className="text-secondary-foreground/80 hover:text-primary transition-colors"
              >
                <Facebook />
              </Link>
              <Link
                href="#"
                aria-label="Twitter"
                className="text-secondary-foreground/80 hover:text-primary transition-colors"
              >
                <Twitter />
              </Link>
              <Link
                href="#"
                aria-label="TikTok"
                className="text-secondary-foreground/80 hover:text-primary transition-colors"
              >
                <TikTokIcon />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-secondary-foreground/60">
          <p>&copy; {new Date().getFullYear()} {siteInfo?.name || 'বাংলা ন্যাচারালস'}। সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
      </div>
    </footer>
  );
}
