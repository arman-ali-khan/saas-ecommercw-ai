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
  const { setCustomer, refreshCustomer } = useCustomerAuth();

  useEffect(() => {
    setLoading(true);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session: Session | null) => {
      setSession(session);

      if (session?.user) {
        const role = session.user.user_metadata?.role;
        
        // This logic determines which user profile to refresh based on the role
        // in the session. We avoid resetting the state to null prematurely, which
        // was causing the component tree to unmount and remount on tab focus.
        if (role === 'admin' || role === 'saas_admin') {
          await refreshUser();
        } else if (role === 'customer') {
          await refreshCustomer();
        }
      } else {
        // No session, user is logged out, clear both user states.
        setUser(null);
        setCustomer(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setSession, setLoading, refreshUser, setCustomer, refreshCustomer]);

  return <>{children}</>;
}
