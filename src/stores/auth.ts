import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

const SAAS_ADMIN_EMAIL = 'admin@banglanaturals.com';

type StoredUser = User & { passwordHash: string };

interface AuthState {
  user: User | null;
  allUsers: StoredUser[]; // Store with password hash for login check
  login: (email: string, password: string) => User | null;
  register: (name: string, fullName: string, email: string, password: string, domain: string, siteName: string) => { user: User | null, error?: string };
  logout: () => void;
  updateUser: (userId: string, updates: { fullName?: string }) => User | null;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      allUsers: [],
      login: (email, password) => {
        if (email === SAAS_ADMIN_EMAIL && password === 'admin') {
            const adminUser: User = { id: 'saas-admin', name: 'SaaS Admin', fullName: 'SaaS Admin', email: SAAS_ADMIN_EMAIL, isSaaSAdmin: true, domain: '', siteName: '' };
            set({ user: adminUser });
            return adminUser;
        }
        const foundUser = get().allUsers.find((u) => u.email === email);
        if (foundUser) { // In real app, check password hash
            const { passwordHash, ...userToStore } = foundUser;
            set({ user: userToStore });
            return userToStore;
        }
        return null;
      },
      register: (name, fullName, email, password, domain, siteName) => {
        const { allUsers } = get();
        if (email === SAAS_ADMIN_EMAIL) return { user: null, error: 'This email is reserved.' };
        if (allUsers.some((u) => u.email === email)) return { user: null, error: 'এই ইমেল দিয়ে একটি অ্যাকাউন্ট ইতিমধ্যে বিদ্যমান।' };
        if (allUsers.some((u) => u.name.toLowerCase() === name.toLowerCase())) return { user: null, error: 'এই ব্যবহারকারীর নামটি ইতিমধ্যে ব্যবহৃত হচ্ছে।'};
        if (domain && allUsers.some((u) => u.domain && u.domain.toLowerCase() === domain.toLowerCase())) return { user: null, error: 'এই ডোমেইন নামটি ইতিমধ্যে ব্যবহৃত হচ্ছে।'};
        if (/[^a-zA-Z0-9]/.test(name)) return { user: null, error: 'ব্যবহারকারীর নাম শুধুমাত্র অক্ষর এবং সংখ্যা থাকতে পারে।'};
        if (!domain) return { user: null, error: 'ডোমেইন নাম প্রয়োজন।' };

        const newUser: User = { id: Date.now().toString(), name, fullName, email, domain, siteName, isSaaSAdmin: false };
        const newUserWithPassword: StoredUser = { ...newUser, passwordHash: password };
        
        set(state => ({
            user: newUser,
            allUsers: [...state.allUsers, newUserWithPassword]
        }));
        
        return { user: newUser };
      },
      logout: () => set({ user: null }),
      updateUser: (userId, updates) => {
        let userToReturn: User | null = null;
        set(state => {
            const userIndex = state.allUsers.findIndex(u => u.id === userId);
            if (userIndex === -1) return state;

            const updatedUsers = [...state.allUsers];
            const updatedUserWithPassword = { ...updatedUsers[userIndex], ...updates };
            updatedUsers[userIndex] = updatedUserWithPassword;

            const { passwordHash, ...userToStore } = updatedUserWithPassword;
            userToReturn = userToStore;
            
            let finalUser = state.user;
            if (state.user?.id === userId) {
                finalUser = userToStore;
            }

            return { allUsers: updatedUsers, user: finalUser };
        });
        return userToReturn;
      },
    }),
    {
      name: 'bangla-naturals-auth', // a single key for auth state
      storage: createJSONStorage(() => localStorage),
    }
  )
);
