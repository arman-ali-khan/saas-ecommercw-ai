
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/stores/auth';
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
    const [deals, setDeals] = useState<FlashDeal[]>([]); 
    const [initialData, setInitialData] = useState<FlashDeal | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user || !dealId) return;
        setIsLoading(true);

        try {
            const dealRes = await fetch('/api/flash-deals/get', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: dealId, siteId: user.id }),
            });
            const dealResult = await dealRes.json();

            const productsRes = await fetch('/api/products/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id }),
            });
            const productsResult = await productsRes.json();

            const dealsRes = await fetch('/api/flash-deals/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id }),
            });
            const dealsResult = await dealsRes.json();

            if (!dealRes.ok) throw new Error(dealResult.error || 'Flash deal not found.');
            if (!productsRes.ok) throw new Error(productsResult.error || 'Error fetching products.');
            if (!dealsRes.ok) throw new Error(dealsResult.error || 'Error fetching deals.');

            setInitialData(dealResult.deal as FlashDeal);
            setProducts(productsResult.products || []);
            setDeals(dealsResult.deals || []);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            router.push('/admin/flash-deals');
        } finally {
            setIsLoading(false);
        }
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
            id: initialData.id,
            siteId: user.id,
            product_id: data.product_id,
            discount_price: data.discount_price,
            start_date: data.date_range.startDate.toISOString(),
            end_date: data.date_range.endDate.toISOString(),
            is_active: data.is_active,
        };

        try {
            const response = await fetch('/api/flash-deals/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();

            if (response.ok) {
                toast({ title: 'Deal Updated' });
                router.push('/admin/flash-deals');
            } else {
                throw new Error(result.error || 'Failed to update deal');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'An error occurred', description: error.message });
            setIsSubmitting(false);
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
