
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth';
import { useEffect, useState, useCallback } from 'react';
import { Loader2, Palette, Sun, Moon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

const appearanceSchema = z.object({
  theme_mode: z.enum(['light', 'dark']).default('light'),
  theme_primary: z.string().optional().or(z.null()),
  theme_primary_foreground: z.string().optional().or(z.null()),
  theme_secondary: z.string().optional().or(z.null()),
  theme_secondary_foreground: z.string().optional().or(z.null()),
  theme_accent: z.string().optional().or(z.null()),
  theme_accent_foreground: z.string().optional().or(z.null()),
  theme_background: z.string().optional().or(z.null()),
  theme_foreground: z.string().optional().or(z.null()),
  theme_card: z.string().optional().or(z.null()),
  theme_card_foreground: z.string().optional().or(z.null()),
  theme_muted: z.string().optional().or(z.null()),
  theme_muted_foreground: z.string().optional().or(z.null()),
  theme_border: z.string().optional().or(z.null()),
  theme_input: z.string().optional().or(z.null()),
  theme_destructive: z.string().optional().or(z.null()),
  font_primary: z.string().min(1).default('Poppins'),
  font_secondary: z.string().min(1).default('Poppins'),
});

type AppearanceFormData = z.infer<typeof appearanceSchema>;

const hexToHslString = (hexValue: string) => {
    let cleanHex = hexValue.replace(/^#/, '');
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(char => char + char).join('');
    }
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    const maxVal = Math.max(r, g, b);
    const minVal = Math.min(r, g, b);
    let h = 0, s = 0, l = (maxVal + minVal) / 2;
    if (maxVal !== minVal) {
        const d = maxVal - minVal;
        s = l > 0.5 ? d / (2 - maxVal - minVal) : d / (maxVal + minVal);
        switch (maxVal) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        if (h) h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const hslStringToHex = (hslValue: string | null | undefined) => {
    if (!hslValue) return '#000000';
    try {
        const parts = hslValue.split(' ').map(v => parseInt(v.replace('%', '')));
        if (parts.length !== 3) return '#000000';
        let [h, s, l] = parts;
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
    const hexColorVal = hslStringToHex(field.value);
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

const BRAND_PALETTES = [
    { name: 'Default', colors: { theme_primary: '207 90% 61%', theme_primary_foreground: '224 71% 4%', theme_secondary: '217 33% 17%', theme_secondary_foreground: '210 40% 98%', theme_accent: '207 92% 77%', theme_accent_foreground: '224 71% 4%', theme_background: '0 0% 100%', theme_foreground: '224 71% 4%', theme_card: '0 0% 98%', theme_card_foreground: '224 71% 4%', theme_muted: '217 33% 95%', theme_muted_foreground: '215 20% 40%', theme_border: '217 33% 90%', theme_input: '217 33% 90%', theme_destructive: '0 100% 40%' } },
    { name: 'Amazon Light', colors: { theme_primary: '36 100% 50%', theme_primary_foreground: '0 0% 100%', theme_secondary: '215 28% 19%', theme_secondary_foreground: '0 0% 100%', theme_accent: '36 100% 60%', theme_accent_foreground: '0 0% 100%', theme_background: '0 0% 100%', theme_foreground: '215 28% 10%', theme_card: '0 0% 98%', theme_card_foreground: '215 28% 10%', theme_muted: '215 28% 95%', theme_muted_foreground: '215 28% 40%', theme_border: '215 28% 90%', theme_input: '215 28% 90%', theme_destructive: '0 100% 40%' } },
    { name: 'Daraz Light', colors: { theme_primary: '20 95% 50%', theme_primary_foreground: '0 0% 100%', theme_secondary: '214 100% 21%', theme_secondary_foreground: '0 0% 100%', theme_accent: '214 100% 35%', theme_accent_foreground: '0 0% 100%', theme_background: '0 0% 100%', theme_foreground: '214 100% 10%', theme_card: '0 0% 98%', theme_card_foreground: '214 100% 10%', theme_muted: '214 100% 95%', theme_muted_foreground: '214 100% 40%', theme_border: '214 100% 90%', theme_input: '214 100% 90%', theme_destructive: '0 100% 40%' } },
    { name: 'AliExpress Light', colors: { theme_primary: '11 97% 46%', theme_primary_foreground: '0 0% 100%', theme_secondary: '0 0% 10%', theme_secondary_foreground: '0 0% 100%', theme_accent: '0 100% 64%', theme_accent_foreground: '0 0% 100%', theme_background: '0 0% 100%', theme_foreground: '0 0% 15%', theme_card: '0 0% 98%', theme_card_foreground: '0 0% 15%', theme_muted: '0 0% 95%', theme_muted_foreground: '0 0% 40%', theme_border: '0 0% 90%', theme_input: '0 0% 90%', theme_destructive: '0 100% 40%' } },
    { name: 'eBay Light', colors: { theme_primary: '210 100% 31%', theme_primary_foreground: '0 0% 100%', theme_secondary: '142 71% 45%', theme_secondary_foreground: '0 0% 100%', theme_accent: '48 100% 50%', theme_accent_foreground: '0 0% 10%', theme_background: '0 0% 100%', theme_foreground: '0 0% 10%', theme_card: '0 0% 98%', theme_card_foreground: '0 0% 10%', theme_muted: '0 0% 95%', theme_muted_foreground: '0 0% 40%', theme_border: '0 0% 90%', theme_input: '0 0% 90%', theme_destructive: '358 76% 55%' } },
    { name: 'Walmart Light', colors: { theme_primary: '207 100% 40%', theme_primary_foreground: '0 0% 100%', theme_secondary: '46 100% 56%', theme_secondary_foreground: '0 0% 10%', theme_accent: '207 100% 50%', theme_accent_foreground: '0 0% 100%', theme_background: '0 0% 100%', theme_foreground: '207 100% 10%', theme_card: '0 0% 98%', theme_card_foreground: '207 100% 10%', theme_muted: '207 100% 95%', theme_muted_foreground: '207 100% 40%', theme_border: '207 100% 90%', theme_input: '207 100% 90%', theme_destructive: '0 100% 40%' } },
    { name: 'Etsy Light', colors: { theme_primary: '19 88% 53%', theme_primary_foreground: '0 0% 100%', theme_secondary: '168 36% 25%', theme_secondary_foreground: '0 0% 100%', theme_accent: '19 88% 65%', theme_accent_foreground: '0 0% 100%', theme_background: '0 0% 100%', theme_foreground: '19 88% 10%', theme_card: '0 0% 98%', theme_card_foreground: '19 88% 10%', theme_muted: '19 88% 95%', theme_muted_foreground: '19 88% 40%', theme_border: '19 88% 90%', theme_input: '19 88% 90%', theme_destructive: '0 100% 40%' } },
    { name: 'IKEA Light', colors: { theme_primary: '214 100% 36%', theme_primary_foreground: '0 0% 100%', theme_secondary: '51 100% 55%', theme_secondary_foreground: '0 0% 10%', theme_accent: '214 100% 45%', theme_accent_foreground: '0 0% 100%', theme_background: '0 0% 100%', theme_foreground: '214 100% 10%', theme_card: '0 0% 98%', theme_card_foreground: '214 100% 10%', theme_muted: '214 100% 95%', theme_muted_foreground: '214 100% 40%', theme_border: '214 100% 90%', theme_input: '214 100% 90%', theme_destructive: '0 100% 40%' } },
    { name: 'Xbox Light', colors: { theme_primary: '120 77% 28%', theme_primary_foreground: '0 0% 100%', theme_secondary: '0 0% 10%', theme_secondary_foreground: '0 0% 100%', theme_accent: '120 77% 40%', theme_accent_foreground: '0 0% 100%', theme_background: '0 0% 100%', theme_foreground: '120 77% 5%', theme_card: '0 0% 98%', theme_card_foreground: '120 77% 5%', theme_muted: '120 77% 95%', theme_muted_foreground: '120 77% 40%', theme_border: '120 77% 90%', theme_input: '120 77% 90%', theme_destructive: '0 100% 40%' } },
];

export default function AppearanceManagerPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AppearanceFormData>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: { theme_mode: 'light', font_primary: 'Poppins', font_secondary: 'Poppins' },
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
                theme_mode: data.theme_mode || 'light',
                theme_primary: data.theme_primary || '',
                theme_primary_foreground: data.theme_primary_foreground || '',
                theme_secondary: data.theme_secondary || '',
                theme_secondary_foreground: data.theme_secondary_foreground || '',
                theme_accent: data.theme_accent || '',
                theme_accent_foreground: data.theme_accent_foreground || '',
                theme_background: data.theme_background || '',
                theme_foreground: data.theme_foreground || '',
                theme_card: data.theme_card || '',
                theme_card_foreground: data.theme_card_foreground || '',
                theme_muted: data.theme_muted || '',
                theme_muted_foreground: data.theme_muted_foreground || '',
                theme_border: data.theme_border || '',
                theme_input: data.theme_input || '',
                theme_destructive: data.theme_destructive || '',
                font_primary: data.font_primary || 'Poppins',
                font_secondary: data.font_secondary || 'Poppins',
            });
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

  const handlePaletteSelect = (pal: typeof BRAND_PALETTES[0]) => {
    Object.entries(pal.colors).forEach(([k, v]) => form.setValue(k as any, v, { shouldDirty: true, shouldValidate: true }));
    toast({ title: `Applied "${pal.name}" palette.` });
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-40 w-full" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-3xl font-bold tracking-tight">Appearance Manager</h1>
      
      <Card className="border-2">
        <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary"/> Premium Palettes</CardTitle>
            <CardDescription>One-click Light themes based on global brands.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {BRAND_PALETTES.map((paletteRecord) => (
                    <button key={paletteRecord.name} type="button" onClick={() => handlePaletteSelect(paletteRecord)} className="p-3 border-2 rounded-xl hover:ring-4 hover:ring-primary/10 hover:border-primary transition-all bg-card/50 text-left group">
                        <div className="flex gap-0.5 h-10 w-full mb-3 rounded-lg overflow-hidden border">
                            <div className="flex-1" style={{ backgroundColor: `hsl(${paletteRecord.colors.theme_primary})` }} />
                            <div className="flex-1" style={{ backgroundColor: `hsl(${paletteRecord.colors.theme_secondary})` }} />
                            <div className="flex-1" style={{ backgroundColor: `hsl(${paletteRecord.colors.theme_background})` }} />
                        </div>
                        <p className="text-[10px] font-black uppercase truncate group-hover:text-primary transition-colors">{paletteRecord.name}</p>
                    </button>
                ))}
            </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-2">
            <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                    {form.watch('theme_mode') === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />} 
                    Default Store Theme Mode
                </CardTitle>
                <CardDescription>Choose the initial look for your customers. They can toggle this themselves on the storefront.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <FormField control={form.control} name="theme_mode" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/20">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base font-bold">Default Dark Mode</FormLabel>
                            <FormDescription>Set dark mode as the default for all visitors.</FormDescription>
                        </div>
                        <FormControl>
                            <Switch checked={field.value === 'dark'} onCheckedChange={(val) => field.onChange(val ? 'dark' : 'light')} />
                        </FormControl>
                    </FormItem>
                )} />
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="bg-muted/30"><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary"/> Custom Styling</CardTitle></CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FormField control={form.control} name="theme_primary" render={({ field }) => <ColorInput field={field} label="Primary Color" />} />
                    <FormField control={form.control} name="theme_primary_foreground" render={({ field }) => <ColorInput field={field} label="Primary Text" />} />
                    <FormField control={form.control} name="theme_background" render={({ field }) => <ColorInput field={field} label="Background" />} />
                    <FormField control={form.control} name="theme_foreground" render={({ field }) => <ColorInput field={field} label="Foreground Text" />} />
                    <FormField control={form.control} name="theme_card" render={({ field }) => <ColorInput field={field} label="Card Background" />} />
                    <FormField control={form.control} name="theme_card_foreground" render={({ field }) => <ColorInput field={field} label="Card Text" />} />
                    <FormField control={form.control} name="theme_muted" render={({ field }) => <ColorInput field={field} label="Muted BG" />} />
                    <FormField control={form.control} name="theme_muted_foreground" render={({ field }) => <ColorInput field={field} label="Muted Text" />} />
                    <FormField control={form.control} name="theme_border" render={({ field }) => <ColorInput field={field} label="Borders" />} />
                    <FormField control={form.control} name="theme_input" render={({ field }) => <ColorInput field={field} label="Input Fields" />} />
                    <FormField control={form.control} name="theme_destructive" render={({ field }) => <ColorInput field={field} label="Danger (Destructive)" />} />
                </div>
                <div className="flex justify-end pt-10">
                    <Button type="submit" size="lg" disabled={isSubmitting} className="min-w-[200px] h-12 rounded-xl shadow-lg font-bold">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Appearance'}
                    </Button>
                </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
