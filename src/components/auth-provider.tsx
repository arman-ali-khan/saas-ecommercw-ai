'use client';

import { useEffect } from 'react';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@/types';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setUser, setSession, setLoading } = useAuth();

  useEffect(() => {
    setLoading(true);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile && !error) {
          const appUser: User = {
            id: profile.id,
            username: profile.username,
            fullName: profile.full_name,
            email: session.user.email!,
            domain: profile.domain,
            siteName: profile.site_name,
            siteDescription: profile.site_description,
            subscriptionPlan: profile.subscription_plan,
            role: profile.role,
            isSaaSAdmin: profile.role === 'saas_admin',
          };
          setUser(appUser);
        } else {
          // If profile is missing, user should be logged out
          setUser(null);
          await supabase.auth.signOut();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setSession, setLoading]);

  return <>{children}</>;
}
