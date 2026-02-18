
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
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

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            // Fetch products via API
            const productsRes = await fetch('/api/products/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id }),
            });
            const productsResult = await productsRes.json();
            
            // Fetch deals via API
            const dealsRes = await fetch('/api/flash-deals/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id }),
            });
            const dealsResult = await dealsRes.json();

            if (productsRes.ok) setProducts(productsResult.products || []);
            else throw new Error(productsResult.error);

            if (dealsRes.ok) setDeals(dealsResult.deals || []);
            else throw new Error(dealsResult.error);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchData();
        } else if (!authLoading && !user) {
            setIsLoading(false);
        }
    }, [user, authLoading, fetchData]);

    const onSubmit = async (data: FlashDealFormData) => {
        if (!user) return;

        setIsSubmitting(true);
        const payload = {
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
                toast({ title: 'Deal Created' });
                router.push('/admin/flash-deals');
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'An error occurred', description: error.message });
            setIsSubmitting(false);
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
