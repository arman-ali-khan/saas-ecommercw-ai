
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth';
import { useEffect, useState, useCallback } from 'react';
import { Loader2, Wand2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const aiSettingsSchema = z.object({
  gemini_api_key: z.string().optional(),
});

type AiSettingsFormData = z.infer<typeof aiSettingsSchema>;

export default function AiSettingsPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AiSettingsFormData>({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues: { gemini_api_key: '' },
  });

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        const response = await fetch('/api/ai-settings/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: user.id }),
        });
        const result = await response.json();
        
        if (response.ok) {
            form.reset({ gemini_api_key: result.gemini_api_key || '' });
        } else {
            throw new Error(result.error);
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error loading settings', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [user, form, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchSettings();
    }
  }, [user, authLoading, fetchSettings]);

  async function onSubmit(values: AiSettingsFormData) {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
        const response = await fetch('/api/ai-settings/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                siteId: user.id, 
                gemini_api_key: values.gemini_api_key 
            }),
        });

        const result = await response.json();

        if (response.ok) {
            toast({ title: 'AI settings saved!' });
        } else {
            throw new Error(result.error || 'Failed to save settings');
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error saving settings', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="-ml-4"><Link href="/admin/settings"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <h1 className="text-3xl font-bold tracking-tight">AI Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5" /> OpenRouter Configuration {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}</CardTitle>
          <CardDescription>
            Configure your OpenRouter API key to enable advanced AI-powered features like automated product descriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="gemini_api_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OpenRouter API Key</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="sk-or-v1-..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Get your API key from the{' '}
                      <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline font-bold text-primary">
                        OpenRouter Dashboard
                      </a>.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save AI Key
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
