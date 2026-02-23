
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth';
import { useEffect, useState, useCallback } from 'react';
import { Loader2, Palette } from 'lucide-react';
import { fontMap } from '@/lib/fonts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const hslColorRegex = /^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/;

const appearanceSchema = z.object({
  theme_primary: z.string().regex(hslColorRegex, 'Invalid HSL color format (e.g., 207 90% 61%)'),
  theme_primary_foreground: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
  theme_secondary: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
  theme_secondary_foreground: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
  theme_accent: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
  theme_accent_foreground: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
  theme_background: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
  theme_foreground: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
  theme_card: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
  theme_card_foreground: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
  theme_muted: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
  theme_muted_foreground: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
  theme_border: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
  theme_input: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
  theme_destructive: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
  font_primary: z.string().min(1, 'Primary font is required'),
  font_secondary: z.string().min(1, 'Secondary font is required'),
});

type AppearanceFormData = z.infer<typeof appearanceSchema>;

// --- Conversion helpers ---
const hexToHslString = (hex: string) => {
    hex = hex.replace(/^#/, '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        if (h) h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const hslStringToHex = (hslStr: string) => {
    try {
        let [h, s, l] = hslStr.split(' ').map(v => parseInt(v.replace('%', '')));
        s /= 100;
        l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;
        if (0 <= h && h < 60) { [r, g, b] = [c, x, 0]; }
        else if (60 <= h && h < 120) { [r, g, b] = [x, c, 0]; }
        else if (120 <= h && h < 180) { [r, g, b] = [0, c, x]; }
        else if (180 <= h && h < 240) { [r, g, b] = [0, x, 0]; }
        else if (240 <= h && h < 300) { [r, g, b] = [x, 0, c]; }
        else if (300 <= h && h <= 360) { [r, g, b] = [c, 0, x]; }
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        const toHex = (c: number) => ('0' + c.toString(16)).slice(-2);
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch (e) {
        return '#000000';
    }
};

const ColorInput = ({ field, label }: { field: any, label: string }) => {
    const hexColor = hslStringToHex(field.value || '0 0% 0%');

    return (
        <FormItem>
            <FormLabel className="text-xs font-bold uppercase tracking-wider">{label}</FormLabel>
            <div className="flex items-center gap-2">
                 <Input
                    type="color"
                    value={hexColor}
                    onChange={(e) => field.onChange(hexToHslString(e.target.value))}
                    className="w-12 h-10 p-1 cursor-pointer shrink-0"
                    />
                <FormControl>
                    <Input {...field} placeholder="e.g. 224 71% 4%" className="font-mono text-xs" />
                </FormControl>
            </div>
            <FormMessage />
        </FormItem>
    );
};

// All popular e-commerce palettes with Light and Dark variants
const palettes = [
    { name: 'eHut (Dark)', colors: { theme_primary: '207 90% 61%', theme_primary_foreground: '224 71% 4%', theme_secondary: '217 33% 17%', theme_secondary_foreground: '210 40% 98%', theme_accent: '207 92% 77%', theme_accent_foreground: '224 71% 4%', theme_background: '224 71% 4%', theme_foreground: '210 40% 98%', theme_card: '224 71% 6%', theme_card_foreground: '210 40% 98%', theme_muted: '217 33% 17%', theme_muted_foreground: '215 20% 65%', theme_border: '217 33% 27%', theme_input: '217 33% 27%', theme_destructive: '0 63% 31%' } },
    { name: 'eHut (Light)', colors: { theme_primary: '207 90% 61%', theme_primary_foreground: '0 0% 100%', theme_secondary: '210 40% 96%', theme_secondary_foreground: '224 71% 4%', theme_accent: '207 92% 77%', theme_accent_foreground: '224 71% 4%', theme_background: '0 0% 100%', theme_foreground: '224 71% 4%', theme_card: '0 0% 100%', theme_card_foreground: '224 71% 4%', theme_muted: '210 40% 96%', theme_muted_foreground: '215 20% 45%', theme_border: '214 32% 91%', theme_input: '214 32% 91%', theme_destructive: '0 84% 60%' } },
    
    { name: 'Amazon (Light)', colors: { theme_primary: '36 100% 50%', theme_primary_foreground: '0 0% 100%', theme_secondary: '215 28% 19%', theme_secondary_foreground: '0 0% 100%', theme_accent: '36 100% 60%', theme_accent_foreground: '0 0% 100%', theme_background: '0 0% 100%', theme_foreground: '215 28% 10%', theme_card: '0 0% 98%', theme_card_foreground: '215 28% 10%', theme_muted: '215 28% 95%', theme_muted_foreground: '215 28% 40%', theme_border: '215 28% 90%', theme_input: '215 28% 90%', theme_destructive: '0 100% 40%' } },
    { name: 'Amazon (Dark)', colors: { theme_primary: '36 100% 50%', theme_primary_foreground: '0 0% 100%', theme_secondary: '215 28% 10%', theme_secondary_foreground: '0 0% 100%', theme_accent: '36 100% 40%', theme_accent_foreground: '0 0% 100%', theme_background: '215 28% 5%', theme_foreground: '0 0% 100%', theme_card: '215 28% 8%', theme_card_foreground: '0 0% 100%', theme_muted: '215 28% 12%', theme_muted_foreground: '215 28% 70%', theme_border: '215 28% 15%', theme_input: '215 28% 15%', theme_destructive: '0 100% 40%' } },
    
    { name: 'Daraz (Light)', colors: { theme_primary: '22 89% 54%', theme_primary_foreground: '0 0% 100%', theme_secondary: '210 100% 27%', theme_secondary_foreground: '0 0% 100%', theme_accent: '210 100% 35%', theme_accent_foreground: '0 0% 100%', theme_background: '0 0% 100%', theme_foreground: '210 100% 10%', theme_card: '0 0% 98%', theme_card_foreground: '210 100% 10%', theme_muted: '210 100% 95%', theme_muted_foreground: '210 100% 40%', theme_border: '210 100% 90%', theme_input: '210 100% 90%', theme_destructive: '0 100% 40%' } },
    { name: 'Daraz (Dark)', colors: { theme_primary: '22 89% 54%', theme_primary_foreground: '0 0% 100%', theme_secondary: '210 100% 10%', theme_secondary_foreground: '0 0% 100%', theme_accent: '210 100% 20%', theme_accent_foreground: '0 0% 100%', theme_background: '210 100% 5%', theme_foreground: '0 0% 100%', theme_card: '210 100% 8%', theme_card_foreground: '0 0% 100%', theme_muted: '210 100% 12%', theme_muted_foreground: '210 100% 70%', theme_border: '210 100% 15%', theme_input: '210 100% 15%', theme_destructive: '0 100% 40%' } },
    
    { name: 'AliExpress (Light)', colors: { theme_primary: '0 100% 64%', theme_primary_foreground: '0 0% 100%', theme_secondary: '0 0% 13%', theme_secondary_foreground: '0 0% 100%', theme_accent: '0 0% 20%', theme_accent_foreground: '0 0% 100%', theme_background: '0 0% 100%', theme_foreground: '0 0% 10%', theme_card: '0 0% 98%', theme_card_foreground: '0 0% 10%', theme_muted: '0 0% 95%', theme_muted_foreground: '0 0% 40%', theme_border: '0 0% 90%', theme_input: '0 0% 90%', theme_destructive: '0 100% 40%' } },
    { name: 'AliExpress (Dark)', colors: { theme_primary: '0 100% 64%', theme_primary_foreground: '0 0% 100%', theme_secondary: '0 0% 5%', theme_secondary_foreground: '0 0% 100%', theme_accent: '0 0% 10%', theme_accent_foreground: '0 0% 100%', theme_background: '0 0% 2%', theme_foreground: '0 0% 100%', theme_card: '0 0% 5%', theme_card_foreground: '0 0% 100%', theme_muted: '0 0% 8%', theme_muted_foreground: '0 0% 70%', theme_border: '0 0% 12%', theme_input: '0 0% 12%', theme_destructive: '0 100% 40%' } },
    
    { name: 'eBay (Light)', colors: { theme_primary: '358 78% 55%', theme_primary_foreground: '0 0% 100%', theme_secondary: '211 100% 41%', theme_secondary_foreground: '0 0% 100%', theme_accent: '211 100% 50%', theme_accent_foreground: '0 0% 100%', theme_background: '0 0% 100%', theme_foreground: '0 0% 10%', theme_card: '0 0% 100%', theme_card_foreground: '0 0% 10%', theme_muted: '0 0% 95%', theme_muted_foreground: '0 0% 40%', theme_border: '0 0% 90%', theme_input: '0 0% 90%', theme_destructive: '0 100% 40%' } },
    { name: 'eBay (Dark)', colors: { theme_primary: '358 78% 55%', theme_primary_foreground: '0 0% 100%', theme_secondary: '211 100% 20%', theme_secondary_foreground: '0 0% 100%', theme_accent: '211 100% 30%', theme_accent_foreground: '0 0% 100%', theme_background: '211 100% 5%', theme_foreground: '0 0% 100%', theme_card: '211 100% 8%', theme_card_foreground: '0 0% 100%', theme_muted: '211 100% 12%', theme_muted_foreground: '211 100% 70%', theme_border: '211 100% 15%', theme_input: '211 100% 15%', theme_destructive: '0 100% 40%' } },
    
    { name: 'Walmart (Light)', colors: { theme_primary: '207 100% 40%', theme_primary_foreground: '0 0% 100%', theme_secondary: '44 100% 56%', theme_secondary_foreground: '207 100% 10%', theme_accent: '44 100% 65%', theme_accent_foreground: '207 100% 10%', theme_background: '0 0% 100%', theme_foreground: '207 100% 10%', theme_card: '0 0% 98%', theme_card_foreground: '207 100% 10%', theme_muted: '207 100% 95%', theme_muted_foreground: '207 100% 40%', theme_border: '207 100% 90%', theme_input: '207 100% 90%', theme_destructive: '0 100% 40%' } },
    { name: 'Walmart (Dark)', colors: { theme_primary: '207 100% 40%', theme_primary_foreground: '0 0% 100%', theme_secondary: '44 100% 30%', theme_secondary_foreground: '0 0% 100%', theme_accent: '44 100% 40%', theme_accent_foreground: '0 0% 100%', theme_background: '207 100% 5%', theme_foreground: '0 0% 100%', theme_card: '207 100% 8%', theme_card_foreground: '0 0% 100%', theme_muted: '207 100% 12%', theme_muted_foreground: '207 100% 70%', theme_border: '207 100% 15%', theme_input: '207 100% 15%', theme_destructive: '0 100% 40%' } },
    
    { name: 'Etsy (Light)', colors: { theme_primary: '19 87% 53%', theme_primary_foreground: '0 0% 100%', theme_secondary: '0 0% 13%', theme_secondary_foreground: '0 0% 100%', theme_accent: '0 0% 20%', theme_accent_foreground: '0 0% 100%', theme_background: '0 0% 100%', theme_foreground: '0 0% 10%', theme_card: '0 0% 100%', theme_card_foreground: '0 0% 10%', theme_muted: '0 0% 95%', theme_muted_foreground: '0 0% 40%', theme_border: '0 0% 90%', theme_input: '0 0% 90%', theme_destructive: '0 100% 40%' } },
    { name: 'Etsy (Dark)', colors: { theme_primary: '19 87% 53%', theme_primary_foreground: '0 0% 100%', theme_secondary: '0 0% 5%', theme_secondary_foreground: '0 0% 100%', theme_accent: '0 0% 10%', theme_accent_foreground: '0 0% 100%', theme_background: '0 0% 2%', theme_foreground: '0 0% 100%', theme_card: '0 0% 5%', theme_card_foreground: '0 0% 100%', theme_muted: '0 0% 8%', theme_muted_foreground: '0 0% 70%', theme_border: '0 0% 12%', theme_input: '0 0% 12%', theme_destructive: '0 100% 40%' } },
    
    { name: 'IKEA (Light)', colors: { theme_primary: '208 100% 32%', theme_primary_foreground: '0 0% 100%', theme_secondary: '48 100% 50%', theme_secondary_foreground: '208 100% 10%', theme_accent: '48 100% 60%', theme_accent_foreground: '208 100% 10%', theme_background: '0 0% 100%', theme_foreground: '208 100% 10%', theme_card: '0 0% 100%', theme_card_foreground: '208 100% 10%', theme_muted: '208 100% 95%', theme_muted_foreground: '208 100% 40%', theme_border: '208 100% 90%', theme_input: '208 100% 90%', theme_destructive: '0 100% 40%' } },
    { name: 'IKEA (Dark)', colors: { theme_primary: '208 100% 32%', theme_primary_foreground: '0 0% 100%', theme_secondary: '48 100% 30%', theme_secondary_foreground: '0 0% 100%', theme_accent: '48 100% 40%', theme_accent_foreground: '0 0% 100%', theme_background: '208 100% 5%', theme_foreground: '0 0% 100%', theme_card: '208 100% 8%', theme_card_foreground: '0 0% 100%', theme_muted: '208 100% 12%', theme_muted_foreground: '208 100% 70%', theme_border: '208 100% 15%', theme_input: '208 100% 15%', theme_destructive: '0 100% 40%' } },
    
    { name: 'Xbox (Dark)', colors: { theme_primary: '120 77% 28%', theme_primary_foreground: '0 0% 100%', theme_secondary: '0 0% 0%', theme_secondary_foreground: '0 0% 98%', theme_accent: '0 0% 10%', theme_accent_foreground: '0 0% 100%', theme_background: '0 0% 0%', theme_foreground: '0 0% 98%', theme_card: '0 0% 5%', theme_card_foreground: '0 0% 98%', theme_muted: '0 0% 10%', theme_muted_foreground: '0 0% 60%', theme_border: '0 0% 15%', theme_input: '0 0% 15%', theme_destructive: '0 100% 40%' } },
    { name: 'Xbox (Light)', colors: { theme_primary: '120 77% 28%', theme_primary_foreground: '0 0% 100%', theme_secondary: '0 0% 96%', theme_secondary_foreground: '0 0% 10%', theme_accent: '0 0% 90%', theme_accent_foreground: '0 0% 10%', theme_background: '0 0% 100%', theme_foreground: '0 0% 10%', theme_card: '0 0% 100%', theme_card_foreground: '0 0% 10%', theme_muted: '0 0% 96%', theme_muted_foreground: '0 0% 45%', theme_border: '0 0% 90%', theme_input: '0 0% 90%', theme_destructive: '0 100% 40%' } },
];


export default function AppearanceManagerPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fontOptions = Object.keys(fontMap);

  const form = useForm<AppearanceFormData>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: palettes[0].colors as any,
  });

  const fetchAppearance = useCallback(async () => {
    if (!user) return;
    try {
        const response = await fetch('/api/appearance/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: user.id }),
        });
        const result = await response.json();
        
        if (response.ok && result.appearance) {
            const data = result.appearance;
            form.reset({
                ...palettes[0].colors,
                ...data,
                font_primary: data.font_primary || 'Poppins',
                font_secondary: data.font_secondary || 'Poppins',
            });
        }
    } catch (error: any) {
        console.error('Error fetching appearance:', error);
    } finally {
        setIsLoading(false);
    }
  }, [user, form]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchAppearance();
    }
  }, [user, authLoading, fetchAppearance]);

  async function onSubmit(values: AppearanceFormData) {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
        const response = await fetch('/api/appearance/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                siteId: user.id,
                ...values,
            }),
        });

        if (response.ok) {
            toast({ title: 'Appearance settings saved!' });
        } else {
            const result = await response.json();
            throw new Error(result.error || 'Failed to save settings');
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error saving appearance', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handlePaletteSelect = (palette: typeof palettes[0]) => {
    Object.entries(palette.colors).forEach(([key, value]) => {
      form.setValue(key as keyof AppearanceFormData, value, { shouldDirty: true, shouldValidate: true });
    });
    toast({ title: `Applied "${palette.name}" palette.` });
  };

  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Appearance Manager</h1>
        <p className="text-muted-foreground">Customize the look and feel of your store with custom colors and fonts.</p>
      </div>

      <Card className="border-2 shadow-sm">
        <CardHeader className="bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-xl"><Palette className="h-5 w-5 text-primary"/> Premium Palettes (Light & Dark)</CardTitle>
          <CardDescription>Apply the look of popular platforms. Switch between Light and Dark versions.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {palettes.map((palette) => (
                    <button
                        key={palette.name}
                        type="button"
                        onClick={() => handlePaletteSelect(palette)}
                        className="p-3 border-2 rounded-xl hover:ring-4 hover:ring-primary/10 hover:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all group bg-card/50 text-left"
                    >
                        <div className="flex gap-0.5 h-10 w-full mb-3 rounded-lg overflow-hidden shadow-inner border border-border/50">
                            {Object.values(palette.colors).slice(0, 5).map((color, i) => (
                                <div key={i} className="flex-1" style={{ backgroundColor: `hsl(${color})` }} />
                            ))}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-wider truncate group-hover:text-primary">{palette.name}</p>
                    </button>
                ))}
            </div>
        </CardContent>
      </Card>

      <Card className="border-2 shadow-sm">
        <CardHeader className="bg-muted/30">
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary"/> Custom Styling</CardTitle>
          <CardDescription>Manually adjust colors and typography for your brand.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              
              <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                      <div className="h-1 w-8 bg-primary rounded-full" /> Brand Colors
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <FormField control={form.control} name="theme_primary" render={({ field }) => <ColorInput field={field} label="Primary (Brand)" />} />
                      <FormField control={form.control} name="theme_primary_foreground" render={({ field }) => <ColorInput field={field} label="Primary Text" />} />
                      <FormField control={form.control} name="theme_secondary" render={({ field }) => <ColorInput field={field} label="Secondary" />} />
                      <FormField control={form.control} name="theme_secondary_foreground" render={({ field }) => <ColorInput field={field} label="Secondary Text" />} />
                      <FormField control={form.control} name="theme_accent" render={({ field }) => <ColorInput field={field} label="Accent" />} />
                      <FormField control={form.control} name="theme_accent_foreground" render={({ field }) => <ColorInput field={field} label="Accent Text" />} />
                  </div>
              </div>

              <Separator />

              <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                      <div className="h-1 w-8 bg-primary rounded-full" /> Layout & UI
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <FormField control={form.control} name="theme_background" render={({ field }) => <ColorInput field={field} label="Background" />} />
                      <FormField control={form.control} name="theme_foreground" render={({ field }) => <ColorInput field={field} label="Foreground Text" />} />
                      <FormField control={form.control} name="theme_card" render={({ field }) => <ColorInput field={field} label="Cards & Surfaces" />} />
                      <FormField control={form.control} name="theme_card_foreground" render={({ field }) => <ColorInput field={field} label="Card Text" />} />
                      <FormField control={form.control} name="theme_muted" render={({ field }) => <ColorInput field={field} label="Muted BG" />} />
                      <FormField control={form.control} name="theme_muted_foreground" render={({ field }) => <ColorInput field={field} label="Muted Text" />} />
                      <FormField control={form.control} name="theme_border" render={({ field }) => <ColorInput field={field} label="Borders" />} />
                      <FormField control={form.control} name="theme_input" render={({ field }) => <ColorInput field={field} label="Inputs" />} />
                      <FormField control={form.control} name="theme_destructive" render={({ field }) => <ColorInput field={field} label="Danger (Destructive)" />} />
                  </div>
              </div>

              <Separator />

              <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                      <div className="h-1 w-8 bg-primary rounded-full" /> Typography
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="font_primary" render={({ field }) => (
                          <FormItem>
                              <FormLabel className="text-xs font-bold uppercase">Body Font</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                      <SelectTrigger className="h-11">
                                          <SelectValue placeholder="Select body font" />
                                      </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      {fontOptions.map(font => <SelectItem key={font} value={font}>{font}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                      )}/>
                      <FormField control={form.control} name="font_secondary" render={({ field }) => (
                          <FormItem>
                              <FormLabel className="text-xs font-bold uppercase">Headlines Font</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                      <SelectTrigger className="h-11">
                                          <SelectValue placeholder="Select headline font" />
                                      </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      {fontOptions.map(font => <SelectItem key={font} value={font}>{font}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                      )}/>
                  </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" disabled={isSubmitting} className="min-w-[200px] h-12 rounded-xl shadow-lg shadow-primary/20 font-bold">
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    'Save Appearance'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
