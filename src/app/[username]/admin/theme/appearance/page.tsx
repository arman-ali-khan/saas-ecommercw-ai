'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Loader2, Palette, Sun, Moon } from 'lucide-react';
import { fontMap } from '@/lib/fonts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

const hslColorRegex = /^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/;

const appearanceSchema = z.object({
  theme_mode: z.enum(['light', 'dark']).default('light'),
  theme_primary: z.string().optional().or(z.null()).or(z.literal('')),
  theme_primary_foreground: z.string().optional().or(z.null()).or(z.literal('')),
  theme_secondary: z.string().optional().or(z.null()).or(z.literal('')),
  theme_secondary_foreground: z.string().optional().or(z.null()).or(z.literal('')),
  theme_accent: z.string().optional().or(z.null()).or(z.literal('')),
  theme_accent_foreground: z.string().optional().or(z.null()).or(z.literal('')),
  theme_background: z.string().optional().or(z.null()).or(z.literal('')),
  theme_foreground: z.string().optional().or(z.null()).or(z.literal('')),
  theme_card: z.string().optional().or(z.null()).or(z.literal('')),
  theme_card_foreground: z.string().optional().or(z.null()).or(z.literal('')),
  theme_muted: z.string().optional().or(z.null()).or(z.literal('')),
  theme_muted_foreground: z.string().optional().or(z.null()).or(z.literal('')),
  theme_border: z.string().optional().or(z.null()).or(z.literal('')),
  theme_input: z.string().optional().or(z.null()).or(z.literal('')),
  theme_destructive: z.string().optional().or(z.null()).or(z.literal('')),
  font_primary: z.string().min(1, 'Primary font is required'),
  font_secondary: z.string().min(1, 'Secondary font is required'),
});

type AppearanceFormData = z.infer<typeof appearanceSchema>;

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

const hslStringToHex = (hsl: string) => {
    try {
        if (!hsl || !hslColorRegex.test(hsl)) return '#000000';
        let [h, s, l] = hsl.split(' ').map(v => parseInt(v.replace('%', '')));
        s /= 100; l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;
        if (0 <= h && h < 60) [r, g, b] = [c, x, 0];
        else if (60 <= h && h < 120) [r, g, b] = [x, c, 0];
        else if (120 <= h && h < 180) [r, g, b] = [0, c, x];
        else if (180 <= h && h < 240) [r, g, b] = [0, x, 0];
        else if (240 <= h && h < 300) [r, g, b] = [x, 0, c];
        else if (300 <= h && h <= 360) [r, g, b] = [c, 0, x];
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        const toHex = (num: number) => ('0' + num.toString(16)).slice(-2);
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch (e) { return '#000000'; }
};

const ColorInput = ({ field, label }: { field: any, label: string }) => {
    const hexColorVal = hslStringToHex(field.value || '0 0% 0%');
    return (
        <FormItem>
            <FormLabel className="text-xs font-bold uppercase tracking-wider">{label}</FormLabel>
            <div className="flex items-center gap-2">
                 <Input type="color" value={hexColorVal} onChange={(e) => field.onChange(hexToHslString(e.target.value))} className="w-12 h-10 p-1 cursor-pointer shrink-0" />
                <FormControl><Input {...field} placeholder="e.g. 224 71% 4%" className="font-mono text-xs" /></FormControl>
            </div>
            <FormMessage />
        </FormItem>
    );
};

const PREMIUM_PALETTES = [
    { name: 'eHut (Dark)', colors: { theme_primary: '207 90% 61%', theme_primary_foreground: '224 71% 4%', theme_secondary: '217 33% 17%', theme_secondary_foreground: '210 40% 98%', theme_accent: '207 92% 77%', theme_accent_foreground: '224 71% 4%', theme_background: '224 71% 4%', theme_foreground: '210 40% 98%', theme_card: '224 71% 6%', theme_card_foreground: '210 40% 98%', theme_muted: '217 33% 17%', theme_muted_foreground: '215 20% 65%', theme_border: '217 33% 27%', theme_input: '217 33% 27%', theme_destructive: '0 63% 31%' } },
    { name: 'eHut (Light)', colors: { theme_primary: '207 90% 61%', theme_primary_foreground: '0 0% 100%', theme_secondary: '210 40% 96%', theme_secondary_foreground: '224 71% 4%', theme_accent: '207 92% 77%', theme_accent_foreground: '224 71% 4%', theme_background: '0 0% 100%', theme_foreground: '224 71% 4%', theme_card: '0 0% 100%', theme_card_foreground: '224 71% 4%', theme_muted: '210 40% 96%', theme_muted_foreground: '215 20% 45%', theme_border: '214 32% 91%', theme_input: '214 32% 91%', theme_destructive: '0 84% 60%' } },
    { name: 'Amazon (Light)', colors: { theme_primary: '36 100% 50%', theme_primary_foreground: '0 0% 100%', theme_secondary: '215 28% 19%', theme_secondary_foreground: '0 0% 100%', theme_accent: '36 100% 60%', theme_accent_foreground: '0 0% 100%', theme_background: '0 0% 100%', theme_foreground: '215 28% 10%', theme_card: '0 0% 98%', theme_card_foreground: '215 28% 10%', theme_muted: '215 28% 95%', theme_muted_foreground: '215 28% 40%', theme_border: '215 28% 90%', theme_input: '215 28% 90%', theme_destructive: '0 100% 40%' } },
    { name: 'Amazon (Dark)', colors: { theme_primary: '36 100% 50%', theme_primary_foreground: '0 0% 100%', theme_secondary: '215 28% 10%', theme_secondary_foreground: '0 0% 100%', theme_accent: '36 100% 40%', theme_accent_foreground: '0 0% 100%', theme_background: '215 28% 5%', theme_foreground: '0 0% 100%', theme_card: '215 28% 8%', theme_card_foreground: '0 0% 100%', theme_muted: '215 28% 12%', theme_muted_foreground: '215 28% 70%', theme_border: '215 28% 15%', theme_input: '215 28% 15%', theme_destructive: '0 100% 40%' } },
    { name: 'Daraz (Light)', colors: { theme_primary: '22 89% 54%', theme_primary_foreground: '0 0% 100%', theme_secondary: '210 100% 27%', theme_secondary_foreground: '0 0% 100%', theme_accent: '210 100% 35%', theme_accent_foreground: '0 0% 100%', theme_background: '0 0% 100%', theme_foreground: '210 100% 10%', theme_card: '0 0% 98%', theme_card_foreground: '210 100% 10%', theme_muted: '210 100% 95%', theme_muted_foreground: '210 100% 40%', theme_border: '210 100% 90%', theme_input: '210 100% 90%', theme_destructive: '0 100% 40%' } },
];

export default function AppearanceManagerPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fontOptions = Object.keys(fontMap);

  const form = useForm<AppearanceFormData>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: { ...PREMIUM_PALETTES[0].colors, theme_mode: 'light', font_primary: 'Poppins', font_secondary: 'Poppins' } as any,
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
            const sanitized: any = { ...PREMIUM_PALETTES[0].colors };
            Object.keys(PREMIUM_PALETTES[0].colors).forEach(k => { if (data[k]) sanitized[k] = data[k]; });
            form.reset({ ...sanitized, theme_mode: data.theme_mode || 'light', font_primary: data.font_primary || 'Poppins', font_secondary: data.font_secondary || 'Poppins' });
        }
    } catch (e) { console.error('Error fetching appearance:', e); } finally { setIsLoading(false); }
  }, [user, form]);

  useEffect(() => { if (user && !authLoading) fetchAppearance(); }, [user, authLoading, fetchAppearance]);

  async function onSubmit(values: AppearanceFormData) {
    if (!user) return;
    setIsSubmitting(true);
    try {
        const res = await fetch('/api/appearance/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: user.id, ...values }) });
        if (res.ok) toast({ title: 'Appearance settings saved!' });
        else throw new Error('Save failed');
    } catch (e: any) { toast({ variant: 'destructive', title: 'Error saving appearance', description: e.message }); } finally { setIsSubmitting(false); }
  }

  const handlePaletteSelect = (pal: typeof PREMIUM_PALETTES[0]) => {
    Object.entries(pal.colors).forEach(([k, v]) => form.setValue(k as any, v, { shouldDirty: true, shouldValidate: true }));
    toast({ title: `Applied "${pal.name}" palette.` });
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-40 w-full" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-3xl font-bold tracking-tight">Appearance Manager</h1>
      <Card className="border-2"><CardHeader className="bg-muted/30"><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary"/> Premium Palettes</CardTitle></CardHeader>
        <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {PREMIUM_PALETTES.map((p) => (
                    <button key={p.name} type="button" onClick={() => handlePaletteSelect(p)} className="p-3 border-2 rounded-xl hover:ring-4 hover:ring-primary/10 hover:border-primary transition-all bg-card/50 text-left">
                        <div className="flex gap-0.5 h-10 w-full mb-3 rounded-lg overflow-hidden border">
                            {Object.values(p.colors).slice(0, 5).map((c, i) => <div key={i} className="flex-1" style={{ backgroundColor: `hsl(${c})` }} />)}
                        </div>
                        <p className="text-[10px] font-black uppercase truncate">{p.name}</p>
                    </button>
                ))}
            </div>
        </CardContent>
      </Card>
      <Card className="border-2"><CardHeader className="bg-muted/30"><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary"/> Custom Styling</CardTitle></CardHeader>
        <CardContent className="pt-6">
          <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField control={form.control} name="theme_primary" render={({ field }) => <ColorInput field={field} label="Primary (Brand)" />} />
                  <FormField control={form.control} name="theme_primary_foreground" render={({ field }) => <ColorInput field={field} label="Primary Text" />} />
                  <FormField control={form.control} name="theme_background" render={({ field }) => <ColorInput field={field} label="Background" />} />
                  <FormField control={form.control} name="theme_foreground" render={({ field }) => <ColorInput field={field} label="Foreground Text" />} />
                  <FormField control={form.control} name="theme_border" render={({ field }) => <ColorInput field={field} label="Borders" />} />
                  <FormField control={form.control} name="theme_destructive" render={({ field }) => <ColorInput field={field} label="Danger (Destructive)" />} />
              </div>
              <div className="flex justify-end pt-4"><Button type="submit" size="lg" disabled={isSubmitting} className="min-w-[200px] h-12 rounded-xl shadow-lg font-bold">{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Appearance'}</Button></div>
            </form></Form>
        </CardContent>
      </Card>
    </div>
  );
}
