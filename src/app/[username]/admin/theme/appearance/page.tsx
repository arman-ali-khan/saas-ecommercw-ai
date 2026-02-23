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
  theme_secondary: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
  theme_accent: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
  theme_background: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
  theme_foreground: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
  theme_card: z.string().regex(hslColorRegex, 'Invalid HSL color format'),
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
        return '#000000'; // Fallback for invalid format
    }
};

const ColorInput = ({ field, label }: { field: any, label: string }) => {
    const hexColor = hslStringToHex(field.value || '0 0% 0%');

    return (
        <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="flex items-center gap-2">
                 <Input
                    type="color"
                    value={hexColor}
                    onChange={(e) => field.onChange(hexToHslString(e.target.value))}
                    className="w-12 h-10 p-1 cursor-pointer"
                    />
                <FormControl>
                    <Input {...field} placeholder="e.g. 224 71% 4%" />
                </FormControl>
            </div>
            <FormMessage />
        </FormItem>
    );
};

const palettes = [
    { name: 'Default (Bangla Naturals)', colors: { theme_primary: '207 90% 61%', theme_secondary: '217 33% 17%', theme_accent: '207 92% 77%', theme_background: '224 71% 4%', theme_foreground: '210 40% 98%', theme_card: '224 71% 6%' } },
    { name: 'Amazon', colors: { theme_primary: '36 100% 50%', theme_secondary: '215 28% 19%', theme_accent: '215 28% 25%', theme_background: '0 0% 100%', theme_foreground: '215 28% 10%', theme_card: '0 0% 98%' } },
    { name: 'Daraz', colors: { theme_primary: '22 89% 54%', theme_secondary: '210 100% 27%', theme_accent: '210 100% 35%', theme_background: '0 0% 100%', theme_foreground: '210 100% 10%', theme_card: '0 0% 98%' } },
    { name: 'AliExpress', colors: { theme_primary: '0 100% 64%', theme_secondary: '0 0% 13%', theme_accent: '0 0% 20%', theme_background: '0 0% 100%', theme_foreground: '0 0% 10%', theme_card: '0 0% 98%' } },
    { name: 'eBay', colors: { theme_primary: '358 78% 55%', theme_secondary: '211 100% 41%', theme_accent: '211 100% 50%', theme_background: '0 0% 100%', theme_foreground: '0 0% 10%', theme_card: '0 0% 100%' } },
    { name: 'Walmart', colors: { theme_primary: '207 100% 40%', theme_secondary: '44 100% 56%', theme_accent: '44 100% 65%', theme_background: '0 0% 100%', theme_foreground: '207 100% 10%', theme_card: '0 0% 98%' } },
    { name: 'Etsy', colors: { theme_primary: '19 87% 53%', theme_secondary: '0 0% 13%', theme_accent: '0 0% 20%', theme_background: '0 0% 100%', theme_foreground: '0 0% 10%', theme_card: '0 0% 100%' } },
    { name: 'Shein', colors: { theme_primary: '0 0% 0%', theme_secondary: '0 0% 100%', theme_accent: '0 0% 20%', theme_background: '0 0% 100%', theme_foreground: '0 0% 0%', theme_card: '0 0% 98%' } },
    { name: 'IKEA', colors: { theme_primary: '208 100% 32%', theme_secondary: '48 100% 50%', theme_accent: '48 100% 60%', theme_background: '0 0% 100%', theme_foreground: '208 100% 10%', theme_card: '0 0% 100%' } },
    { name: 'Chaldal', colors: { theme_primary: '149 100% 31%', theme_secondary: '48 100% 50%', theme_accent: '48 100% 60%', theme_background: '0 0% 100%', theme_foreground: '149 100% 10%', theme_card: '0 0% 98%' } },
    { name: 'Pickaboo', colors: { theme_primary: '195 100% 44%', theme_secondary: '0 0% 13%', theme_accent: '0 0% 20%', theme_background: '0 0% 100%', theme_foreground: '0 0% 10%', theme_card: '0 0% 100%' } },
    { name: 'Shajgoj', colors: { theme_primary: '340 82% 52%', theme_secondary: '340 82% 95%', theme_accent: '340 82% 80%', theme_background: '0 0% 100%', theme_foreground: '340 82% 10%', theme_card: '0 0% 100%' } },
    { name: 'Ozon', colors: { theme_primary: '219 100% 50%', theme_secondary: '330 100% 48%', theme_accent: '330 100% 60%', theme_background: '0 0% 100%', theme_foreground: '219 100% 10%', theme_card: '0 0% 100%' } },
    { name: 'Xbox', colors: { theme_primary: '120 77% 28%', theme_secondary: '0 0% 0%', theme_accent: '0 0% 10%', theme_background: '0 0% 0%', theme_foreground: '0 0% 98%', theme_card: '0 0% 5%' } },
];


export default function AppearanceManagerPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fontOptions = Object.keys(fontMap);

  const form = useForm<AppearanceFormData>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
        theme_primary: '207 90% 61%',
        theme_secondary: '217 33% 17%',
        theme_accent: '207 92% 77%',
        theme_background: '224 71% 4%',
        theme_foreground: '210 40% 98%',
        theme_card: '224 71% 6%',
        font_primary: 'Poppins',
        font_secondary: 'Poppins',
    },
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
                theme_primary: data.theme_primary || '207 90% 61%',
                theme_secondary: data.theme_secondary || '217 33% 17%',
                theme_accent: data.theme_accent || '207 92% 77%',
                theme_background: data.theme_background || '224 71% 4%',
                theme_foreground: data.theme_foreground || '210 40% 98%',
                theme_card: data.theme_card || '224 71% 6%',
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
            <div className="space-y-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-96" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-xl" />
                        ))}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </CardHeader>
                <CardContent className="space-y-10">
                    <div className="grid md:grid-cols-3 gap-6">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                    <Separator />
                    <div className="grid md:grid-cols-3 gap-6">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Skeleton className="h-12 w-48 rounded-md" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Appearance Manager</h1>
        <p className="text-muted-foreground">Customize the look and feel of your store with custom colors and fonts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5"/> E-commerce Brand Palettes</CardTitle>
          <CardDescription>Apply the iconic look of popular e-commerce platforms to your store.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {palettes.map((palette) => (
                    <button
                        key={palette.name}
                        type="button"
                        onClick={() => handlePaletteSelect(palette)}
                        className="p-3 border rounded-xl hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-ring transition-all group bg-card/50"
                    >
                        <div className="flex gap-1 h-12 w-full mb-3 rounded-lg overflow-hidden shadow-inner">
                            {Object.values(palette.colors).map((color, i) => (
                                <div key={i} className="flex-1" style={{ backgroundColor: `hsl(${color})` }} />
                            ))}
                        </div>
                        <p className="text-xs font-semibold truncate group-hover:text-primary">{palette.name}</p>
                    </button>
                ))}
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Styling</CardTitle>
          <CardDescription>Manually adjust specific colors and typography.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              
              <div className="space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Brand Colors</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <FormField control={form.control} name="theme_primary" render={({ field }) => <ColorInput field={field} label="Primary Color" />} />
                      <FormField control={form.control} name="theme_secondary" render={({ field }) => <ColorInput field={field} label="Secondary Color" />} />
                      <FormField control={form.control} name="theme_accent" render={({ field }) => <ColorInput field={field} label="Accent Color" />} />
                  </div>
              </div>

              <Separator />

              <div className="space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Interface Colors</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <FormField control={form.control} name="theme_background" render={({ field }) => <ColorInput field={field} label="Background" />} />
                      <FormField control={form.control} name="theme_foreground" render={({ field }) => <ColorInput field={field} label="Text / Foreground" />} />
                      <FormField control={form.control} name="theme_card" render={({ field }) => <ColorInput field={field} label="Card / Surfaces" />} />
                  </div>
              </div>

              <Separator />

              <div className="space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Typography</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="font_primary" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Primary Font (Body)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                      <SelectTrigger>
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
                              <FormLabel>Secondary Font (Headlines)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                      <SelectTrigger>
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
                <Button type="submit" size="lg" disabled={isSubmitting} className="min-w-[200px]">
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
