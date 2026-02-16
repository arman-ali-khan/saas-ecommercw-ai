
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/lib/supabase/client';

interface CustomerUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  site_id: string;
}

interface CustomerAuthState {
  customer: CustomerUser | null;
  loading: boolean;
  _hasHydrated: boolean; 
  setHasHydrated: (state: boolean) => void; 
  setCustomerLoading: (loading: boolean) => void;
  customerLogin: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  refreshCustomer: () => Promise<void>;
  customerLogout: () => Promise<void>;
  setCustomer: (customer: CustomerUser | null) => void;
}

export const useCustomerAuth = create<CustomerAuthState>()(
  persist(
    (set, get) => ({
      customer: null,
      loading: true,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
      setCustomerLoading: (loading) => set({ loading }),

      customerLogin: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        // The actual user setting will be handled by the central AuthProvider
        return { error };
      },

      refreshCustomer: async () => {
        try {
          const response = await fetch('/api/auth/get-customer');
          if (response.ok) {
            const { customerProfile } = await response.json();
            
            const currentCustomer = get().customer;
            // Only update state if the customer object has actually changed.
            if (
              currentCustomer &&
              currentCustomer.id === customerProfile.id &&
              currentCustomer.full_name === customerProfile.full_name &&
              currentCustomer.email === customerProfile.email
            ) {
              return;
            }

            set({ customer: customerProfile });
          } else {
             const currentCustomer = get().customer;
             if (currentCustomer) { // Only clear if there was a customer
                set({ customer: null });
             }
          }
        } catch (error) {
            console.error("Failed to refresh customer profile:", error);
            set({ customer: null });
        }
      },

      customerLogout: async () => {
        await supabase.auth.signOut();
        set({ customer: null });
      },

      setCustomer: (customer) => set({ customer }),
    }),
    {
      name: 'customer-auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
       partialize: (state) => ({ customer: state.customer }),
    }
  )
);
