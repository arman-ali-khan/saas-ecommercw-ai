
'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import type { FooterLinkCategory, SocialLink } from '@/types';
import DynamicIcon from './dynamic-icon';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton';

type SiteInfo = {
  name: string;
  description: string | null;
  logoType: 'icon' | 'image';
  logoIcon: string;
  logoImageUrl: string | null;
} | null;

interface FooterProps {
    siteInfo: SiteInfo;
    footerCategories: FooterLinkCategory[];
    socialLinks: SocialLink[];
    isLoading: boolean;
}

const platformIcons = {
    facebook: Facebook,
    twitter: Twitter,
    instagram: Instagram,
    linkedin: Linkedin,
    youtube: Youtube,
    tiktok: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M12.52.02c1.31-.02 2.61.01 3.91.02.08 1.53.01 3.07.01 4.6 0 1.1.35 2.21 1.22 3.01.91.82 2.1 1.25 3.32 1.19.08 1.5.01 3 .01 4.5a5.42 5.42 0 0 1-5.12 5.14c-1.53.08-3.07.01-4.6.01-1.1 0-2.21-.35-3.01-1.22-.82-.91-1.25-2.1-1.19-3.32-.08-1.5-.01-3-.01-4.5a5.42 5.42 0 0 1 5.12-5.14Z"></path><path d="M9 8.5h4"></path><path d="M9 12.5h4"></path><path d="M13.5 4.5v4"></path></svg>
    ),
};

export default function Footer({ siteInfo, footerCategories, socialLinks, isLoading }: FooterProps) {
  
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-start md:col-span-2">
            <FooterLogo />
            {isLoading ? <Skeleton className="h-12 w-full max-w-xs" /> : (
                <p className="max-w-xs text-secondary-foreground/80">
                  {siteInfo?.description || 'আপনার বাড়িতে বাংলাদেশের প্রাকৃতিক সম্পদের খাঁটি স্বাদ নিয়ে আসা।'}
                </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-8 md:col-span-2">
            {isLoading ? (
                <>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </>
            ) : footerCategories.length > 0 ? (
                footerCategories.map(cat => (
                    <div key={cat.id}>
                        <h3 className="font-headline font-semibold mb-4">{cat.title}</h3>
                        <ul className="space-y-2">
                            {(cat.links || []).map(link => (
                                <li key={link.id}>
                                    <Link href={link.href} className="text-secondary-foreground/80 hover:text-primary transition-all flex items-center gap-2 group">
                                        {link.icon && <DynamicIcon name={link.icon} className="h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />}
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))
            ) : (
                <>
                    <div>
                        <h3 className="font-headline font-semibold mb-4">Shop</h3>
                        <ul className="space-y-2">
                            <li><Link href={`${basePath}/products`} className="text-secondary-foreground/80 hover:text-primary transition-colors">All Products</Link></li>
                        </ul>
                    </div>
                     <div>
                        <h3 className="font-headline font-semibold mb-4">About</h3>
                        <ul className="space-y-2">
                            <li><Link href={`${basePath}/about`} className="text-secondary-foreground/80 hover:text-primary transition-colors">Our Story</Link></li>
                        </ul>
                    </div>
                </>
            )}
            
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="flex space-x-4">
                {socialLinks.map(link => {
                    const Icon = platformIcons[link.platform as keyof typeof platformIcons];
                    return (
                        <Link key={link.id} href={link.href} aria-label={link.platform} className="text-secondary-foreground/80 hover:text-primary transition-colors">
                            {Icon ? <Icon /> : link.platform}
                        </Link>
                    )
                })}
            </div>
            <p className="text-center text-sm text-secondary-foreground/60">
                &copy; {new Date().getFullYear()} {siteInfo?.name || 'Store Name'}। All rights reserved.
            </p>
        </div>
      </div>
    </footer>
  );
}
