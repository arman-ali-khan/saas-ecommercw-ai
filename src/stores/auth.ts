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
  storeLogin: (email: string, password: string) => Promise<{ user: any | null; error: string | null }>;
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
}

export const useAuth = create<AuthState>()((set, get) => ({
    user: null,
    session: null,
    loading: true, // Initially loading until auth state is checked
    
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setLoading: (loading) => set({ loading }),

    saasLogin: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { user: null, error: error.message };
      }
      return { user: data.user, error: null };
    },

    storeLogin: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
       if (error) {
        return { user: null, error: error.message };
      }
      return { user: data.user, error: null };
    },

    register: async (username, fullName, email, password, domain, siteName, plan, siteDescription, paymentMethod, transactionId) => {
        const subscription_status = plan === 'free' ? 'active' : 'pending_verification';
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    full_name: fullName,
                    domain,
                    site_name: siteName,
                    site_description: siteDescription,
                    subscription_plan: plan,
                    subscription_status: subscription_status,
                    role: 'admin',
                    paymentMethod: paymentMethod,
                    transactionId: transactionId
                }
            }
        });

        if (error) {
            return { user: null, error: error.message };
        }

        // The trigger will handle profile creation.
        if (data.user) {
            return { user: data.user, error: null };
        }

        return { user: null, error: 'An unknown error occurred during registration.' };
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
      await supabase.auth.signOut();
      set({ user: null, session: null, loading: false });
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
        
        const updatedUser: User = {
          id: data.id,
          username: data.username,
          fullName: data.full_name,
          email: get().user?.email || '', // email doesn't change
          domain: data.domain,
          siteName: data.site_name,
          siteDescription: data.site_description,
          subscriptionPlan: data.subscription_plan,
          subscription_status: data.subscription_status,
          role: data.role,
          isSaaSAdmin: data.role === 'saas_admin',
        };
        
        set({ user: updatedUser });
        return { user: updatedUser, error: null };
    }
}));
