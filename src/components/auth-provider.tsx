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
        
        if (role === 'admin' || role === 'saas_admin') {
          await refreshUser();
          setCustomer(null); // Ensure other user type is cleared
        } else if (role === 'customer') {
          await refreshCustomer();
          setUser(null); // Ensure other user type is cleared
        } else {
          // If role is unknown, clear everything
          setUser(null);
          setCustomer(null);
        }
      } else {
        // No session, user is logged out, clear both user states.
        setUser(null);
        setCustomer(null);
      }
      setLoading(false); // Set loading to false only after all async operations are complete
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setSession, setLoading, refreshUser, setCustomer, refreshCustomer]);

  return <>{children}</>;
}
