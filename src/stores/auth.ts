import { create } from 'zustand';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  register: (
    username: string,
    fullName: string,
    email: string,
    password: string,
    domain: string,
    siteName: string,
    plan: string,
    siteDescription: string
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

    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        return { user: null, error: error.message };
      }
      
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
            await supabase.auth.signOut(); // Log out if profile is missing
            return { user: null, error: 'Could not find user profile.' };
        }
        
        const isSaaSAdmin = profile.role === 'saas_admin';

        const userToStore: User = {
          id: profile.id,
          username: profile.username,
          fullName: profile.full_name,
          email: data.user.email!,
          domain: profile.domain,
          siteName: profile.site_name,
          siteDescription: profile.site_description,
          subscriptionPlan: profile.subscription_plan,
          role: profile.role,
          isSaaSAdmin,
        };

        set({ user: userToStore, session: data.session, loading: false });
        return { user: userToStore, error: null };
      }
      
      return { user: null, error: 'An unknown error occurred.' };
    },

    register: async (username, fullName, email, password, domain, siteName, plan, siteDescription) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            return { user: null, error: error.message };
        }

        if (!data.user) {
            return { user: null, error: 'Registration successful, but no user data returned.' };
        }

        const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            username,
            full_name: fullName,
            domain,
            site_name: siteName,
            site_description: siteDescription,
            subscription_plan: plan,
            role: 'admin',
        });

        if (profileError) {
             // Attempt to clean up the auth user if profile insert fails
            // This is complex, ideally handled by a server-side transaction
            console.error('Failed to create user profile:', profileError.message);
            return { user: null, error: `Could not create user profile: ${profileError.message}` };
        }
        
        const newUser: User = {
            id: data.user.id,
            username,
            fullName,
            email,
            domain,
            siteName,
            subscriptionPlan: plan,
            role: 'admin',
            siteDescription: siteDescription,
            isSaaSAdmin: false,
        };

        set({ user: newUser, session: data.session, loading: false });

        return { user: newUser, error: null };
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
          role: data.role,
          isSaaSAdmin: data.role === 'saas_admin',
        };
        
        set({ user: updatedUser });
        return { user: updatedUser, error: null };
    }
}));
