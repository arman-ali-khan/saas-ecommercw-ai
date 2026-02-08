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
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Globe, BarChart, CreditCard, Power, PowerOff } from 'lucide-react';

const settingsSchema = z.object({
  platformName: z.string().min(2, { message: 'Platform name must be at least 2 characters.' }),
  platformDescription: z.string().min(10, { message: 'Platform description must be at least 10 characters.' }),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
});

// Mock payment gateways state
const paymentGateways = [
    { id: 'stripe', name: 'Stripe', connected: true },
    { id: 'paypal', name: 'PayPal', connected: false },
    { id: 'bkash', name: 'bKash', connected: false },
];


export default function SaasSettingsPage() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      platformName: 'বাংলা ন্যাচারালস',
      platformDescription: 'আপনার নিজস্ব ই-কমার্স সাম্রাজ্য তৈরি করার প্ল্যাটফর্ম।',
      seoTitle: 'বাংলা ন্যাচারালস | আপনার নিজস্ব ই-কমার্স প্ল্যাটফর্ম তৈরি করুন',
      seoDescription: 'বাংলা ন্যাচারালস স্যাস প্ল্যাটফর্ম আপনাকে একটি শক্তিশালী, ব্যক্তিগতকৃত এবং এআই-চালিত অনলাইন স্টোর চালু করার ক্ষমতা দেয়।',
      seoKeywords: 'ecommerce, saas, bangladesh, online store, natural products',
    },
  });

  function onSubmit(values: z.infer<typeof settingsSchema>) {
    console.log('Saving SaaS settings:', values);
    toast({
      title: 'Settings Saved!',
      description: 'Your platform settings have been successfully updated.',
    });
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SaaS Platform Settings</h1>
        <p className="text-muted-foreground">Manage your platform's global settings.</p>
      </div>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general"><Globe className='mr-2' /> General</TabsTrigger>
          <TabsTrigger value="seo"><BarChart className='mr-2' /> SEO</TabsTrigger>
          <TabsTrigger value="payments"><CreditCard className='mr-2' /> Payments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Update your platform's public-facing name and description.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="platformName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your SaaS Name" {...field} />
                        </FormControl>
                        <FormDescription>
                          This will be displayed on the main landing page and in browser tabs.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="platformDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="A short description of your platform..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A brief summary of your SaaS platform.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Save General Settings</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>Search Engine Optimization (SEO)</CardTitle>
              <CardDescription>Manage SEO settings for your main landing page.</CardDescription>
            </CardHeader>
            <CardContent>
               <Form {...form}>
                 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="seoTitle"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>SEO Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Your Platform - The Best Solution For..." {...field} />
                            </FormControl>
                            <FormDescription>
                                The title that appears in search engine results. If empty, the platform name will be used.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="seoDescription"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>SEO Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="A compelling description for search engines..."
                                    rows={3}
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                The description that appears in search engine results. If empty, the platform description will be used.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="seoKeywords"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>SEO Keywords</FormLabel>
                            <FormControl>
                                <Input placeholder="keyword1, keyword2, keyword3" {...field} />
                            </FormControl>
                            <FormDescription>
                                Comma-separated keywords related to your platform.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit">Save SEO Settings</Button>
                </form>
               </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
            <Card>
                <CardHeader>
                    <CardTitle>Payment Gateway Integrations</CardTitle>
                    <CardDescription>Connect and manage payment providers for your subscriptions.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {paymentGateways.map(gateway => (
                        <Card key={gateway.id} className='flex items-center justify-between p-4'>
                            <div className='flex items-center gap-4'>
                                <div className='font-bold text-lg'>{gateway.name}</div>
                                {gateway.connected ? (
                                    <span className='text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full'>Connected</span>
                                ) : (
                                    <span className='text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full'>Not Connected</span>
                                )}
                            </div>
                            <Button variant={gateway.connected ? 'destructive' : 'default'}>
                                {gateway.connected ? <PowerOff className='mr-2'/> : <Power className='mr-2' />}
                                {gateway.connected ? 'Disconnect' : 'Connect'}
                            </Button>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}