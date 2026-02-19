'use client';

import { create } from 'zustand';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  saasLogin: (email: string, password: string) => Promise<{ user: any | null; error: string | null }>;
  storeLogin: (email: string, password: string, domain: string) => Promise<{ user: any | null; error: string | null }>;
  register: (
    username: string,
    fullName: string,
    email: string,
    password: string,
    domain: string,
    siteName: string,
    plan: string,
    siteDescription: string,
    paymentMethod: string | null,
    transactionId: string | null
  ) => Promise<{ user: any | null, error: string | null }>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<{ user: User | null, error: string | null }>;
  refreshUser: () => Promise<void>;
}

export const useAuth = create<AuthState>()((set, get) => ({
    user: null,
    session: null,
    loading: true, 
    
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setLoading: (loading) => set({ loading }),

    refreshUser: async () => {
      try {
        set({ loading: true });
        
        // Call our internal API to get the full profile. 
        const response = await fetch('/api/auth/get-profile', {
            method: 'GET',
            cache: 'no-store'
        });

        if (!response.ok) {
            set({ user: null, loading: false });
            return;
        }
        
        const data = await response.json();
        const adminProfile = data.profile;

        if (!adminProfile) {
          set({ user: null, loading: false });
          return;
        }
        
        const settingsData = Array.isArray(adminProfile.store_settings) ? adminProfile.store_settings[0] : adminProfile.store_settings;
        const planData = Array.isArray(adminProfile.plans) ? adminProfile.plans[0] : adminProfile.plans;

        const newUser: User = {
          id: adminProfile.id,
          username: adminProfile.username,
          fullName: adminProfile.full_name,
          email: adminProfile.email,
          domain: adminProfile.domain,
          siteName: adminProfile.site_name,
          siteDescription: adminProfile.site_description,
          subscriptionPlan: adminProfile.subscription_plan,
          subscription_status: adminProfile.subscription_status,
          role: adminProfile.role,
          isSaaSAdmin: adminProfile.role === 'saas_admin',
          last_subscription_from: adminProfile.last_subscription_from,
          product_limit: planData?.product_limit ?? null,
          customer_limit: planData?.customer_limit ?? null,
          order_limit: planData?.order_limit ?? null,
          subscription_end_date: adminProfile.subscription_end_date,
          language: settingsData?.language || 'bn',
          logo_type: settingsData?.logo_type || 'icon',
          logo_icon: settingsData?.logo_icon || 'Leaf',
          logo_image_url: settingsData?.logo_image_url || null,
        };

        set({ user: newUser, loading: false });
      } catch (e) {
        console.error('Error refreshing admin profile via API:', e);
        set({ user: null, loading: false });
      }
    },

    saasLogin: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { user: null, error: error.message };
      }
      return { user: data.user, error: null };
    },

    storeLogin: async (email, password, domain) => {
      set({ loading: true });
      try {
        const response = await fetch('/api/auth/validate-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, domain }),
        });

        if (!response.ok) {
          const result = await response.json();
          set({ loading: false });
          return { user: null, error: result.error || 'Invalid credentials for this store.' };
        }
      } catch (e: any) {
        set({ loading: false });
        return { user: null, error: 'Could not validate user. Please check your connection.' };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
       if (error) {
        set({ loading: false });
        return { user: null, error: error.message };
      }
      return { user: data.user, error: null };
    },

    register: async (
      username,
      fullName,
      email,
      password,
      domain,
      siteName,
      plan,
      siteDescription,
      paymentMethod,
      transactionId
    ) => {
      try {
        const response = await fetch('/api/auth/register-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            fullName,
            email,
            password,
            domain,
            siteName,
            plan,
            siteDescription,
            paymentMethod,
            transactionId,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          return { user: null, error: result.error || 'An unknown error occurred.' };
        }

        return { user: result.user, error: null };
      } catch (error: any) {
        return { user: null, error: error.message || 'Network error, please try again.' };
      }
    },
    
    logout: async () => {
      await supabase.auth.signOut();
      set({ user: null, session: null, loading: false });
    },
    
    updateUserProfile: async (userId: string, updates: Partial<User>) => {
        const { fullName, username } = updates;
        const supabaseUpdates: {[key: string]: any} = {};

        if (fullName) supabaseUpdates.full_name = fullName;
        if (username) supabaseUpdates.username = username;

        const { error } = await supabase
            .from('profiles')
            .update(supabaseUpdates)
            .eq('id', userId);

        if (error) {
            return { user: null, error: error.message };
        }
        
        await get().refreshUser();
        return { user: get().user, error: null };
    }
}));