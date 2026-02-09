
import { create } from 'zustand';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string, siteId?: string) => Promise<{ user: User | null; error: string | null }>;
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

    login: async (email, password, siteId) => {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (authError) {
        return { user: null, error: authError.message };
      }
      
      if (authData.user) {
        // First, check if the user is a site owner/admin
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (adminProfile) {
          const userToStore: User = {
            id: adminProfile.id,
            username: adminProfile.username,
            fullName: adminProfile.full_name,
            email: authData.user.email!,
            domain: adminProfile.domain,
            siteName: adminProfile.site_name,
            siteDescription: adminProfile.site_description,
            subscriptionPlan: adminProfile.subscription_plan,
            subscription_status: adminProfile.subscription_status,
            role: adminProfile.role,
            isSaaSAdmin: adminProfile.role === 'saas_admin',
          };
          set({ user: userToStore, session: authData.session, loading: false });
          return { user: userToStore, error: null };
        }

        // If not an admin, check if they are a customer FOR THE CURRENT SITE
        if (siteId) {
            const { data: customerProfile } = await supabase
              .from('customer_profiles')
              .select('*')
              .eq('id', authData.user.id)
              .eq('site_id', siteId)
              .single();

            if (customerProfile) {
                const appUser: User = {
                  id: customerProfile.id,
                  username: customerProfile.email.split('@')[0], // Create a fallback username
                  fullName: customerProfile.full_name,
                  email: authData.user.email!,
                  role: 'customer',
                  // Nullify site-owner specific fields
                  domain: '',
                  siteName: '',
                  siteDescription: null,
                  subscriptionPlan: null,
                  subscription_status: 'active', // Customers are always active
                  isSaaSAdmin: false,
                };
                set({ user: appUser, session: authData.session, loading: false });
                return { user: appUser, error: null };
            } else {
                 // Correct credentials, but not registered for this specific store.
                 // Sign them out to avoid confusion and inconsistent state.
                 await supabase.auth.signOut();
                 return { user: null, error: 'Invalid email or password for this site.' };
            }
        }
      }
      // If we are here, something is wrong (e.g. customer trying to log in via main /login)
      await supabase.auth.signOut();
      return { user: null, error: 'Invalid login context.' };
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
