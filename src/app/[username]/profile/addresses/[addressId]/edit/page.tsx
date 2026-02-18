
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Address } from '@/types';
import ProfileAddressForm, { type AddressFormData } from '@/components/profile-address-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditAddressPage() {
    const { customer, loading: customerLoading } = useCustomerAuth();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const addressId = params.addressId as string;

    const [initialData, setInitialData] = useState<Address | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        if (!customer || !addressId) return;
        setIsLoading(true);

        // For single item fetch, we can still use Supabase or create a get-address API.
        // Let's use the list API and filter locally for simplicity, or just a direct call if allowed.
        // Actually, let's use direct supabase for single fetch as it's safe if filtered by customer_id.
        const { data, error } = await supabase
            .from('customer_addresses')
            .select('*')
            .eq('id', addressId)
            .eq('customer_id', customer.id)
            .single();

        if (error || !data) {
            toast({ variant: 'destructive', title: 'Error', description: 'Address not found.' });
            router.push('/profile/addresses');
            return;
        }

        setInitialData(data as Address);
        setIsLoading(false);
    }, [customer, addressId, toast, router]);

    useEffect(() => {
        if (!customerLoading && customer) {
            fetchData();
        } else if (!customerLoading && !customer) {
            router.push('/login');
        }
    }, [customer, customerLoading, fetchData, router]);

    const onSubmit = async (data: AddressFormData) => {
        if (!customer || !initialData) return;
        setIsSubmitting(true);
        
        try {
            const response = await fetch('/api/customers/addresses/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, id: initialData.id, customerId: customer.id, siteId: customer.site_id }),
            });
            const result = await response.json();
            if (response.ok) {
                toast({ title: 'Address Updated' });
                router.push('/profile/addresses');
                router.refresh();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'An error occurred', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isLoading) {
        return (
            <div>
                <Skeleton className="h-9 w-40 mb-4" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    return (
        <ProfileAddressForm 
            isNew={false}
            initialData={initialData}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
        />
    );
}
