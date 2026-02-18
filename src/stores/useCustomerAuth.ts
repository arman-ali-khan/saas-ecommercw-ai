
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  registerCustomer: (fullName: string, email: string, password: string, siteId: string) => Promise<{ user: any, error: string | null }>;
  customerLogin: (email: string, password: string, siteId: string) => Promise<{ error: { message: string } | null }>;
  customerLogout: () => Promise<void>;
  setCustomer: (customer: CustomerUser | null) => void;
  refreshCustomer: () => Promise<void>;
  updateCustomerProfile: (updates: Partial<CustomerUser>) => Promise<{ customer: CustomerUser | null; error: string | null }>;
  updateCustomerPassword: (newPassword: string) => Promise<{ error: string | null }>;
}

export const useCustomerAuth = create<CustomerAuthState>()(
  persist(
    (set, get) => ({
      customer: null,
      loading: false,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
      setCustomerLoading: (loading) => set({ loading }),
      setCustomer: (customer) => set({ customer }),

      refreshCustomer: async () => {
        const { customer } = get();
        if (!customer) return;

        try {
            const response = await fetch('/api/customers/get-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: customer.id, siteId: customer.site_id }),
            });
            const result = await response.json();
            if (response.ok) {
                set({ customer: result.customer });
            }
        } catch (error) {
            console.error("Failed to refresh customer profile:", error);
        }
      },

      registerCustomer: async (fullName, email, password, siteId) => {
        try {
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

      customerLogin: async (email, password, siteId) => {
        set({ loading: true });
        try {
          const response = await fetch('/api/auth/login-customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, siteId }),
          });
          const result = await response.json();
          if (!response.ok) {
            return { error: { message: result.error } };
          }
          set({ customer: result.user as CustomerUser });
          return { error: null };
        } catch (e: any) {
          return { error: { message: e.message || 'Login request failed.' }};
        } finally {
          set({ loading: false });
        }
      },

      customerLogout: async () => {
        set({ customer: null });
      },
      
      updateCustomerProfile: async (updates) => {
        const { customer } = get();
        if (!customer) return { customer: null, error: "Not logged in" };

        try {
            const response = await fetch('/api/auth/update-customer-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: customer.id,
                    siteId: customer.site_id,
                    updates: { full_name: updates.full_name },
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return { customer: null, error: result.error || "Failed to update profile." };
            }

            const newCustomer = result.customer as CustomerUser;
            set({ customer: newCustomer });
            return { customer: newCustomer, error: null };

        } catch (e: any) {
            return { customer: null, error: e.message || "An unknown network error occurred." };
        }
      },

      updateCustomerPassword: async (newPassword: string) => {
        const { customer } = get();
        if (!customer) return { error: "Not logged in" };
        
        try {
            const response = await fetch('/api/auth/update-customer-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: customer.id, siteId: customer.site_id, newPassword }),
            });

            if (!response.ok) {
                const { error } = await response.json();
                return { error };
            }

            return { error: null };
        } catch (e: any) {
            return { error: e.message || 'Request to update password failed' };
        }
      }
    }),
    {
      name: 'customer-auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Refresh customer data on page load if logged in
        if (state?.customer) {
            state.refreshCustomer();
        }
      },
       partialize: (state) => ({ customer: state.customer }),
    }
  )
);
