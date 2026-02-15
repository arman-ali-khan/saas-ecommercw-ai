
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
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Loader2, Palette } from 'lucide-react';
import { fontMap } from '@/lib/fonts';
import { Skeleton } from '@/components/ui/skeleton';

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

const ColorInput = ({ field, label }: { field: any, label: string }) => {
    const [h, s, l] = field.value ? field.value.split(' ').map((v: string) => v.replace('%','')) : [0,0,0];
    const hexColor = `hsl(${h} ${s}% ${l}%)`;
    
    return (
        <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="flex items-center gap-2">
                <Input type="color" value={hexColor} onChange={(e) => field.onChange(e.target.value)} className="w-12 h-10 p-1" />
                <FormControl>
                    <Input {...field} placeholder="e.g. 224 71% 4%" />
                </FormControl>
            </div>
            <FormMessage />
        </FormItem>
    );
};


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
        font_primary: 'Hind Siliguri',
        font_secondary: 'Orbitron',
    },
  });

  useEffect(() => {
    if (user && !authLoading) {
      setIsLoading(true);
      supabase
        .from('store_settings')
        .select('*')
        .eq('site_id', user.id)
        .single()
        .then(({ data, error }) => {
          if (data) {
            form.reset({
                theme_primary: data.theme_primary || '207 90% 61%',
                theme_secondary: data.theme_secondary || '217 33% 17%',
                theme_accent: data.theme_accent || '207 92% 77%',
                theme_background: data.theme_background || '224 71% 4%',
                theme_foreground: data.theme_foreground || '210 40% 98%',
                theme_card: data.theme_card || '224 71% 6%',
                font_primary: data.font_primary || 'Hind Siliguri',
                font_secondary: data.font_secondary || 'Orbitron',
            });
          }
          setIsLoading(false);
        });
    }
  }, [user, authLoading, form]);

  async function onSubmit(values: AppearanceFormData) {
    if (!user) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('store_settings').upsert({
      site_id: user.id,
      ...values,
    });
    
    setIsSubmitting(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Error saving appearance', description: error.message });
    } else {
      toast({ title: 'Appearance settings saved!', description: "Changes will be visible after reloading the store page." });
    }
  }

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
                <h3 className="text-lg font-semibold flex items-center gap-2"><Palette className="h-5 w-5"/> Colors</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField control={form.control} name="theme_primary" render={({ field }) => <ColorInput field={field} label="Primary" />} />
                    <FormField control={form.control} name="theme_secondary" render={({ field }) => <ColorInput field={field} label="Secondary" />} />
                    <FormField control={form.control} name="theme_accent" render={({ field }) => <ColorInput field={field} label="Accent" />} />
                    <FormField control={form.control} name="theme_background" render={({ field }) => <ColorInput field={field} label="Background" />} />
                    <FormField control={form.control} name="theme_foreground" render={({ field }) => <ColorInput field={field} label="Foreground" />} />
                    <FormField control={form.control} name="theme_card" render={({ field }) => <ColorInput field={field} label="Card" />} />
                </div>
            </div>

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

    