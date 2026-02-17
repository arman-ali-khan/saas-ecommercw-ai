
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Product, FlashDeal } from '@/types';
import FlashDealForm, { flashDealSchema } from '../flash-deal-form';
import type { z } from 'zod';
import { Loader2 } from 'lucide-react';

type FlashDealFormData = z.infer<typeof flashDealSchema>;

export default function NewFlashDealPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [deals, setDeals] = useState<FlashDeal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchProductsAndDeals = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);

        const productsPromise = supabase.from('products').select('*').eq('site_id', user.id);
        const dealsPromise = supabase.from('flash_deals').select('id, product_id').eq('site_id', user.id);

        const [{ data: productsData, error: productsError }, { data: dealsData, error: dealsError }] = await Promise.all([productsPromise, dealsPromise]);

        if (productsError) toast({ variant: 'destructive', title: 'Error fetching products', description: productsError.message });
        else setProducts(productsData || []);
        
        if (dealsError) toast({ variant: 'destructive', title: 'Error fetching existing deals', description: dealsError.message });
        else setDeals(dealsData as FlashDeal[]);

        setIsLoading(false);
    }, [user, toast]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchProductsAndDeals();
        } else if (!authLoading && !user) {
            setIsLoading(false);
        }
    }, [user, authLoading, fetchProductsAndDeals]);

    const onSubmit = async (data: FlashDealFormData) => {
        if (!user) return;

        setIsSubmitting(true);
        const payload = {
            site_id: user.id,
            product_id: data.product_id,
            discount_price: data.discount_price,
            start_date: data.date_range.startDate.toISOString(),
            end_date: data.date_range.endDate.toISOString(),
            is_active: data.is_active,
        };

        const { error } = await supabase.from('flash_deals').insert(payload);

        if (error) {
            if (error.code === '23505') { // unique constraint violation
                toast({ variant: 'destructive', title: 'Product already has a deal', description: 'A product can only have one flash deal at a time. Please edit the existing one.' });
            } else {
                 toast({ variant: 'destructive', title: 'An error occurred', description: error.message });
            }
            setIsSubmitting(false);
        } else {
            toast({ title: 'Deal Created' });
            router.push('/admin/flash-deals');
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center p-16"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <FlashDealForm 
            isNew={true}
            products={products}
            deals={deals}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
        />
    );
}
