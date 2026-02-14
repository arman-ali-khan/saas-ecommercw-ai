'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProfileAddressForm, { type AddressFormData } from '@/components/profile-address-form';

export default function NewAddressPage() {
    const { customer } = useCustomerAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (data: AddressFormData) => {
        if (!customer) {
            toast({ variant: 'destructive', title: 'You must be logged in.' });
            return;
        }
        setIsSubmitting(true);

        const payload = {
            ...data,
            customer_id: customer.id,
            site_id: customer.site_id,
        };

        const { error } = await supabase.from('customer_addresses').insert(payload);
        
        setIsSubmitting(false);

        if (error) {
            toast({ variant: 'destructive', title: 'An error occurred', description: error.message });
        } else {
            toast({ title: 'New address added!' });
            router.push('/profile/addresses');
            router.refresh();
        }
    };

    return (
        <ProfileAddressForm 
            isNew={true}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
        />
    )
}
