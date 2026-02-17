
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
import { useTranslation } from '@/hooks/use-translation';

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
    const t = useTranslation();
    const { profile: t_profile } = t;

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
                        <CardTitle>{isNew ? t_profile.newAddress : t_profile.editAddress}</CardTitle>
                        <CardDescription>{isNew ? 'Add a new address for faster checkouts.' : 'Update your saved address.'}</CardDescription>
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
                                <FormLabel>{t_profile.addressName}</FormLabel>
                                <FormControl><Input placeholder={t_profile.addressNamePlaceholder} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t_profile.phone}</FormLabel>
                                <FormControl><Input placeholder={t_profile.phonePlaceholder} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="details"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t_profile.fullAddress}</FormLabel>
                                <FormControl><Textarea placeholder={t_profile.fullAddressPlaceholder} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t_profile.city}</FormLabel>
                                <FormControl><Input placeholder={t_profile.cityPlaceholder} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>{t_profile.addressType}</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="home" /></FormControl><FormLabel className="font-normal">{t_profile.home}</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="work" /></FormControl><FormLabel className="font-normal">{t_profile.work}</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="other" /></FormControl><FormLabel className="font-normal">{t_profile.other}</FormLabel></FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? t_profile.saving : t_profile.save}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
