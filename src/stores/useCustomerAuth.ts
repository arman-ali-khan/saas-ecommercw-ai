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
  _hasHydrated: boolean; 
  setHasHydrated: (state: boolean) => void; 
  isLoading: boolean;
  customerLogin: (email: string, password: string, siteId: string) => Promise<{ error: string | null }>;
  refreshCustomer: () => Promise<void>; // সেশন চেক করার জন্য
  customerLogout: () => void;
  setCustomer: (customer: CustomerUser | null) => void;
}

export const useCustomerAuth = create<CustomerAuthState>()(
  persist(
    (set, get) => ({ // এখানে 'get' যোগ করা হয়েছে
      customer: null,
      isLoading: false,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      // Dedicated Login for Customers
      customerLogin: async (email, password, siteId) => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/auth/login-customer', {
            method: 'POST',
            body: JSON.stringify({ email, password, siteId }),
            headers: { 'Content-Type': 'application/json' },
          });

          const result = await response.json();

          if (!response.ok) {
            set({ isLoading: false });
            return { error: result.error || 'Login failed' };
          }

          set({ customer: result.user, isLoading: false });
          return { error: null };
        } catch (err) {
          set({ isLoading: false });
          return { error: 'সার্ভারের সাথে সংযোগ বিচ্ছিন্ন হয়েছে' };
        }
      },

      // ডাটাবেসের সাথে সেশন ভেরিফাই করা
      refreshCustomer: async () => {
        const currentCustomer = get().customer; // এখন get() কাজ করবে
        if (!currentCustomer) return;
      
        try {
          const response = await fetch('/api/auth/get-customer', {
            method: 'POST',
            body: JSON.stringify({ userId: currentCustomer.id }),
            headers: { 'Content-Type': 'application/json' },
          });
          
          const result = await response.json();
          if (response.ok) {
            if (JSON.stringify(result.user) !== JSON.stringify(currentCustomer)) {
              set({ customer: result.user });
            }
          } else {
            set({ customer: null }); // যদি ডাটাবেসে ইউজার না থাকে তবে লগআউট
          }
        } catch (error) {
          console.error("Refresh failed:", error);
          // সার্ভার ডাউন থাকলে বর্তমান স্টেট রেখে দেবে
        }
      },

      customerLogout: () => {
        set({ customer: null });
        // LocalStorage থেকে ডাটা ক্লিয়ার করতে চাইলে নিচের লাইনটি ব্যবহার করতে পারেন
        // localStorage.removeItem('customer-auth-storage');
      },

      setCustomer: (customer) => set({ customer }),
    }),
    {
      name: 'customer-auth-storage', // এটি অবশ্যই থাকবে
      storage: createJSONStorage(() => localStorage), // এটি অবশ্যই থাকবে
      onRehydrateStorage: () => (state) => {
        // পেজ লোড হয়ে ডাটা LocalStorage থেকে আসা শেষ হলে এটি কল হয়
        state?.setHasHydrated(true);
      },
    }
  )
);