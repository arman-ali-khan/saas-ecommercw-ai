'use client';

import { create } from 'zustand';
import type { 
    Order, 
    Product, 
    Category, 
    ShippingZone, 
    CarouselSlide, 
    FlashDeal, 
    StoreFeature, 
    ProductAttribute, 
    Page 
} from '@/types';

interface DashboardStats {
    totalRevenue: number;
    totalProducts: number;
    uncompletedOrders: number;
    totalUncompletedOrders: number;
    totalCustomers: number;
    ordersThisMonth: number;
    activeFlashDeals: number;
    allOrders: Order[];
    revenueChartData: any[];
    pendingOrders: Order[];
    lowStockProducts: Product[];
    pendingReviews: any[];
    unansweredQuestions: any[];
}

interface SidebarCounts {
    processingOrders: number;
    unreadNotifications: number;
    unviewedUncompleted: number;
    totalCustomers: number;
    pendingReviews: number;
    pendingQna: number;
}

interface AdminState {
    // Entities
    dashboard: DashboardStats | null;
    orders: Order[];
    products: Product[];
    categories: Category[];
    customers: any[];
    shipping: ShippingZone[];
    carousel: CarouselSlide[];
    flashDeals: FlashDeal[];
    features: StoreFeature[];
    attributes: ProductAttribute[];
    pages: Page[];
    sidebarCounts: SidebarCounts;
    
    // Fetch Status (Timestamps)
    lastFetched: Record<string, number>;
    
    // Actions
    setDashboard: (data: DashboardStats) => void;
    setOrders: (orders: Order[]) => void;
    setProducts: (products: Product[]) => void;
    setCategories: (categories: Category[]) => void;
    setCustomers: (customers: any[]) => void;
    setShipping: (shipping: ShippingZone[]) => void;
    setCarousel: (carousel: CarouselSlide[]) => void;
    setFlashDeals: (deals: FlashDeal[]) => void;
    setFeatures: (features: StoreFeature[]) => void;
    setAttributes: (attributes: ProductAttribute[]) => void;
    setPages: (pages: Page[]) => void;
    setSidebarCounts: (counts: SidebarCounts) => void;
    
    invalidateEntity: (entity: string) => void;
    clearStore: () => void;
}

const INITIAL_LAST_FETCHED = {
    dashboard: 0,
    orders: 0,
    products: 0,
    categories: 0,
    customers: 0,
    shipping: 0,
    carousel: 0,
    flashDeals: 0,
    features: 0,
    attributes: 0,
    pages: 0,
    sidebarCounts: 0,
};

const INITIAL_SIDEBAR_COUNTS = {
    processingOrders: 0,
    unreadNotifications: 0,
    unviewedUncompleted: 0,
    totalCustomers: 0,
    pendingReviews: 0,
    pendingQna: 0,
};

export const useAdminStore = create<AdminState>()((set) => ({
    dashboard: null,
    orders: [],
    products: [],
    categories: [],
    customers: [],
    shipping: [],
    carousel: [],
    flashDeals: [],
    features: [],
    attributes: [],
    pages: [],
    sidebarCounts: INITIAL_SIDEBAR_COUNTS,
    
    lastFetched: INITIAL_LAST_FETCHED,

    setDashboard: (dashboard) => set((state) => ({ 
        dashboard, 
        lastFetched: { ...state.lastFetched, dashboard: Date.now() } 
    })),
    
    setOrders: (orders) => set((state) => ({ 
        orders, 
        lastFetched: { ...state.lastFetched, orders: Date.now() } 
    })),
    
    setProducts: (products) => set((state) => ({ 
        products, 
        lastFetched: { ...state.lastFetched, products: Date.now() } 
    })),
    
    setCategories: (categories) => set((state) => ({ 
        categories, 
        lastFetched: { ...state.lastFetched, categories: Date.now() } 
    })),
    
    setCustomers: (customers) => set((state) => ({ 
        customers, 
        lastFetched: { ...state.lastFetched, customers: Date.now() } 
    })),
    
    setShipping: (shipping) => set((state) => ({ 
        shipping, 
        lastFetched: { ...state.lastFetched, shipping: Date.now() } 
    })),
    
    setCarousel: (carousel) => set((state) => ({ 
        carousel, 
        lastFetched: { ...state.lastFetched, carousel: Date.now() } 
    })),
    
    setFlashDeals: (flashDeals) => set((state) => ({ 
        flashDeals, 
        lastFetched: { ...state.lastFetched, flashDeals: Date.now() } 
    })),
    
    setFeatures: (features) => set((state) => ({ 
        features, 
        lastFetched: { ...state.lastFetched, features: Date.now() } 
    })),
    
    setAttributes: (attributes) => set((state) => ({ 
        attributes, 
        lastFetched: { ...state.lastFetched, attributes: Date.now() } 
    })),
    
    setPages: (pages) => set((state) => ({ 
        pages, 
        lastFetched: { ...state.lastFetched, pages: Date.now() } 
    })),

    setSidebarCounts: (sidebarCounts) => set((state) => ({
        sidebarCounts,
        lastFetched: { ...state.lastFetched, sidebarCounts: Date.now() }
    })),

    invalidateEntity: (entity) => set((state) => ({
        lastFetched: { ...state.lastFetched, [entity]: 0 }
    })),

    clearStore: () => set({
        dashboard: null,
        orders: [],
        products: [],
        categories: [],
        customers: [],
        shipping: [],
        carousel: [],
        flashDeals: [],
        features: [],
        attributes: [],
        pages: [],
        sidebarCounts: INITIAL_SIDEBAR_COUNTS,
        lastFetched: INITIAL_LAST_FETCHED,
    })
}));