'use client';

import { create } from 'zustand';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  saasLogin: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  storeLogin: (email: string, password: string, siteId: string) => Promise<{ user: User | null; error: string | null }>;
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
  ) => Promise<{ user: User | null, error: string | null }>;
  registerCustomer: (
    fullName: string,
    email: string,
    password: string,
    siteId: string,
  ) => Promise<{ user: User | null, error: string | null }>;
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
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (authError) {
        return { user: null, error: authError.message };
      }
      
      if (!authData.user) {
        return { user: null, error: 'Login failed: no user data returned.' };
      }

      const { user: authUser, session } = authData;
      
      const { data: adminProfile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();

      if (adminProfile) {
        const appUser: User = {
          id: adminProfile.id,
          username: adminProfile.username,
          fullName: adminProfile.full_name,
          email: authUser.email!,
          domain: adminProfile.domain,
          siteName: adminProfile.site_name,
          siteDescription: adminProfile.site_description,
          subscriptionPlan: adminProfile.subscription_plan,
          subscription_status: adminProfile.subscription_status,
          role: adminProfile.role,
          isSaaSAdmin: adminProfile.role === 'saas_admin',
        };
        set({ user: appUser, session, loading: false });
        return { user: appUser, error: null };
      }
      
      // If user exists in auth but not in profiles table for a SaaS login, they are not a site owner.
      await supabase.auth.signOut();
      return { user: null, error: 'This login is for site owners and administrators only.' };
    },

    storeLogin: async (email, password, siteId) => {
      // Step 1: Sign in the user with their credentials.
      // This automatically sets the session for subsequent Supabase client calls.
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) return { user: null, error: authError.message };
      if (!authData.user || !authData.session) return { user: null, error: 'Login failed: no user data returned.' };
      
      const { user: authUser, session } = authData;

      // Step 2: Check if the logged-in user is the owner of the current site.
      // We directly compare the user's ID with the siteId passed from the login page.
      if (authUser.id === siteId) {
          const { data: ownerProfile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
          if (ownerProfile) {
              const appUser: User = {
                  id: ownerProfile.id,
                  username: ownerProfile.username,
                  fullName: ownerProfile.full_name,
                  email: authUser.email!,
                  domain: ownerProfile.domain,
                  siteName: ownerProfile.site_name,
                  siteDescription: ownerProfile.site_description,
                  subscriptionPlan: ownerProfile.subscription_plan,
                  subscription_status: ownerProfile.subscription_status,
                  role: ownerProfile.role,
                  isSaaSAdmin: ownerProfile.role === 'saas_admin',
              };
              set({ user: appUser, session, loading: false });
              return { user: appUser, error: null };
          }
      }

      // Step 3: If not the owner, check if they are a customer registered specifically to this site.
      // This query uses the now-active session and RLS should permit it.
      const { data: customerProfile } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('id', authUser.id)
        .eq('site_id', siteId)
        .single();
      
      if (customerProfile) {
        // This is a valid customer for this specific store.
        const appUser: User = {
          id: customerProfile.id,
          username: customerProfile.email.split('@')[0],
          fullName: customerProfile.full_name,
          email: authUser.email!,
          role: 'customer',
          domain: '',
          siteName: '',
          siteDescription: null,
          subscriptionPlan: null,
          subscription_status: 'active',
          isSaaSAdmin: false,
        };
        set({ user: appUser, session, loading: false });
        return { user: appUser, error: null };
      }
      
      // Step 4: If the user is neither the owner nor a customer of this site, it's an invalid login attempt.
      // Sign them out to clear the session and prevent inconsistent states.
      await supabase.auth.signOut();
      return { user: null, error: 'Invalid email or password for this site.' };
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
            return { user: { id: data.user.id } as User, error: null };
        }

        return { user: null, error: 'An unknown error occurred during registration.' };
    },

    registerCustomer: async (fullName, email, password, siteId) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: 'customer',
                    site_id: siteId,
                }
            }
        });

        if (error) {
            return { user: null, error: error.message };
        }
        
        // The trigger will handle profile creation.
        if (data.user) {
            return { user: { id: data.user.id } as User, error: null };
        }

        return { user: null, error: 'An unknown error occurred during registration.' };
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
