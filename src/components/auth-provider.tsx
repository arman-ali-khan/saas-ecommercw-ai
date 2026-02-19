'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/stores/auth';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { supabase } from '@/lib/supabase/client';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setUser, setSession, setLoading, refreshUser } = useAuth();
  const { setCustomer } = useCustomerAuth();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    setLoading(true);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session?.user) {
        const role = session.user.user_metadata?.role;
        if (role === 'admin' || role === 'saas_admin') {
          setCustomer(null);
          await refreshUser();
        } else {
          setUser(null);
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setSession, setLoading, refreshUser, setCustomer]);

  return <>{children}</>;
}