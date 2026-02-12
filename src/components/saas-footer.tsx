
'use client';

import Link from 'next/link';
import { Facebook, Twitter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
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

export default function SaasFooter() {
  const [socials, setSocials] = useState({
    facebook: '',
    twitter: '',
    tiktok: '',
  });

  const [siteInfo, setSiteInfo] = useState<{
    name: string;
    description: string | null;
    logoUrl: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('saas_settings')
            .select('platform_name, platform_description, social_facebook, social_twitter, social_tiktok, logo_url')
            .eq('id', 1)
            .single();
        
        if (data) {
            setSocials({
              facebook: data.social_facebook || '',
              twitter: data.social_twitter || '',
              tiktok: data.social_tiktok || '',
            });
            setSiteInfo({
              name: data.platform_name || 'Your SaaS',
              description: data.platform_description || 'Your platform description.',
              logoUrl: data.logo_url || null,
            });
        }
        setIsLoading(false);
    };
    fetchData();
  }, []);
  
  const FooterLogo = () => {
    if (isLoading || !siteInfo) {
      return (
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-32" />
        </div>
      );
    }

    return (
       <Link href="/" className="mb-4 flex items-center gap-3">
        {siteInfo.logoUrl ? (
             <div className="relative h-10 w-10">
              <Image src={siteInfo.logoUrl} alt={siteInfo.name} fill className="object-contain" />
            </div>
        ) : (
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center font-bold text-lg">
                {siteInfo.name.charAt(0)}
            </div>
        )}
        <span className="text-xl font-bold font-headline">{siteInfo.name}</span>
      </Link>
    );
  };
  
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-start">
            <FooterLogo />
             {isLoading ? <Skeleton className="h-12 w-full max-w-xs" /> : (
                <p className="max-w-xs text-secondary-foreground/80">
                  {siteInfo?.description || 'আপনার নিজস্ব ই-কমার্স সাম্রাজ্য তৈরি করার প্ল্যাটফর্ম।'}
                </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-headline font-semibold mb-4">প্ল্যাটফর্ম</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/#features"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    বৈশিষ্ট্য
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#pricing"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    মূল্য
                  </Link>
                </li>
                <li>
                  <Link
                    href="/get-started"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    বিনামূল্যে শুরু করুন
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-headline font-semibold mb-4">কোম্পানি</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    আমাদের সম্পর্কে
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    যোগাযোগ
                  </Link>
                </li>
                 <li>
                  <Link
                    href="/login"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    অ্যাডমিন লগইন
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div>
            <h3 className="font-headline font-semibold mb-4">
              আমাদের অনুসরণ করুন
            </h3>
            {(socials.facebook || socials.twitter || socials.tiktok) && (
              <div className="flex space-x-4">
                {socials.facebook && (
                  <Link
                    href={socials.facebook}
                    aria-label="Facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    <Facebook />
                  </Link>
                )}
                {socials.twitter && (
                  <Link
                    href={socials.twitter}
                    aria-label="Twitter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    <Twitter />
                  </Link>
                )}
                {socials.tiktok && (
                  <Link
                    href={socials.tiktok}
                    aria-label="TikTok"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary-foreground/80 hover:text-primary transition-colors"
                  >
                    <TikTokIcon />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-secondary-foreground/60">
          <p>
            &copy; {new Date().getFullYear()} {siteInfo?.name || 'বাংলা ন্যাচারালস'}। সর্বস্বত্ব
            সংরক্ষিত।
          </p>
        </div>
      </div>
    </footer>
  );
}
