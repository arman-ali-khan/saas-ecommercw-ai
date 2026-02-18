
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
import { Loader2, Wand2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
    } else if (!authLoading && !user) {
        setIsLoading(false);
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

  if (isLoading || authLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96 mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-32" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wand2 /> AI Settings</CardTitle>
        <CardDescription>
          Configure your Gemini API key to enable AI-powered features like product description generation.
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
                  <FormLabel>Gemini API Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your Google AI Studio API Key" {...field} />
                  </FormControl>
                  <FormDescription>
                    You can get your key from{' '}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">
                      Google AI Studio
                    </a>.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save API Key
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
