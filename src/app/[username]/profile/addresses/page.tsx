'use client';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Home, Briefcase, Trash2, Edit, MoreHorizontal, Loader2, Building, Phone } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Address = {
    id: string;
    customer_id: string;
    site_id: string;
    name: string;
    details: string;
    phone: string | null;
    type: 'home' | 'work' | 'other' | null;
    created_at: string;
};

const addressSchema = z.object({
  name: z.string().min(2, 'ঠিকানার একটি নাম দিন (যেমন, বাড়ি)।'),
  details: z.string().min(10, 'সম্পূর্ণ ঠিকানা লিখুন।'),
  phone: z.string().min(10, 'অনুগ্রহ করে একটি বৈধ ফোন নম্বর লিখুন।'),
  type: z.enum(['home', 'work', 'other']).default('other'),
});

type AddressFormData = z.infer<typeof addressSchema>;

export default function AddressesPage() {
    const { customer, _hasHydrated } = useCustomerAuth();
    const { toast } = useToast();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

    const form = useForm<AddressFormData>({
        resolver: zodResolver(addressSchema),
        defaultValues: { name: '', details: '', phone: '', type: 'home' },
    });

    const fetchAddresses = useCallback(async () => {
        if (!customer) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('customer_addresses')
            .select('*')
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching addresses', description: error.message });
        } else {
            setAddresses(data as Address[]);
        }
        setIsLoading(false);
    }, [customer, toast]);

    useEffect(() => {
        if(_hasHydrated && customer) {
            fetchAddresses();
        } else if (_hasHydrated && !customer) {
            setIsLoading(false);
        }
    }, [customer, _hasHydrated, fetchAddresses]);

    useEffect(() => {
        if (isFormOpen) {
            if (selectedAddress) {
                form.reset({
                    name: selectedAddress.name,
                    details: selectedAddress.details,
                    phone: selectedAddress.phone || '',
                    type: selectedAddress.type || 'other'
                });
            } else {
                form.reset({ name: '', details: '', phone: '', type: 'home' });
            }
        }
    }, [isFormOpen, selectedAddress, form]);

    const onSubmit = async (data: AddressFormData) => {
        if (!customer) return;
        setIsSubmitting(true);
        
        const payload = {
            ...data,
            customer_id: customer.id,
            site_id: customer.site_id,
        };

        let error;
        if (selectedAddress) {
            // Update
            const { error: updateError } = await supabase.from('customer_addresses').update(payload).eq('id', selectedAddress.id);
            error = updateError;
            if (!error) toast({ title: 'ঠিকানা আপডেট করা হয়েছে' });
        } else {
            // Create
            const { error: insertError } = await supabase.from('customer_addresses').insert(payload);
            error = insertError;
            if (!error) toast({ title: 'নতুন ঠিকানা যোগ করা হয়েছে' });
        }

        if (error) {
            toast({ variant: 'destructive', title: 'একটি সমস্যা হয়েছে', description: error.message });
        } else {
            await fetchAddresses();
            setIsFormOpen(false);
            setSelectedAddress(null);
        }
        setIsSubmitting(false);
    };
    
    const openForm = (address: Address | null) => {
        setSelectedAddress(address);
        setIsFormOpen(true);
    };

    const openDeleteAlert = (address: Address) => {
        setSelectedAddress(address);
        setIsAlertOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedAddress) return;
        setIsSubmitting(true);
        const { error } = await supabase.from('customer_addresses').delete().eq('id', selectedAddress.id);
        setIsSubmitting(false);

        if (error) {
            toast({ title: 'ঠিকানা মুছতে সমস্যা হয়েছে', variant: 'destructive', description: error.message });
        } else {
            toast({ title: 'ঠিকানা মুছে ফেলা হয়েছে' });
            await fetchAddresses();
        }

        setIsAlertOpen(false);
        setSelectedAddress(null);
    };

  const AddressIcon = ({type}: {type: string | null}) => {
    if (type === 'home') return <Home className="h-5 w-5 text-muted-foreground" />
    if (type === 'work') return <Briefcase className="h-5 w-5 text-muted-foreground" />
    return <Building className="h-5 w-5 text-muted-foreground" />;
  }
  
   if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold">আমার ঠিকানা</h1>
                <p className="text-muted-foreground">আপনার সংরক্ষিত শিপিং ঠিকানাগুলি পরিচালনা করুন।</p>
            </div>
            <Button onClick={() => openForm(null)}>
              <Plus className="mr-2 h-4 w-4" /> নতুন ঠিকানা যোগ করুন
            </Button>
        </div>

        {addresses.length > 0 ? (
             <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6">
                {addresses.map(address => (
                <Card key={address.id}>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <AddressIcon type={address.type} />
                                <CardTitle>{address.name}</CardTitle>
                            </div>
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openForm(address)} className="cursor-pointer">
                                        <Edit className="mr-2 h-4 w-4" /> সম্পাদনা
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => openDeleteAlert(address)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> মুছে ফেলুন
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{address.details}</p>
                        {address.phone && (
                            <div className="flex items-center gap-2 mt-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <p className="text-muted-foreground">{address.phone}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                ))}
            </div>
        ) : (
             <Card>
                <CardContent className="text-center py-16">
                    <p className="text-muted-foreground">আপনার কোনো সংরক্ষিত ঠিকানা নেই।</p>
                     <Button className="mt-4" onClick={() => openForm(null)}>
                        <Plus className="mr-2 h-4 w-4" /> নতুন ঠিকানা যোগ করুন
                    </Button>
                </CardContent>
            </Card>
        )}
    </div>

    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{selectedAddress ? 'ঠিকানা সম্পাদনা করুন' : 'নতুন ঠিকানা যোগ করুন'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
                            <FormLabel>সম্পূর্ণ ঠিকানা</FormLabel>
                            <FormControl><Textarea placeholder="বাড়ি #, রাস্তা #, এলাকা, শহর" {...field} /></FormControl>
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
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'সংরক্ষণ করা হচ্ছে...' : 'সংরক্ষণ করুন'}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>

    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
            <AlertDialogDescription>
                এই ঠিকানাটি স্থায়ীভাবে মুছে ফেলা হবে: "{selectedAddress?.name}". এই কাজটি বাতিল করা যাবে না।
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleDelete}
                disabled={isSubmitting}
                className={cn(buttonVariants({ variant: "destructive" }))}
            >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                মুছে ফেলুন
            </AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
