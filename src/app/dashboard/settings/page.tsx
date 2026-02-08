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
import { Globe, BarChart, CreditCard } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

const saasSettingsSchema = z.object({
  platformName: z.string().min(2, { message: 'Platform name must be at least 2 characters.' }),
  platformDescription: z.string().min(10, { message: 'Platform description must be at least 10 characters.' }),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
});

const availableBankingMethods = [
  { id: 'bkash', label: 'বিকাশ' },
  { id: 'nagad', label: 'নগদ' },
  { id: 'rocket', label: 'রকেট' },
  { id: 'upay', label: 'উপায়' },
];

const paymentSettingsSchema = z.object({
  mobileBankingEnabled: z.boolean().default(false),
  mobileBankingNumber: z.string().optional(),
  acceptedBankingMethods: z.array(z.string()).default([]),
});

export default function SaasSettingsPage() {
  const { toast } = useToast();

  const saasForm = useForm<z.infer<typeof saasSettingsSchema>>({
    resolver: zodResolver(saasSettingsSchema),
    defaultValues: {
      platformName: 'বাংলা ন্যাচারালস',
      platformDescription: 'আপনার নিজস্ব ই-কমার্স সাম্রাজ্য তৈরি করার প্ল্যাটফর্ম।',
      seoTitle: 'বাংলা ন্যাচারালস | আপনার নিজস্ব ই-কমার্স প্ল্যাটফর্ম তৈরি করুন',
      seoDescription: 'বাংলা ন্যাচারালস স্যাস প্ল্যাটফর্ম আপনাকে একটি শক্তিশালী, ব্যক্তিগতকৃত এবং এআই-চালিত অনলাইন স্টোর চালু করার ক্ষমতা দেয়।',
      seoKeywords: 'ecommerce, saas, bangladesh, online store, natural products',
    },
  });

  const paymentForm = useForm<z.infer<typeof paymentSettingsSchema>>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      mobileBankingEnabled: true,
      mobileBankingNumber: '01234567890',
      acceptedBankingMethods: ['bkash', 'nagad'],
    },
  });

  function onSaasSubmit(values: z.infer<typeof saasSettingsSchema>) {
    console.log('Saving SaaS settings:', values);
    toast({
      title: 'Settings Saved!',
      description: 'Your platform settings have been successfully updated.',
    });
  }

  function onPaymentSubmit(values: z.infer<typeof paymentSettingsSchema>) {
    console.log('Saving Subscription Payment settings:', values);
    toast({
      title: 'Payment Settings Saved!',
      description: 'Subscription payment settings have been updated.',
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
              <Form {...saasForm}>
                <form onSubmit={saasForm.handleSubmit(onSaasSubmit)} className="space-y-8">
                  <FormField
                    control={saasForm.control}
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
                    control={saasForm.control}
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
               <Form {...saasForm}>
                 <form onSubmit={saasForm.handleSubmit(onSaasSubmit)} className="space-y-8">
                    <FormField
                        control={saasForm.control}
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
                        control={saasForm.control}
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
                        control={saasForm.control}
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
                    <CardTitle>Subscription Payment Settings</CardTitle>
                    <CardDescription>Configure how users pay for their subscription plans.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...paymentForm}>
                        <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-6">
                            <FormField
                                control={paymentForm.control}
                                name="mobileBankingEnabled"
                                render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                        Enable Mobile Banking for Subscriptions
                                    </FormLabel>
                                    <FormDescription>
                                        Allow users to pay for their plans using mobile banking.
                                    </FormDescription>
                                    </div>
                                    <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                    </FormControl>
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={paymentForm.control}
                                name="mobileBankingNumber"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mobile Banking Merchant Number</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., 01234567890" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                    The number users will send subscription payments to.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={paymentForm.control}
                                name="acceptedBankingMethods"
                                render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                    <FormLabel className="text-base">Accepted Methods</FormLabel>
                                    <FormDescription>
                                        Select which mobile banking services you accept for subscriptions.
                                    </FormDescription>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    {availableBankingMethods.map((item) => (
                                        <FormField
                                        key={item.id}
                                        control={paymentForm.control}
                                        name="acceptedBankingMethods"
                                        render={({ field }) => {
                                            return (
                                            <FormItem
                                                key={item.id}
                                                className="flex flex-row items-start space-x-3 space-y-0"
                                            >
                                                <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(item.id)}
                                                    onCheckedChange={(checked) => {
                                                    return checked
                                                        ? field.onChange([...(field.value ?? []), item.id])
                                                        : field.onChange(
                                                            field.value?.filter(
                                                                (value) => value !== item.id
                                                            )
                                                            );
                                                    }}
                                                />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                {item.label}
                                                </FormLabel>
                                            </FormItem>
                                            );
                                        }}
                                        />
                                    ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <div className="pt-4">
                                <Button type="submit">Save Payment Settings</Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
