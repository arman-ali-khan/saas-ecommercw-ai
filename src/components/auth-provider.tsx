'use client';

import { useEffect } from 'react';
import { useAuth } from '@/stores/auth';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { supabase } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setUser, setSession, setLoading, refreshUser } = useAuth();
  const { setCustomer, refreshCustomer, setCustomerLoading } = useCustomerAuth();

  useEffect(() => {
    setLoading(true);
    setCustomerLoading(true);

    // Initial check on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const role = session.user.user_metadata?.role;
        if (role === 'admin' || role === 'saas_admin') {
          await refreshUser();
          setCustomer(null);
        } else if (role === 'customer') {
          await refreshCustomer();
          setUser(null);
        }
      }
      setLoading(false);
      setCustomerLoading(false);
    });

    // Listen for subsequent changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const role = session.user.user_metadata?.role;
        if (role === 'admin' || role === 'saas_admin') {
          await refreshUser();
          setCustomer(null);
        } else if (role === 'customer') {
          await refreshCustomer();
          setUser(null);
        } else {
          setUser(null);
          setCustomer(null);
        }
      } else {
        setUser(null);
        setCustomer(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setSession, setLoading, refreshUser, setCustomer, refreshCustomer, setCustomerLoading]);

  return <>{children}</>;
}
