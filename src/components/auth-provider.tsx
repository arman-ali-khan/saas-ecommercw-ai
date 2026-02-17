
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
  const { setCustomer } = useCustomerAuth();

  useEffect(() => {
    setLoading(true);

    // Initial check on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const role = session.user.user_metadata?.role;
        // This provider now ONLY handles admin/saas_admin
        if (role === 'admin' || role === 'saas_admin') {
          await refreshUser();
          setCustomer(null); // Ensure customer is logged out
        }
      }
      setLoading(false);
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
        } else {
          // If a non-admin logs in via Supabase, clear our admin state
          setUser(null);
        }
      } else {
        // If logged out from Supabase, clear admin state
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setSession, setLoading, refreshUser, setCustomer]);

  return <>{children}</>;
}
