'use client';

import { create } from 'zustand';
import type { 
    SaasFeature, 
    SaasShowcaseItem, 
    SaaSReview, 
    SeoRequest, 
    Plan, 
    SubscriptionPaymentWithDetails,
    Page
} from '@/types';

interface SaasDashboardData {
    stats: {
        totalRevenue: number;
        activeSubscriptions: number;
        pendingReviews: number;
        pendingSubscriptions: number;
    };
    recentPendingPayments: SubscriptionPaymentWithDetails[];
    unreadNotifications: any[];
}

interface SaasState {
    // Entities
    dashboardData: SaasDashboardData | null;
    admins: any[];
    subscriptions: SubscriptionPaymentWithDetails[];
    plans: Plan[];
    features: SaasFeature[];
    showcase: SaasShowcaseItem[];
    seoRequests: SeoRequest[];
    reviews: SaaSReview[];
    pages: Page[];
    
    // Fetch Status (Timestamps)
    lastFetched: Record<string, number>;
    
    // Actions
    setDashboardData: (data: SaasDashboardData) => void;
    setAdmins: (admins: any[]) => void;
    setSubscriptions: (subs: SubscriptionPaymentWithDetails[]) => void;
    setPlans: (plans: Plan[]) => void;
    setFeatures: (features: SaasFeature[]) => void;
    setShowcase: (showcase: SaasShowcaseItem[]) => void;
    setSeoRequests: (requests: SeoRequest[]) => void;
    setReviews: (reviews: SaaSReview[]) => void;
    setPages: (pages: Page[]) => void;
    
    invalidateEntity: (entity: string) => void;
    clearStore: () => void;
}

const INITIAL_LAST_FETCHED = {
    dashboard: 0,
    admins: 0,
    subscriptions: 0,
    plans: 0,
    features: 0,
    showcase: 0,
    seoRequests: 0,
    reviews: 0,
    pages: 0,
};

export const useSaasStore = create<SaasState>()((set) => ({
    dashboardData: null,
    admins: [],
    subscriptions: [],
    plans: [],
    features: [],
    showcase: [],
    seoRequests: [],
    reviews: [],
    pages: [],
    
    lastFetched: INITIAL_LAST_FETCHED,

    setDashboardData: (data) => set((state) => ({ 
        dashboardData: data, 
        lastFetched: { ...state.lastFetched, dashboard: Date.now() } 
    })),
    
    setAdmins: (admins) => set((state) => ({ 
        admins, 
        lastFetched: { ...state.lastFetched, admins: Date.now() } 
    })),
    
    setSubscriptions: (subscriptions) => set((state) => ({ 
        subscriptions, 
        lastFetched: { ...state.lastFetched, subscriptions: Date.now() } 
    })),
    
    setPlans: (plans) => set((state) => ({ 
        plans, 
        lastFetched: { ...state.lastFetched, plans: Date.now() } 
    })),
    
    setFeatures: (features) => set((state) => ({ 
        features, 
        lastFetched: { ...state.lastFetched, features: Date.now() } 
    })),
    
    setShowcase: (showcase) => set((state) => ({ 
        showcase, 
        lastFetched: { ...state.lastFetched, showcase: Date.now() } 
    })),
    
    setSeoRequests: (seoRequests) => set((state) => ({ 
        seoRequests, 
        lastFetched: { ...state.lastFetched, seoRequests: Date.now() } 
    })),
    
    setReviews: (reviews) => set((state) => ({ 
        reviews, 
        lastFetched: { ...state.lastFetched, reviews: Date.now() } 
    })),
    
    setPages: (pages) => set((state) => ({ 
        pages, 
        lastFetched: { ...state.lastFetched, pages: Date.now() } 
    })),

    invalidateEntity: (entity) => set((state) => ({
        lastFetched: { ...state.lastFetched, [entity]: 0 }
    })),

    clearStore: () => set({
        dashboardData: null,
        admins: [],
        subscriptions: [],
        plans: [],
        features: [],
        showcase: [],
        seoRequests: [],
        reviews: [],
        pages: [],
        lastFetched: INITIAL_LAST_FETCHED,
    })
}));
