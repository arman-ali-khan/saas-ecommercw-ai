
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layout, CheckCircle2, Eye, Loader2, Palette,Plus, ExternalLink, Upload, Download, FileJson, AlertCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import type { StoreTheme } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

export default function ThemesPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [themes, setThemes] = useState<StoreTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [isProcessingJson, setIsProcessingJson] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            await refreshUser();
        } else {
            throw new Error(result.error || 'থিম অ্যাপ্লাই করতে সমস্যা হয়েছে।');
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: error.message });
    } finally {
        setIsApplying(null);
    }
  };

  // --- Theme JSON Logic ---
  
  const handleDownloadJson = async () => {
    if (!user) return;
    try {
        const response = await fetch('/api/settings/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: user.id }),
        });
        const result = await response.json();
        if (response.ok) {
            const config = {
                site_name: result.profile.site_name,
                site_description: result.profile.site_description,
                theme_settings: {
                    theme_primary: result.settings.theme_primary,
                    theme_mode: result.settings.theme_mode,
                    font_primary: result.settings.font_primary,
                    font_secondary: result.settings.font_secondary,
                    card_design: result.settings.card_design || 'v1',
                    navbar_design: result.settings.navbar_design || 'v1',
                    hero_design: result.settings.hero_design || 'v1',
                    category_design: result.settings.category_design || 'v1',
                    section_design: result.settings.section_design || 'v1',
                    footer_design: result.settings.footer_design || 'v1'
                },
                homepage_sections: result.settings.homepage_sections || [],
                custom_config: result.settings.theme_config || {}
            };

            const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `theme-backup-${user.domain}-${format(new Date(), 'yyyyMMdd')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast({ title: 'Backup Successful!', description: 'Theme JSON downloaded.' });
        }
    } catch (e) {
        toast({ variant: 'destructive', title: 'Download Failed' });
    }
  };

  const handleUploadJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingJson(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const json = JSON.parse(e.target?.result as string);
            
            // Basic validation
            if (!json.theme_settings || !json.homepage_sections) {
                throw new Error("Invalid theme file format.");
            }

            const response = await fetch('/api/settings/save-theme-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteId: user?.id,
                    themeConfig: json
                }),
            });

            if (response.ok) {
                // Also update individual settings if they exist in JSON
                await fetch('/api/settings/save-general', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ siteId: user?.id, siteName: json.site_name, siteDescription: json.site_description }),
                });

                await fetch('/api/sections/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ siteId: user?.id, sections: json.homepage_sections }),
                });

                await fetch('/api/appearance/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ siteId: user?.id, ...json.theme_settings }),
                });

                toast({ title: 'Theme Imported Successfully!', description: 'Your store has been updated based on the JSON file.' });
                await refreshUser();
                window.location.reload();
            } else {
                throw new Error((await response.json()).error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Import Failed', description: error.message });
        } finally {
            setIsProcessingJson(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsText(file);
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
    <div className="space-y-10 pb-20">
      <div className="flex flex-col items-start px-1">
        <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
          <Layout className="h-6 w-6 text-primary" /> Store Themes
        </h1>
        <p className="text-muted-foreground text-sm">আপনার স্টোরের জন্য সেরা ডিজাইনটি বেছে নিন এবং কাস্টমাইজ করুন।</p>
      </div>

      <div className="grid gap-10">
        {/* Advanced Expert Card */}
        <Card className="border-2 border-primary/20 bg-primary/5 rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <FileJson className="h-5 w-5" /> Expert Mode: Theme JSON
                        </CardTitle>
                        <CardDescription>Upload or download full theme configuration for advanced customization.</CardDescription>
                    </div>
                    <Badge variant="secondary" className="font-black">ADVANCED</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-4">
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="p-6 bg-background rounded-2xl border-2 border-dashed flex flex-col items-center text-center gap-4">
                        <div className="p-3 bg-muted rounded-xl"><Download className="h-6 w-6 text-muted-foreground" /></div>
                        <div>
                            <p className="font-bold text-sm">Download Backup</p>
                            <p className="text-xs text-muted-foreground">Save your current design as a JSON file.</p>
                        </div>
                        <Button variant="outline" className="w-full rounded-xl h-11" onClick={handleDownloadJson}>
                            Export Configuration
                        </Button>
                    </div>
                    <div className="p-6 bg-background rounded-2xl border-2 border-dashed flex flex-col items-center text-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl"><Upload className="h-6 w-6 text-primary" /></div>
                        <div>
                            <p className="font-bold text-sm">Upload Theme JSON</p>
                            <p className="text-xs text-muted-foreground">Import a pre-built theme or restore a backup.</p>
                        </div>
                        <input 
                            type="file" 
                            accept=".json" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleUploadJson} 
                        />
                        <Button 
                            className="w-full rounded-xl h-11 shadow-lg shadow-primary/10" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessingJson}
                        >
                            {isProcessingJson ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Import Custom Theme
                        </Button>
                    </div>
                </div>
                <div className="mt-6 flex items-start gap-2 text-[10px] text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <p>JSON আপলোড করলে আপনার বর্তমান সেকশন এবং কালার সেটিংস ওভাররাইট হয়ে যাবে। দয়া করে আপলোড করার আগে ব্যাকআপ নিয়ে রাখুন।</p>
                </div>
            </CardContent>
        </Card>

        {/* Public Themes List */}
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
      </div>
      
      <div className="pt-8 border-t border-dashed mt-12 flex items-center justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              More designs coming soon
          </p>
      </div>
    </div>
  );
}
