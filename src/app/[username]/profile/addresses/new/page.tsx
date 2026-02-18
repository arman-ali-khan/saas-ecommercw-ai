
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
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

        try {
            const response = await fetch('/api/customers/addresses/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, customerId: customer.id, siteId: customer.site_id }),
            });
            const result = await response.json();
            if (response.ok) {
                toast({ title: 'New address added!' });
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

    return (
        <ProfileAddressForm 
            isNew={true}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
        />
    )
}
