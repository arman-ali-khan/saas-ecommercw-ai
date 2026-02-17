
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, ArrowLeft } from 'lucide-react';
import type { Address } from '@/types';

export const addressSchema = z.object({
  name: z.string().min(2, 'ঠিকানার একটি নাম দিন (যেমন, বাড়ি)।'),
  details: z.string().min(5, 'বিস্তারিত ঠিকানা লিখুন (যেমন, বাড়ির নম্বর, রাস্তা, এলাকা)।'),
  city: z.string().min(2, 'শহরের নাম লিখুন।'),
  phone: z.string().min(10, 'অনুগ্রহ করে একটি বৈধ ফোন নম্বর লিখুন।'),
  type: z.enum(['home', 'work', 'other']).default('other'),
});

export type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  isNew: boolean;
  initialData?: Partial<Address>;
  onSubmit: (data: AddressFormData) => Promise<void>;
  isSubmitting: boolean;
}

export default function ProfileAddressForm({ isNew, initialData, onSubmit, isSubmitting }: AddressFormProps) {
    const form = useForm<AddressFormData>({
        resolver: zodResolver(addressSchema),
        defaultValues: isNew ? 
            { name: '', details: '', city: '', phone: '', type: 'home' } : 
            {
                name: initialData?.name || '',
                details: initialData?.details || '',
                city: initialData?.city || '',
                phone: initialData?.phone || '',
                type: initialData?.type || 'other'
            },
    });

    return (
        <Card>
            <CardHeader>
                <div className='flex items-center gap-4 mb-4'>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/profile/addresses"><ArrowLeft /></Link>
                    </Button>
                    <div>
                        <CardTitle>{isNew ? 'নতুন ঠিকানা যোগ করুন' : 'ঠিকানা সম্পাদনা করুন'}</CardTitle>
                        <CardDescription>{isNew ? 'চেকআউটের জন্য একটি নতুন ঠিকানা যোগ করুন।' : 'আপনার সংরক্ষিত ঠিকানা আপডেট করুন।'}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                         <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>ঠিকানার নাম</FormLabel>
                                <FormControl><Input placeholder="e.g., বাড়ির ঠিকানা" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>ফোন নম্বর</FormLabel>
                                <FormControl><Input placeholder="01..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="details"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>বিস্তারিত ঠিকানা</FormLabel>
                                <FormControl><Textarea placeholder="বাড়ি #, রাস্তা #, এলাকা" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>শহর</FormLabel>
                                <FormControl><Input placeholder="e.g., ঢাকা" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>ঠিকানার ধরন</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="home" /></FormControl><FormLabel className="font-normal">বাড়ি</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="work" /></FormControl><FormLabel className="font-normal">অফিস</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="other" /></FormControl><FormLabel className="font-normal">অন্যান্য</FormLabel></FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'সংরক্ষণ করা হচ্ছে...' : 'সংরক্ষণ করুন'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
