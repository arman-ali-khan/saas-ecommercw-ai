
'use client';

import { create } from 'zustand';
import type { User, Plan } from '@/types';
import { supabase } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  saasLogin: (email: string, password: string) => Promise<{ user: any | null; error: string | null }>;
  storeLogin: (email: string, password: string, domain: string) => Promise<{ user: any | null; error: string | null }>;
  customerLogin: (email: string, password: string, siteId:string) => Promise<{ user: any | null; error: string | null }>;
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
  registerCustomer: (
    fullName: string,
    email: string,
    password: string,
    siteId: string,
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
    loading: true, // Initially loading until auth state is checked
    
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setLoading: (loading) => set({ loading }),

    refreshUser: async () => {
        try {
          const response = await fetch('/api/auth/get-profile');
          if (!response.ok) {
            const currentUser = get().user;
            if (currentUser) {
                set({ user: null });
            }
            return;
          }

          const { profile: adminProfile } = await response.json();
          if (!adminProfile) {
            const currentUser = get().user;
            if (currentUser) {
                set({ user: null });
            }
            return;
          }

          let planDetails: Partial<Plan> = {
            product_limit: null,
            customer_limit: null,
            order_limit: null,
          };

          if (adminProfile.subscription_plan) {
            const { data: planData } = await supabase
              .from('plans')
              .select('product_limit, customer_limit, order_limit')
              .eq('id', adminProfile.subscription_plan)
              .single();
            if (planData) {
              planDetails = planData;
            }
          }

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
            product_limit: planDetails.product_limit ?? null,
            customer_limit: planDetails.customer_limit ?? null,
            order_limit: planDetails.order_limit ?? null,
            subscription_end_date: adminProfile.subscription_end_date,
          };

          const currentUser = get().user;
          // Only update state if the user object has actually changed.
          if (currentUser && JSON.stringify(currentUser) === JSON.stringify(newUser)) {
            return;
          }
          
          set({ user: newUser });
        } catch (e) {
          console.error('Error fetching profile via API route:', e);
          set({ user: null });
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
          const { error } = await response.json();
          set({ loading: false });
          return { user: null, error: error || 'Invalid credentials for this store.' };
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
      // onAuthStateChange will trigger refreshUser and set the user state
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

    registerCustomer: async (fullName, email, password, siteId) => {
      try {
          // We call a server-side function to handle the sensitive hashing
          const response = await fetch('/api/auth/register-customer', {
              method: 'POST',
              body: JSON.stringify({ fullName, email, password, siteId }),
              headers: { 'Content-Type': 'application/json' }
          });
  
          const result = await response.json();
  
          if (!response.ok) {
              return { user: null, error: result.error };
          }
  
          return { user: result.user, error: null };
      } catch (err) {
          return { user: null, error: 'Connection failed' };
      }
  },

  // Inside useAuth.ts
  customerLogin: async (email, password, siteId) => {
    try {
      const response = await fetch('/api/auth/login-customer', {
        method: 'POST',
        body: JSON.stringify({ email, password, siteId }),
        headers: { 'Content-Type': 'application/json' }
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        return { user: null, error: result.error || 'লগইন করতে সমস্যা হয়েছে' };
      }
  
      set({ user: result.user, loading: false });
      return { user: result.user, error: null };
    } catch (err) {
      // এখানে console.log দিন যাতে আপনি ব্রাউজারের Inspect > Console-এ আসল এরর দেখতে পান
      console.error("Login Fetch Error:", err);
      return { user: null, error: 'সার্ভারের সাথে সংযোগ করতে ব্যর্থ হয়েছে' };
    }
  },
  
    
    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      // The onAuthStateChange listener in AuthProvider will handle setting the state.
    },
    
    updateUserProfile: async (userId: string, updates: Partial<User>) => {
        const { fullName, username } = updates;
        const supabaseUpdates: {[key: string]: any} = {};

        if (fullName) supabaseUpdates.full_name = fullName;
        if (username) supabaseUpdates.username = username;

        const { data, error } = await supabase
            .from('profiles')
            .update(supabaseUpdates)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            return { user: null, error: error.message };
        }
        
        const currentUser = get().user;
        const updatedUser: User = {
          id: data.id,
          username: data.username,
          fullName: data.full_name,
          email: currentUser?.email || '', // email doesn't change
          domain: data.domain,
          siteName: data.site_name,
          siteDescription: data.site_description,
          subscriptionPlan: data.subscription_plan,
          subscription_status: data.subscription_status,
          role: data.role,
          isSaaSAdmin: data.role === 'saas_admin',
          last_subscription_from: data.last_subscription_from,
          product_limit: currentUser?.product_limit ?? null,
          customer_limit: currentUser?.customer_limit ?? null,
          order_limit: currentUser?.order_limit ?? null,
          subscription_end_date: data.subscription_end_date,
        };
        
        set({ user: updatedUser });
        return { user: updatedUser, error: null };
    }
}));
