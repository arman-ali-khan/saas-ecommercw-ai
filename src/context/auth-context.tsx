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

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('bangla-naturals-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    try {
      const storedUsers = localStorage.getItem('bangla-naturals-users');
      const users: (User & { passwordHash: string })[] = storedUsers
        ? JSON.parse(storedUsers)
        : [];
      const foundUser = users.find((u) => u.email === email);

      // In a real app, you would compare a hashed password.
      // This is just a simple check for the demo.
      if (foundUser) {
        const { passwordHash, ...userToStore } = foundUser;
        localStorage.setItem('bangla-naturals-user', JSON.stringify(userToStore));
        setUser(userToStore);
        toast({ title: 'লগইন সফল', description: `আবারও স্বাগতম, ${userToStore.name}!` });
        return true;
      }
      toast({
        variant: 'destructive',
        title: 'লগইন ব্যর্থ',
        description: 'অবৈধ ইমেল বা পাসওয়ার্ড।',
      });
      return false;
    } catch (e) {
      console.error('Login failed', e);
      toast({
        variant: 'destructive',
        title: 'একটি ত্রুটি ঘটেছে',
        description: 'আপনার লগইন অনুরোধ প্রক্রিয়া করা যায়নি।',
      });
      return false;
    }
  };

  const register = (name: string, email: string, password: string): boolean => {
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
        return false;
      }

      const newUser: User = { id: Date.now().toString(), name, email };
      const newUserWithPassword = { ...newUser, passwordHash: password }; // Store password directly for demo

      users.push(newUserWithPassword);
      localStorage.setItem('bangla-naturals-users', JSON.stringify(users));
      localStorage.setItem('bangla-naturals-user', JSON.stringify(newUser));
      setUser(newUser);
      toast({ title: 'নিবন্ধন সফল', description: `স্বাগতম, ${name}!` });
      return true;
    } catch (e) {
      console.error('Registration failed', e);
      toast({
        variant: 'destructive',
        title: 'একটি ত্রুটি ঘটেছে',
        description: 'আপনার নিবন্ধন অনুরোধ প্রক্রিয়া করা যায়নি।',
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('bangla-naturals-user');
    setUser(null);
    toast({ title: 'লগ আউট', description: "আপনি সফলভাবে লগ আউট হয়েছেন।" });
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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
