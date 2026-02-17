
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Product, FlashDeal } from '@/types';
import FlashDealForm, { flashDealSchema } from '../../flash-deal-form';
import type { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type FlashDealFormData = z.infer<typeof flashDealSchema>;

export default function EditFlashDealPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const dealId = params.dealId as string;

    const [products, setProducts] = useState<Product[]>([]);
    const [deals, setDeals] = useState<FlashDeal[]>([]); // All deals for validation
    const [initialData, setInitialData] = useState<FlashDeal | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user || !dealId) return;
        setIsLoading(true);

        const dealPromise = supabase.from('flash_deals').select('*').eq('id', dealId).single();
        const productsPromise = supabase.from('products').select('*').eq('site_id', user.id);
        const allDealsPromise = supabase.from('flash_deals').select('id, product_id').eq('site_id', user.id);

        const [
            { data: dealData, error: dealError }, 
            { data: productsData, error: productsError }, 
            { data: allDealsData, error: allDealsError }
        ] = await Promise.all([dealPromise, productsPromise, allDealsPromise]);

        if (dealError || !dealData) {
            toast({ variant: 'destructive', title: 'Error', description: 'Flash deal not found.' });
            router.push('/admin/flash-deals');
            return;
        }

        if (productsError) toast({ variant: 'destructive', title: 'Error fetching products', description: productsError.message });
        if (allDealsError) toast({ variant: 'destructive', title: 'Error fetching deals', description: allDealsError.message });

        setInitialData(dealData as FlashDeal);
        setProducts(productsData || []);
        setDeals(allDealsData as FlashDeal[] || []);
        setIsLoading(false);
    }, [user, dealId, toast, router]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchData();
        } else if (!authLoading && !user) {
            setIsLoading(false);
        }
    }, [user, authLoading, fetchData]);

    const onSubmit = async (data: FlashDealFormData) => {
        if (!user || !initialData) return;
        setIsSubmitting(true);
        const payload = {
            product_id: data.product_id, // can't be changed, but schema needs it
            discount_price: data.discount_price,
            start_date: data.date_range.startDate.toISOString(),
            end_date: data.date_range.endDate.toISOString(),
            is_active: data.is_active,
        };

        const { error } = await supabase.from('flash_deals').update(payload).eq('id', initialData.id);

        if (error) {
            toast({ variant: 'destructive', title: 'An error occurred', description: error.message });
            setIsSubmitting(false);
        } else {
            toast({ title: 'Deal Updated' });
            router.push('/admin/flash-deals');
            router.refresh();
        }
    };
    
    if (isLoading) {
        return (
            <div>
                 <Skeleton className="h-9 w-40 mb-4" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <FlashDealForm 
            isNew={false}
            initialData={initialData}
            products={products}
            deals={deals}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
        />
    );
}
