
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Address } from '@/types';


export default function AddressesPage() {
    const { customer, loading: customerLoading } = useCustomerAuth();
    const { toast } = useToast();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);

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
        if(!customerLoading && customer) {
            fetchAddresses();
        } else if (!customerLoading && !customer) {
            setIsLoading(false);
        }
    }, [customer, customerLoading, fetchAddresses]);
    
    const openDeleteAlert = (address: Address) => {
        setAddressToDelete(address);
    };

    const handleDelete = async () => {
        if (!addressToDelete) return;
        setIsDeleting(true);
        const { error } = await supabase.from('customer_addresses').delete().eq('id', addressToDelete.id);
        setIsDeleting(false);

        if (error) {
            toast({ title: 'ঠিকানা মুছতে সমস্যা হয়েছে', variant: 'destructive', description: error.message });
        } else {
            toast({ title: 'ঠিকানা মুছে ফেলা হয়েছে' });
            await fetchAddresses();
        }

        setAddressToDelete(null);
    };

  const AddressIcon = ({type}: {type: string | null}) => {
    if (type === 'home') return <Home className="h-5 w-5 text-muted-foreground" />
    if (type === 'work') return <Briefcase className="h-5 w-5 text-muted-foreground" />
    return <Building className="h-5 w-5 text-muted-foreground" />;
  }
  
   if (isLoading || customerLoading) {
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
            <Button asChild>
              <Link href="/profile/addresses/new">
                <Plus className="mr-2 h-4 w-4" /> নতুন ঠিকানা যোগ করুন
              </Link>
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
                                    <DropdownMenuItem asChild>
                                        <Link href={`/profile/addresses/${address.id}/edit`} className="cursor-pointer">
                                            <Edit className="mr-2 h-4 w-4" /> সম্পাদনা
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => openDeleteAlert(address)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> মুছে ফেলুন
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{address.details}, {address.city}</p>
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
                     <Button asChild className="mt-4">
                        <Link href="/profile/addresses/new">
                            <Plus className="mr-2 h-4 w-4" /> নতুন ঠিকানা যোগ করুন
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        )}
    </div>

    <AlertDialog open={!!addressToDelete} onOpenChange={(open) => !open && setAddressToDelete(null)}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
            <AlertDialogDescription>
                এই ঠিকানাটি স্থায়ীভাবে মুছে ফেলা হবে: "{addressToDelete?.name}". এই কাজটি বাতিল করা যাবে না।
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleDelete}
                disabled={isDeleting}
                className={cn(buttonVariants({ variant: "destructive" }))}
            >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                মুছে ফেলুন
            </AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
