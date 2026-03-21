
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layout, CheckCircle2, Eye, Loader2, Palette, ExternalLink, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import type { StoreTheme } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function ThemesPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [themes, setThemes] = useState<StoreTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState<string | null>(null);

  const fetchThemes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/themes/list');
      const result = await response.json();
      if (response.ok) {
        setThemes(result.themes || []);
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const handleApplyTheme = async (themeId: string) => {
    if (!user?.id) return;
    
    setIsApplying(themeId);
    try {
        const response = await fetch('/api/themes/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                siteId: user.id,
                themeId: themeId
            })
        });

        const result = await response.json();

        if (response.ok) {
            toast({ title: 'থিম সক্রিয় হয়েছে!', description: 'আপনার স্টোরফ্রন্টে নতুন ডিজাইন অ্যাপ্লাই করা হয়েছে।' });
            await refreshUser(); // Update local auth state to reflect new theme
        } else {
            throw new Error(result.error || 'থিম অ্যাপ্লাই করতে সমস্যা হয়েছে।');
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: error.message });
    } finally {
        setIsApplying(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden border-2">
              <Skeleton className="aspect-video w-full" />
              <CardHeader className="p-5">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardFooter className="p-5 pt-0 gap-3">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start px-1">
        <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
          <Layout className="h-6 w-6 text-primary" /> Store Themes
        </h1>
        <p className="text-muted-foreground text-sm">আপনার স্টোরের জন্য সেরা ডিজাইনটি বেছে নিন এবং কাস্টমাইজ করুন।</p>
      </div>

      {themes.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => {
            const isActive = theme.id === user?.active_theme_id || (theme.is_default && !user?.active_theme_id); 

            return (
              <Card key={theme.id} className={cn("overflow-hidden border-2 transition-all group flex flex-col", isActive ? "border-primary ring-4 ring-primary/5 shadow-xl" : "hover:border-primary/20")}>
                <div className="relative aspect-video bg-muted border-b overflow-hidden">
                  {theme.image_url ? (
                    <Image 
                      src={theme.image_url} 
                      alt={theme.title} 
                      fill 
                      className="object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                      <Palette className="h-12 w-12 opacity-20" />
                    </div>
                  )}
                  
                  {isActive && (
                    <div className="absolute top-3 left-3 animate-in zoom-in duration-300">
                      <Badge className="bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest px-3 py-1 shadow-lg">
                        <CheckCircle2 className="mr-1.5 h-3 w-3" /> ACTIVE
                      </Badge>
                    </div>
                  )}
                </div>
                <CardHeader className="p-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{theme.title}</CardTitle>
                    {theme.is_default && !isActive && <Badge variant="outline" className="text-[8px] font-black uppercase">Standard</Badge>}
                  </div>
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {theme.subtitle || 'আপনার স্টোরের জন্য একটি প্রফেশনাল এবং আধুনিক ডিজাইন।'}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="p-5 pt-0 gap-3 mt-auto">
                  {theme.preview_link ? (
                    <Button variant="outline" className="flex-1 rounded-xl h-10 text-xs font-bold" asChild>
                      <a href={theme.preview_link} target="_blank" rel="noopener noreferrer">
                        <Eye className="mr-2 h-3.5 w-3.5" /> Preview
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1 rounded-xl h-10 text-xs font-bold" disabled>
                      No Preview
                    </Button>
                  )}
                  <Button 
                    className="flex-1 rounded-xl h-10 text-xs font-bold shadow-lg shadow-primary/10" 
                    disabled={isActive || isApplying !== null}
                    onClick={() => handleApplyTheme(theme.id)}
                  >
                    {isApplying === theme.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isActive ? 'Active' : 'Apply Theme'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 border-2 border-dashed rounded-[2.5rem] bg-muted/5">
            <Palette className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground font-medium">No themes available at the moment.</p>
        </div>
      )}
      
      <div className="pt-8 border-t border-dashed mt-12 flex items-center justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              More designs coming soon
          </p>
      </div>
    </div>
  );
}
