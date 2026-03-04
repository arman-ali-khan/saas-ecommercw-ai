
'use client';

import Link from 'next/link';
import { Facebook, Twitter, Shield, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton';
import { type SaasSettings } from '@/types';

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
    className="h-5 w-5"
  >
    <path d="M12.52.02c1.31-.02 2.61.01 3.91.02.08 1.53.01 3.07.01 4.6 0 1.1.35 2.21 1.22 3.01.91.82 2.1 1.25 3.32 1.19.08 1.5.01 3 .01 4.5a5.42 5.42 0 0 1-5.12 5.14c-1.53.08-3.07.01-4.6.01-1.1 0-2.21-.35-3.01-1.22-.82-.91-1.25-2.1-1.19-3.32-.08-1.5-.01-3-.01-4.5a5.42 5.42 0 0 1 5.12-5.14Z" />
    <path d="M9 8.5h4" />
    <path d="M9 12.5h4" />
    <path d="M13.5 4.5v4" />
  </svg>
);

interface SaasFooterProps {
  initialSettings?: SaasSettings | null;
  lang?: 'en' | 'bn';
}

const translations = {
  bn: {
    platform: 'প্ল্যাটফর্ম',
    company: 'কোম্পানি',
    features: 'ফিচারসমূহ',
    pricing: 'প্ল্যান ও মূল্য',
    freeAccount: 'ফ্রি অ্যাকাউন্ট',
    login: 'লগ ইন',
    story: 'আমাদের গল্প',
    leaveReview: 'রিভিউ দিন',
    privacy: 'প্রাইভেসি পলিসি',
    terms: 'শর্তাবলি',
    securePayment: 'সুরক্ষিত পেমেন্ট',
    madeInBD: 'বাংলাদেশে তৈরি',
    rights: 'সর্বস্বত্ব সংরক্ষিত।'
  },
  en: {
    platform: 'Platform',
    company: 'Company',
    features: 'Features',
    pricing: 'Pricing',
    freeAccount: 'Free Account',
    login: 'Log In',
    story: 'Our Story',
    leaveReview: 'Leave a Review',
    privacy: 'Privacy Policy',
    terms: 'Terms & Conditions',
    securePayment: 'Secure Payment',
    madeInBD: 'Made in Bangladesh',
    rights: 'All rights reserved.'
  }
};

export default function SaasFooter({ initialSettings, lang = 'bn' }: SaasFooterProps) {
  const t = translations[lang];
  
  const [socials, setSocials] = useState({
    facebook: initialSettings?.social_facebook || '',
    twitter: initialSettings?.social_twitter || '',
    tiktok: initialSettings?.social_tiktok || '',
  });

  const [siteInfo, setSiteInfo] = useState<{
    name: string;
    description: string | null;
    logoUrl: string | null;
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        if (!initialSettings) {
            setIsLoading(true);
            const { data } = await supabase
                .from('saas_settings')
                .select('platform_name, platform_name_en, platform_description, platform_description_en, social_facebook, social_twitter, social_tiktok, logo_url')
                .eq('id', 1)
                .single();
            
            if (data) {
                setSocials({
                  facebook: data.social_facebook || '',
                  twitter: data.social_twitter || '',
                  tiktok: data.social_tiktok || '',
                });
                setSiteInfo({
                  name: (lang === 'en' ? data.platform_name_en : data.platform_name) || data.platform_name || 'eHut',
                  description: (lang === 'en' ? data.platform_description_en : data.platform_description) || data.platform_description || 'Your partner in building digital stores.',
                  logoUrl: data.logo_url || null,
                });
            }
            setIsLoading(false);
        } else {
            setSocials({
                facebook: initialSettings.social_facebook || '',
                twitter: initialSettings.social_twitter || '',
                tiktok: initialSettings.social_tiktok || '',
            });
            setSiteInfo({
                name: (lang === 'en' ? initialSettings.platform_name_en : initialSettings.platform_name) || initialSettings.platform_name,
                description: (lang === 'en' ? initialSettings.platform_description_en : initialSettings.platform_description) || initialSettings.platform_description,
                logoUrl: initialSettings.logo_url
            });
            setIsLoading(false);
        }
    };
    fetchData();
  }, [initialSettings, lang]);
  
  const FooterLogo = () => (
    isLoading || !siteInfo ? (
      <Skeleton className="h-10 w-32 mb-4" />
    ) : (
       <Link href="/" className="mb-6 flex items-center gap-2.5">
        {siteInfo.logoUrl ? (
             <div className="relative h-10 w-10">
              <Image src={siteInfo.logoUrl} alt={siteInfo.name} fill className="object-contain" />
            </div>
        ) : (
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center font-bold text-lg text-primary-foreground shadow-lg shadow-primary/20">
                {siteInfo.name.charAt(0)}
            </div>
        )}
        <span className="text-xl font-bold font-headline tracking-tight text-foreground">{siteInfo.name}</span>
      </Link>
    )
  );
  
  return (
    <footer className="bg-card border-t border-border/50 pt-20 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-5 lg:col-span-4">
            <FooterLogo />
             {isLoading ? <Skeleton className="h-12 w-full max-w-xs" /> : (
                <p className="text-muted-foreground text-lg leading-relaxed max-sm">
                  {siteInfo?.description || 'Build your dream store in minutes with our powerful SaaS platform.'}
                </p>
            )}
            <div className="mt-8 flex space-x-4">
                {(socials.facebook || socials.twitter || socials.tiktok) && (
                  <>
                    {socials.facebook && (
                      <Link href={socials.facebook} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                        <Facebook className="w-5 h-5" />
                      </Link>
                    )}
                    {socials.twitter && (
                      <Link href={socials.twitter} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                        <Twitter className="w-5 h-5" />
                      </Link>
                    )}
                    {socials.tiktok && (
                      <Link href={socials.tiktok} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                        <TikTokIcon />
                      </Link>
                    )}
                  </>
                )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-7 lg:col-span-8">
            <div className="lg:col-start-3">
              <h3 className="font-bold text-lg mb-6 uppercase tracking-wider text-primary">{t.platform}</h3>
              <ul className="space-y-4">
                <li><Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">{t.features}</Link></li>
                <li><Link href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">{t.pricing}</Link></li>
                <li><Link href="/get-started" className="text-muted-foreground hover:text-foreground transition-colors">{t.freeAccount}</Link></li>
                <li><Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">{t.login}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-6 uppercase tracking-wider text-primary">{t.company}</h3>
              <ul className="space-y-4">
                <li><Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">{t.story}</Link></li>
                <li><Link href="/leave-a-review" className="text-muted-foreground hover:text-foreground transition-colors">{t.leaveReview}</Link></li>
                <li><Link href="/p/privacy" className="text-muted-foreground hover:text-foreground transition-colors">{t.privacy}</Link></li>
                <li><Link href="/p/terms" className="text-muted-foreground hover:text-foreground transition-colors">{t.terms}</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} {siteInfo?.name || 'eHut'}। {t.rights}
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> {t.securePayment}</span>
            <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-red-500" /> {t.madeInBD}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
