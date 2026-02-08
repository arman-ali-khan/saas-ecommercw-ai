'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

// This is a simplified, insecure auth system for demonstration purposes.
// Do NOT use this in a production environment.

const SAAS_ADMIN_EMAIL = 'admin@banglanaturals.com';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => User | null;
  register: (name: string, fullName: string, email: string, password: string, domain: string, siteName: string) => User | null;
  logout: () => void;
  isLoading: boolean;
  updateUser: (userId: string, updates: { fullName?: string; }) => User | null;
  checkUsername: (username: string, userId: string) => Promise<'AVAILABLE' | 'TAKEN' | 'INVALID'>;
  allUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('bangla-naturals-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      
      const storedUsers = localStorage.getItem('bangla-naturals-users');
      if (storedUsers) {
        setAllUsers(JSON.parse(storedUsers).map((u: any) => {
          const { passwordHash, ...userToReturn } = u;
          return userToReturn;
        }));
      }

    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (email: string, password: string): User | null => {
    try {
      const storedUsers = localStorage.getItem('bangla-naturals-users');
      const users: (User & { passwordHash: string })[] = storedUsers
        ? JSON.parse(storedUsers)
        : [];
      
      // Special case for SaaS admin
      if (email === SAAS_ADMIN_EMAIL && password === 'admin') {
        const adminUser: User = {
          id: 'saas-admin',
          name: 'SaaS Admin',
          fullName: 'SaaS Admin',
          email: SAAS_ADMIN_EMAIL,
          isSaaSAdmin: true,
          domain: '',
          siteName: '',
        };
        localStorage.setItem('bangla-naturals-user', JSON.stringify(adminUser));
        setUser(adminUser);
        toast({ title: 'Admin login successful' });
        router.push('/dashboard');
        return adminUser;
      }
      
      const foundUser = users.find((u) => u.email === email);

      if (foundUser) {
        const { passwordHash, ...userToStore } = foundUser;
        localStorage.setItem('bangla-naturals-user', JSON.stringify(userToStore));
        setUser(userToStore);
        toast({ title: 'লগইন সফল', description: `আবারও স্বাগতম, ${userToStore.fullName}!` });
        router.push(`/${userToStore.domain}/profile`);
        return userToStore;
      }
      toast({
        variant: 'destructive',
        title: 'লগইন ব্যর্থ',
        description: 'অবৈধ ইমেল বা পাসওয়ার্ড।',
      });
      return null;
    } catch (e) {
      console.error('Login failed', e);
      toast({
        variant: 'destructive',
        title: 'একটি ত্রুটি ঘটেছে',
        description: 'আপনার লগইন অনুরোধ প্রক্রিয়া করা যায়নি।',
      });
      return null;
    }
  };

  const register = (name: string, fullName: string, email: string, password: string, domain: string, siteName: string): User | null => {
    if (email === SAAS_ADMIN_EMAIL) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: 'This email is reserved.',
      });
      return null;
    }
    try {
      const storedUsers = localStorage.getItem('bangla-naturals-users');
      const users: (User & { passwordHash: string })[] = storedUsers
        ? JSON.parse(storedUsers)
        : [];

      if (users.some((u) => u.email === email)) {
        toast({
          variant: 'destructive',
          title: 'নিবন্ধন ব্যর্থ',
          description: 'এই ইমেল দিয়ে একটি অ্যাকাউন্ট ইতিমধ্যে বিদ্যমান।',
        });
        return null;
      }
      
      if (users.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
        toast({
          variant: 'destructive',
          title: 'ব্যবহারকারীর নাম বিদ্যমান',
          description: 'এই ব্যবহারকারীর নামটি ইতিমধ্যে ব্যবহৃত হচ্ছে।',
        });
        return null;
      }
      
      if (domain && users.some((u) => u.domain && u.domain.toLowerCase() === domain.toLowerCase())) {
        toast({
          variant: 'destructive',
          title: 'ডোমেইন নাম বিদ্যমান',
          description: 'এই ডোমেইন নামটি ইতিমধ্যে ব্যবহৃত হচ্ছে।',
        });
        return null;
      }

      if (/[^a-zA-Z0-9]/.test(name)) {
        toast({
          variant: 'destructive',
          title: 'নিবন্ধন ব্যর্থ',
          description: 'ব্যবহারকারীর নাম শুধুমাত্র অক্ষর এবং সংখ্যা থাকতে পারে।',
        });
        return null;
      }
      
      if (!domain) {
        toast({
          variant: 'destructive',
          title: 'নিবন্ধন ব্যর্থ',
          description: 'ডোমেইন নাম প্রয়োজন।',
        });
        return null;
      }

      const newUser: User = { id: Date.now().toString(), name, fullName, email, domain, siteName, isSaaSAdmin: false };
      const newUserWithPassword = { ...newUser, passwordHash: password }; // Store password directly for demo

      users.push(newUserWithPassword);
      const allUsersToStore = users.map(u => {
        const { passwordHash, ...userToReturn } = u;
        return userToReturn;
      });
      setAllUsers(allUsersToStore);

      localStorage.setItem('bangla-naturals-users', JSON.stringify(users));
      localStorage.setItem('bangla-naturals-user', JSON.stringify(newUser));
      setUser(newUser);
      toast({ title: 'নিবন্ধন সফল', description: `স্বাগতম, ${fullName}!` });
      router.push(`/${newUser.domain}/profile`);
      return newUser;
    } catch (e) {
      console.error('Registration failed', e);
      toast({
        variant: 'destructive',
        title: 'একটি ত্রুটি ঘটেছে',
        description: 'আপনার নিবন্ধন অনুরোধ প্রক্রিয়া করা যায়নি।',
      });
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('bangla-naturals-user');
    setUser(null);
    toast({ title: 'লগ আউট', description: "আপনি সফলভাবে লগ আউট হয়েছেন।" });
    router.push('/');
  };

  const updateUser = (userId: string, updates: { fullName?: string; }): User | null => {
    try {
      const storedUsers = localStorage.getItem('bangla-naturals-users');
      let users: (User & { passwordHash: string })[] = storedUsers ? JSON.parse(storedUsers) : [];
      
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
          toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
          return null;
      }
      
      const currentUser = users[userIndex];
      const updatedUserWithPassword = { ...currentUser, ...updates };
      users[userIndex] = updatedUserWithPassword;

      const { passwordHash, ...userToStore } = updatedUserWithPassword;

      localStorage.setItem('bangla-naturals-users', JSON.stringify(users));
      setAllUsers(users.map(u => {
        const { passwordHash, ...userToReturn } = u;
        return userToReturn;
      }));

      // Also update current user if it's the one being edited
      if (user?.id === userId) {
        localStorage.setItem('bangla-naturals-user', JSON.stringify(userToStore));
        setUser(userToStore);
      }

      return userToStore;
    } catch (e) {
      console.error('Update failed', e);
      toast({
        variant: 'destructive',
        title: 'একটি ত্রুটি ঘটেছে',
        description: 'আপনার প্রোফাইল আপডেট করা যায়নি।',
      });
      return null;
    }
  };

  const checkUsername = async (username: string, userId: string): Promise<'AVAILABLE' | 'TAKEN' | 'INVALID'> => {
    if (/[^a-zA-Z0-9]/.test(username)) {
        return 'INVALID';
    }
    try {
        const storedUsers = localStorage.getItem('bangla-naturals-users');
        const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
        const isTaken = users.some(u => u.name.toLowerCase() === username.toLowerCase() && u.id !== userId);
        
        await new Promise(resolve => setTimeout(resolve, 500));

        return isTaken ? 'TAKEN' : 'AVAILABLE';
    } catch {
        return 'TAKEN';
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, updateUser, checkUsername, allUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
