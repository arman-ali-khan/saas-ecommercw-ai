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
        else if (180 <= h && h < 240) { [r, g, b] = [0, x, c]; }
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
// --- End conversion helpers ---


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
                    className="w-12 h-10 p-1"
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
    { name: 'Default Dark', colors: { theme_primary: '207 90% 61%', theme_secondary: '217 33% 17%', theme_accent: '207 92% 77%', theme_background: '224 71% 4%', theme_foreground: '210 40% 98%', theme_card: '224 71% 6%' } },
    { name: 'Amazon Inspired', colors: { theme_primary: '36 100% 50%', theme_secondary: '200 8% 18%', theme_accent: '199 95% 58%', theme_background: '200 10% 8%', theme_foreground: '0 0% 98%', theme_card: '200 9% 12%' } },
    { name: 'Crimson Night', colors: { theme_primary: '355 70% 58%', theme_secondary: '0 0% 13%', theme_accent: '346 41% 57%', theme_background: '0 0% 4%', theme_foreground: '0 0% 98%', theme_card: '0 0% 8%' } },
    { name: 'Oceanic', colors: { theme_primary: '221 41% 45%', theme_secondary: '221 59% 24%', theme_accent: '216 21% 77%', theme_background: '221 39% 11%', theme_foreground: '218 14% 86%', theme_card: '221 39% 15%' } },
    { name: 'Lavender Light', colors: { theme_primary: '255 26% 54%', theme_secondary: '251 29% 96%', theme_accent: '251 51% 80%', theme_background: '0 0% 100%', theme_foreground: '251 14% 11%', theme_card: '251 29% 98%' } },
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
        font_secondary: 'Orbitron',
    },
  });

  const fetchAppearance = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
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
                font_secondary: data.font_secondary || 'Orbitron',
            });
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error fetching appearance', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [user, form, toast]);

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
            toast({ title: 'Appearance settings saved!', description: "Changes will be visible after reloading the store page." });
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
        <Card>
            <CardHeader><Skeleton className="h-8 w-64" /></CardHeader>
            <CardContent className="space-y-8">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-10 w-32" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance Manager</CardTitle>
        <CardDescription>
          Customize the look and feel of your store with custom colors and fonts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Palette className="h-5 w-5"/> Color Palettes</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {palettes.map((palette) => (
                        <button
                            key={palette.name}
                            type="button"
                            onClick={() => handlePaletteSelect(palette)}
                            className="p-3 border rounded-lg hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <div className="flex gap-1 h-12 w-full mb-2">
                                {Object.values(palette.colors).map((color, i) => (
                                    <div key={i} className="flex-1 rounded-sm" style={{ backgroundColor: `hsl(${color})` }} />
                                ))}
                            </div>
                            <p className="text-sm font-medium">{palette.name}</p>
                        </button>
                    ))}
                 </div>
            </div>

            <Separator />
            
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">Customize Colors</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField control={form.control} name="theme_primary" render={({ field }) => <ColorInput field={field} label="Primary" />} />
                    <FormField control={form.control} name="theme_secondary" render={({ field }) => <ColorInput field={field} label="Secondary" />} />
                    <FormField control={form.control} name="theme_accent" render={({ field }) => <ColorInput field={field} label="Accent" />} />
                    <FormField control={form.control} name="theme_background" render={({ field }) => <ColorInput field={field} label="Background" />} />
                    <FormField control={form.control} name="theme_foreground" render={({ field }) => <ColorInput field={field} label="Foreground" />} />
                    <FormField control={form.control} name="theme_card" render={({ field }) => <ColorInput field={field} label="Card" />} />
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Fonts</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="font_primary" render={({ field }) => (<FormItem><FormLabel>Primary Font (Body)</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{fontOptions.map(font => <SelectItem key={font} value={font}>{font}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="font_secondary" render={({ field }) => (<FormItem><FormLabel>Secondary Font (Headlines)</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{fontOptions.map(font => <SelectItem key={font} value={font}>{font}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                </div>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Appearance
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
